/**
 * CodeSense AI — Assist endpoint tests.
 *
 * Two layers, mirroring the existing suite architecture:
 * 1. Route-level integration tests (supertest) for auth, validation, and the
 *    honest provider-unavailable state (no GEMINI_API_KEY configured).
 * 2. Adapter-level unit tests with an injected fake genAI transport for the
 *    explain/improve parsing paths — deterministic, no network, no key.
 *
 * The route layer starts the full app (session store keeps an open handle),
 * so this file uses the suite's sequential + explicit-exit pattern.
 */

const assert = require('node:assert/strict');
const { start, stop } = require('./setup.js');
const supertest = require('supertest');
const { GeminiAdapter } = require('../src/providers/gemini.js');

function makeGenAI(generateContentImpl) {
  const model = { generateContent: generateContentImpl };
  return { getGenerativeModel: () => model };
}

function adapterWithMock(generateContentImpl) {
  return new GeminiAdapter({
    apiKey: 'test-key-not-used',
    model: 'gemini-1.5-flash-latest',
    timeoutMs: 5000,
    maxRetries: 0,
    maxOutputChars: 32768,
    genAI: makeGenAI(generateContentImpl),
  });
}

async function makeAuthedAgent(app, email) {
  const agent = supertest.agent(app);
  await agent.post('/api/v1/auth/register').send({ email, password: 'Password123' });
  await agent.post('/api/v1/auth/login').send({ email, password: 'Password123' });
  const csrf = await agent.get('/api/v1/auth/csrf-token');
  return { agent, csrfToken: csrf.body.csrfToken };
}

async function test() {
  const { app } = await start();

  // --- Route layer ---------------------------------------------------------

  // T-ASSIST-01: requires authentication.
  {
    const agent = supertest.agent(app);
    const res = await agent.post('/api/v1/assist').send({
      action: 'explain',
      source: 'const x = 1;',
      language: 'javascript',
    });
    assert.strictEqual(res.status, 401);
  }

  // T-ASSIST-02: rejects an unknown action.
  {
    const { agent, csrfToken } = await makeAuthedAgent(app, 'assist1@example.com');
    const res = await agent
      .post('/api/v1/assist')
      .set('X-CSRF-Token', csrfToken)
      .send({ action: 'delete-everything', source: 'const x = 1;', language: 'javascript' });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
  }

  // T-ASSIST-03: rejects empty source.
  {
    const { agent, csrfToken } = await makeAuthedAgent(app, 'assist2@example.com');
    const res = await agent
      .post('/api/v1/assist')
      .set('X-CSRF-Token', csrfToken)
      .send({ action: 'explain', source: '', language: 'javascript' });
    assert.strictEqual(res.status, 400);
  }

  // T-ASSIST-04: honest provider-unavailable state (no API key in tests).
  {
    const { agent, csrfToken } = await makeAuthedAgent(app, 'assist3@example.com');
    const res = await agent
      .post('/api/v1/assist')
      .set('X-CSRF-Token', csrfToken)
      .send({ action: 'explain', source: 'const x = 1;', language: 'javascript' });
    assert.strictEqual(res.status, 503);
    assert.strictEqual(res.body.error.code, 'PROVIDER_UNAVAILABLE');
  }

  // T-ASSIST-05: requires CSRF token on the mutating endpoint.
  {
    const { agent } = await makeAuthedAgent(app, 'assist4@example.com');
    const res = await agent
      .post('/api/v1/assist')
      .send({ action: 'explain', source: 'const x = 1;', language: 'javascript' });
    assert.strictEqual(res.status, 403);
  }

  await stop();

  // --- Adapter layer (mocked genAI; no app required) -----------------------

  // T-ASSIST-06: normalized explanation.
  {
    const adapter = adapterWithMock(async () => ({
      response: {
        text: () =>
          JSON.stringify({
            explanation: 'This code declares a constant.',
            keyPoints: ['Declares x', 'Assigns 1'],
            caveats: null,
          }),
      },
    }));
    const result = await adapter.assist({
      source: 'const x = 1;',
      language: 'javascript',
      action: 'explain',
    });
    assert.strictEqual(result.action, 'explain');
    assert.strictEqual(result.explanation, 'This code declares a constant.');
    assert.deepStrictEqual(result.keyPoints, ['Declares x', 'Assigns 1']);
    assert.strictEqual(result.caveats, null);
    assert.strictEqual(result.provider, 'gemini');
    assert.strictEqual(result.promptVersion, '1.0');
  }

  // T-ASSIST-07: explanation response missing the required field.
  {
    const adapter = adapterWithMock(async () => ({
      response: { text: () => JSON.stringify({ keyPoints: [] }) },
    }));
    await assert.rejects(
      () => adapter.assist({ source: 'x', language: 'javascript', action: 'explain' }),
      (err) => err.code === 'INVALID_PROVIDER_RESPONSE'
    );
  }

  // T-ASSIST-08: normalized improvement proposal.
  {
    const adapter = adapterWithMock(async () => ({
      response: {
        text: () =>
          JSON.stringify({
            improvedCode: 'const x = 1; // documented',
            changes: [{ title: 'Add comment', explanation: 'Clarifies intent.' }],
            summary: 'Documentation added.',
            caveats: null,
          }),
      },
    }));
    const result = await adapter.assist({
      source: 'const x = 1;',
      language: 'javascript',
      action: 'improve',
    });
    assert.strictEqual(result.action, 'improve');
    assert.strictEqual(result.improvedCode, 'const x = 1; // documented');
    assert.strictEqual(result.changes.length, 1);
    assert.strictEqual(result.changes[0].title, 'Add comment');
    assert.strictEqual(result.summary, 'Documentation added.');
  }

  // T-ASSIST-09: improvement response missing improvedCode.
  {
    const adapter = adapterWithMock(async () => ({
      response: { text: () => JSON.stringify({ changes: [], summary: 'x' }) },
    }));
    await assert.rejects(
      () => adapter.assist({ source: 'x', language: 'javascript', action: 'improve' }),
      (err) => err.code === 'INVALID_PROVIDER_RESPONSE'
    );
  }

  // T-ASSIST-10: unknown action rejected.
  {
    const adapter = adapterWithMock(async () => ({ response: { text: () => '{}' } }));
    await assert.rejects(
      () => adapter.assist({ source: 'x', language: 'javascript', action: 'explode' }),
      (err) => err.code === 'INVALID_ASSIST_ACTION'
    );
  }

  // T-ASSIST-11: script-like content sanitized in explain responses.
  {
    const adapter = adapterWithMock(async () => ({
      response: {
        text: () =>
          JSON.stringify({
            explanation: 'safe <script>alert(1)</script> text',
            keyPoints: ['<b>bold</b> point', 'javascript:alert(1)'],
            caveats: null,
          }),
      },
    }));
    const result = await adapter.assist({
      source: 'x',
      language: 'javascript',
      action: 'explain',
    });
    assert.ok(!result.explanation.includes('<script>'));
    assert.ok(!result.keyPoints.some((p) => p && p.includes('<b>')));
    assert.ok(!result.keyPoints.some((p) => p && p.startsWith('javascript:')));
  }

  console.log('assist tests: PASS');
  process.exit(0);
}

test().catch((err) => {
  console.error('assist tests: FAIL', err);
  process.exit(1);
});
