/**
 * CodeSense AI — Authentication tests.
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

async function test() {
  ({ app, mongod } = await start());
  const agent = supertest.agent(app);

  // T-AUTH-01: register valid user
  {
    const res = await agent
      .post('/api/v1/auth/register')
      .send({ email: 'alice@example.com', password: 'Password123' });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.created, true);
    assert.strictEqual(res.body.user.email, 'alice@example.com');
    assert.ok(res.body.user.id);
  }

  // T-AUTH-02: duplicate registration — no duplicate account, generic response
  {
    const res = await agent
      .post('/api/v1/auth/register')
      .send({ email: 'alice@example.com', password: 'Password123' });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.created, false);
  }

  // T-AUTH-03: login wrong password — generic failure, no session
  {
    const res = await agent
      .post('/api/v1/auth/login')
      .send({ email: 'alice@example.com', password: 'WrongPassword123' });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error.code, 'UNAUTHENTICATED');
  }

  // T-AUTH-03b: login valid
  {
    const res = await agent
      .post('/api/v1/auth/login')
      .send({ email: 'alice@example.com', password: 'Password123' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.email, 'alice@example.com');
  }

  // T-AUTH-04: get me (authenticated)
  {
    const res = await agent.get('/api/v1/auth/me');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.email, 'alice@example.com');
    assert.ok(!res.body.user.passwordHash);
  }

  // T-AUTH-05: logout then replay
  {
    const token = await csrfToken(agent);
    const res = await agent
      .post('/api/v1/auth/logout')
      .set('X-CSRF-Token', token);
    assert.strictEqual(res.status, 200);
    // Session destroyed — me should now fail
    const me = await agent.get('/api/v1/auth/me');
    assert.strictEqual(me.status, 401);
  }

  await stop(mongod);
  console.log('auth tests: PASS');
}

test().catch((err) => {
  console.error('auth tests: FAIL', err);
  process.exit(1);
});
