/**
 * CodeSense AI — Review tests.
 */

const assert = require('node:assert/strict');
const { start, stop } = require('./setup.js');
const supertest = require('supertest');

let app, mongod;

async function csrfToken(agent) {
  const res = await agent.get('/api/v1/auth/csrf-token');
  assert.strictEqual(res.status, 200);
  return res.body.csrfToken;
}

async function registerAndLogin(agent, email, password) {
  await agent.post('/api/v1/auth/register').send({ email, password });
  const res = await agent.post('/api/v1/auth/login').send({ email, password });
  assert.strictEqual(res.status, 200);
}

async function test() {
  ({ app, mongod } = await start());
  const agent = supertest.agent(app);

  await registerAndLogin(agent, 'bob@example.com', 'Password123');

  // T-REV-01: valid source — review created; provider failure is honest (not fabricated)
  {
    const token = await csrfToken(agent);
    const res = await agent
      .post('/api/v1/reviews')
      .set('X-CSRF-Token', token)
      .send({
        source: 'function add(a, b) { return a + b; }\n',
        language: 'javascript',
        title: 'add function',
      });
    // No provider key in tests → honest provider-unavailable path, never
    // fabricated, never a real network call to Gemini.
    assert.strictEqual(res.status, 502, `expected 502 provider-unavailable, got ${res.status}`);
    assert.ok(res.body.reviewId, 'reviewId should be present');
    assert.strictEqual(res.body.status, 'failed');
    assert.strictEqual(res.body.providerUnavailable, true);
    assert.ok(res.body.failureReason, 'failed review should have a reason');
  }

  // CSRF regression — stale token after session regeneration is rejected.
  {
    // Capture a token before login; login regenerates the session and issues a
    // fresh token. The pre-login token must now be rejected.
    const staleToken = await csrfToken(agent);
    await agent.post('/api/v1/auth/login').send({ email: 'bob@example.com', password: 'Password123' });
    const res = await agent
      .post('/api/v1/reviews')
      .set('X-CSRF-Token', staleToken)
      .send({ source: 'function add(a, b) { return a + b; }\n', language: 'javascript' });
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.error.code, 'CSRF_ERROR');
  }

  // CSRF regression — fresh token issued after regeneration is accepted.
  {
    const fresh = await csrfToken(agent);
    const res = await agent
      .post('/api/v1/reviews')
      .set('X-CSRF-Token', fresh)
      .send({ source: 'function add(a, b) { return a + b; }\n', language: 'javascript' });
    assert.strictEqual(res.status, 502); // provider not configured in tests
    assert.strictEqual(res.body.providerUnavailable, true);
  }

  // T-REV-02: empty source rejected
  {
    const token = await csrfToken(agent);
    const res = await agent
      .post('/api/v1/reviews')
      .set('X-CSRF-Token', token)
      .send({ source: '   ', language: 'javascript' });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
  }

  // T-REV-02b: missing source rejected
  {
    const token = await csrfToken(agent);
    const res = await agent
      .post('/api/v1/reviews')
      .set('X-CSRF-Token', token)
      .send({ language: 'javascript' });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
  }

  // T-LANG-06: unknown language rejected before provider call
  {
    const token = await csrfToken(agent);
    const res = await agent
      .post('/api/v1/reviews')
      .set('X-CSRF-Token', token)
      .send({ source: 'print(1)\n', language: 'nonexistent-language' });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
  }

  // T-REV-02c: oversized source rejected (64 KiB cap)
  {
    const token = await csrfToken(agent);
    const big = 'x'.repeat(70 * 1024);
    const res = await agent
      .post('/api/v1/reviews')
      .set('X-CSRF-Token', token)
      .send({ source: big, language: 'javascript' });
    assert.strictEqual(res.status, 413);
    assert.strictEqual(res.body.error.code, 'PAYLOAD_TOO_LARGE');
  }

  // T-REV-05: no CSRF token rejected
  {
    const res = await agent
      .post('/api/v1/reviews')
      .send({ source: 'print(1)\n', language: 'python' });
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.error.code, 'CSRF_ERROR');
  }

  // T-HIST-01: list reviews — owner scoped
  {
    const res = await agent.get('/api/v1/reviews');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.reviews));
    assert.ok(res.body.reviews.length >= 1);
    // All reviews belong to bob
    for (const r of res.body.reviews) {
      assert.ok(r._id);
      assert.strictEqual(r.language, 'javascript');
    }
  }

  // Get the created review id
  const listRes = await agent.get('/api/v1/reviews?limit=1');
  const reviewId = listRes.body.reviews[0]._id;

  // T-HIST-03: get review by ID (owner)
  {
    const res = await agent.get(`/api/v1/reviews/${reviewId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.review._id, reviewId);
    assert.ok(res.body.review.source, 'source should be retained');
  }

  // T-HIST-01 cross-user: register second user, try to access bob's review
  {
    const agent2 = supertest.agent(app);
    await registerAndLogin(agent2, 'carol@example.com', 'Password123');
    const token = await csrfToken(agent2);
    await agent2
      .post('/api/v1/reviews')
      .set('X-CSRF-Token', token)
      .send({ source: 'print("carol")\n', language: 'python' });
    const carolList = await agent2.get('/api/v1/reviews');
    assert.strictEqual(carolList.body.reviews.length, 1);

    // Carol requests Bob's review — not found (no data leak)
    const res = await agent2.get(`/api/v1/reviews/${reviewId}`);
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.error.code, 'NOT_FOUND');

    // Carol deletes Bob's review — not found (needs valid CSRF + owner mismatch)
    const carolToken = await csrfToken(agent2);
    const del = await agent2
      .delete(`/api/v1/reviews/${reviewId}`)
      .set('X-CSRF-Token', carolToken);
    assert.strictEqual(del.status, 404);
  }

  // T-HIST-02: delete own review
  {
    const token = await csrfToken(agent);
    const res = await agent
      .delete(`/api/v1/reviews/${reviewId}`)
      .set('X-CSRF-Token', token);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.message, 'Review deleted.');
    // Gone after deletion
    const get = await agent.get(`/api/v1/reviews/${reviewId}`);
    assert.strictEqual(get.status, 404);
  }

  // Unauthenticated access rejected
  {
    const anon = supertest(app);
    const res = await anon.get('/api/v1/reviews');
    assert.strictEqual(res.status, 401);
  }

  await stop(mongod);
  console.log('review tests: PASS');
  process.exit(0);
}

test().catch((err) => {
  console.error('review tests: FAIL', err);
  process.exit(1);
});
