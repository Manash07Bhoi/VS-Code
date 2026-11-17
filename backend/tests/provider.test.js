/**
 * CodeSense AI — Gemini provider unit tests (deterministic, mocked).
 *
 * These tests inject a fake `genAI` transport into GeminiAdapter so no real
 * network request is ever made and no Gemini API key is required. They cover
 * the retry/deadline/cancellation behavior required by Critical Defect 2.
 */

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { GeminiAdapter } = require('../src/providers/gemini.js');

// ---------------------------------------------------------------------------
// Test doubles
// ---------------------------------------------------------------------------

function makeGenAI(generateContentImpl) {
  const model = { generateContent: generateContentImpl };
  return { getGenerativeModel: () => model };
}

function adapterWithMock({ generateContentImpl, timeoutMs = 5000, maxRetries = 2 }) {
  const genAI = makeGenAI(generateContentImpl);
  return new GeminiAdapter({
    apiKey: 'test-key-not-used',
    model: 'gemini-1.5-flash-latest',
    timeoutMs,
    maxRetries,
    maxOutputChars: 32768,
    genAI,
  });
}

// A well-formed provider response.
function successResponse(findings = []) {
  return {
    response: {
      text: () =>
        JSON.stringify({
          findings,
          summary: 'Review complete.',
          limitationNotice: 'AI-assisted findings are advisory.',
        }),
    },
  };
}

const SOURCE = 'const x = 1;\n';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GeminiAdapter — immediate success', () => {
  it('returns normalized findings on a valid provider response', async () => {
    let calls = 0;
    const adapter = adapterWithMock({
      generateContentImpl: async () => {
        calls += 1;
        return successResponse([
          {
            findingId: 'f-1',
            category: 'bug/correctness',
            severity: 'high',
            confidence: 'high',
            title: 'Off-by-one',
            explanation: 'Loop bound',
            impact: 'Crash',
            recommendation: 'Fix bound',
            evidence: 'for (let i=0; i<=n; i++)',
            lineStart: 1,
            lineEnd: 3,
            snippet: 'for(...)',
            caveats: null,
          },
        ]);
      },
      maxRetries: 0,
    });
    const result = await adapter.analyze({ source: SOURCE, language: 'javascript' });
    assert.strictEqual(calls, 1, 'generateContent should be called once');
    assert.strictEqual(result.provider, 'gemini');
    assert.strictEqual(result.findings.length, 1);
    assert.strictEqual(result.findings[0].title, 'Off-by-one');
    assert.strictEqual(result.status, undefined, 'success path should not carry a failure status');
  });
});

describe('GeminiAdapter — transient retry', () => {
  it('retries one 429 then succeeds', async () => {
    let calls = 0;
    const adapter = adapterWithMock({
      generateContentImpl: async () => {
        calls += 1;
        if (calls === 1) {
          const err = new Error('rate limited');
          err.status = 429;
          throw err;
        }
        return successResponse([]);
      },
      maxRetries: 2,
    });
    const result = await adapter.analyze({ source: SOURCE, language: 'javascript' });
    assert.strictEqual(calls, 2, 'first attempt failed, second succeeded');
    assert.strictEqual(result.status, undefined);
  });

  it('retries multiple transient failures then succeeds', async () => {
    let calls = 0;
    const adapter = adapterWithMock({
      generateContentImpl: async () => {
        calls += 1;
        if (calls < 3) {
          const err = new Error('temporary failure');
          err.status = 503;
          throw err;
        }
        return successResponse([]);
      },
      maxRetries: 2,
    });
    const result = await adapter.analyze({ source: SOURCE, language: 'javascript' });
    assert.strictEqual(calls, 3, 'two transient failures then success');
    assert.strictEqual(result.status, undefined);
  });

  it('retries on abort/timeout (AbortError)', async () => {
    let calls = 0;
    const adapter = adapterWithMock({
      generateContentImpl: async () => {
        calls += 1;
        if (calls === 1) {
          const err = new Error('AbortError');
          err.name = 'AbortError';
          throw err;
        }
        return successResponse([]);
      },
      maxRetries: 2,
    });
    const result = await adapter.analyze({ source: SOURCE, language: 'javascript' });
    assert.strictEqual(calls, 2);
    assert.strictEqual(result.status, undefined);
  });

  it('retries on 503 and 504', async () => {
    let calls = 0;
    const adapter = adapterWithMock({
      generateContentImpl: async () => {
        calls += 1;
        if (calls === 1) {
          const err = new Error('service unavailable');
          err.status = 503;
          throw err;
        }
        if (calls === 2) {
          const err = new Error('gateway timeout');
          err.status = 504;
          throw err;
        }
        return successResponse([]);
      },
      maxRetries: 2,
    });
    const result = await adapter.analyze({ source: SOURCE, language: 'javascript' });
    assert.strictEqual(calls, 3);
    assert.strictEqual(result.status, undefined);
  });
});

describe('GeminiAdapter — retry budget exhausted', () => {
  it('throws after maxRetries transient failures without final-attempt backoff', async () => {
    let calls = 0;
    const adapter = adapterWithMock({
      generateContentImpl: async () => {
        calls += 1;
        const err = new Error('persistent failure');
        err.status = 503;
        throw err;
      },
      maxRetries: 2,
    });
    let threw = false;
    let thrownCode = null;
    try {
      await adapter.analyze({ source: SOURCE, language: 'javascript' });
    } catch (err) {
      threw = true;
      thrownCode = err.code;
    }
    assert.ok(threw, 'should throw after retry budget exhausted');
    assert.strictEqual(calls, 3, 'initial + maxRetries attempts, no extra');
    assert.strictEqual(thrownCode, 'PROVIDER_UNAVAILABLE');
  });

  it('does not sleep after the final transient attempt', async () => {
    let calls = 0;
    const start = Date.now();
    const adapter = adapterWithMock({
      generateContentImpl: async () => {
        calls += 1;
        const err = new Error('always transient');
        err.status = 429;
        throw err;
      },
      maxRetries: 1,
    });
    let threw = false;
    try {
      await adapter.analyze({ source: SOURCE, language: 'javascript' });
    } catch (_err) {
      threw = true;
    }
    assert.ok(threw);
    assert.strictEqual(calls, 2, 'attempt 1 and final attempt 2 only');
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 3000, `elapsed ${elapsed}ms suggests an extra backoff`);
  });
});

describe('GeminiAdapter — non-retryable errors', () => {
  it('does not retry 401', async () => {
    let calls = 0;
    const adapter = adapterWithMock({
      generateContentImpl: async () => {
        calls += 1;
        const err = new Error('invalid key');
        err.status = 401;
        throw err;
      },
      maxRetries: 2,
    });
    let threw = false;
    try {
      await adapter.analyze({ source: SOURCE, language: 'javascript' });
    } catch (_err) {
      threw = true;
    }
    assert.ok(threw);
    assert.strictEqual(calls, 1, '401 must not be retried');
  });

  it('does not retry 403', async () => {
    let calls = 0;
    const adapter = adapterWithMock({
      generateContentImpl: async () => {
        calls += 1;
        const err = new Error('forbidden');
        err.status = 403;
        throw err;
      },
      maxRetries: 2,
    });
    let threw = false;
    try {
      await adapter.analyze({ source: SOURCE, language: 'javascript' });
    } catch (_err) {
      threw = true;
    }
    assert.ok(threw);
    assert.strictEqual(calls, 1, '403 must not be retried');
  });

  it('does not retry 400', async () => {
    let calls = 0;
    const adapter = adapterWithMock({
      generateContentImpl: async () => {
        calls += 1;
        const err = new Error('bad request');
        err.status = 400;
        throw err;
      },
      maxRetries: 2,
    });
    let threw = false;
    try {
      await adapter.analyze({ source: SOURCE, language: 'javascript' });
    } catch (_err) {
      threw = true;
    }
    assert.ok(threw);
    assert.strictEqual(calls, 1, '400 must not be retried');
  });
});

describe('GeminiAdapter — malformed responses', () => {
  it('rejects empty response', async () => {
    const adapter = adapterWithMock({
      generateContentImpl: async () => ({ response: { text: () => '' } }),
      maxRetries: 0,
    });
    let threw = false;
    let code = null;
    try {
      await adapter.analyze({ source: SOURCE, language: 'javascript' });
    } catch (err) {
      threw = true;
      code = err.code;
    }
    assert.ok(threw);
    assert.strictEqual(code, 'INVALID_PROVIDER_RESPONSE');
  });

  it('rejects invalid JSON', async () => {
    const adapter = adapterWithMock({
      generateContentImpl: async () => ({ response: { text: () => 'not json {' } }),
      maxRetries: 0,
    });
    let threw = false;
    let code = null;
    try {
      await adapter.analyze({ source: SOURCE, language: 'javascript' });
    } catch (err) {
      threw = true;
      code = err.code;
    }
    assert.ok(threw);
    assert.strictEqual(code, 'INVALID_PROVIDER_RESPONSE');
  });

  it('rejects missing findings array', async () => {
    const adapter = adapterWithMock({
      generateContentImpl: async () => ({ response: { text: () => JSON.stringify({ summary: 'ok' }) } }),
      maxRetries: 0,
    });
    let threw = false;
    let code = null;
    try {
      await adapter.analyze({ source: SOURCE, language: 'javascript' });
    } catch (err) {
      threw = true;
      code = err.code;
    }
    assert.ok(threw);
    assert.strictEqual(code, 'INVALID_PROVIDER_RESPONSE');
  });

  it('handles unexpected SDK exception', async () => {
    const adapter = adapterWithMock({
      generateContentImpl: async () => {
        throw new Error('unexpected sdk boom');
      },
      maxRetries: 0,
    });
    let threw = false;
    try {
      await adapter.analyze({ source: SOURCE, language: 'javascript' });
    } catch (_err) {
      threw = true;
    }
    assert.ok(threw, 'unexpected exception should surface');
  });
});

describe('GeminiAdapter — total operation deadline', () => {
  it('does not invoke generateContent once the total deadline has passed', async () => {
    // timeoutMs = 0 => totalDeadlineMs = 0 => the deadline check fires before
    // any generateContent call, so the provider is never invoked.
    let calls = 0;
    const adapter = adapterWithMock({
      generateContentImpl: async () => {
        calls += 1;
        return successResponse([]);
      },
      maxRetries: 1,
      timeoutMs: 0,
    });
    let threw = false;
    let code = null;
    try {
      await adapter.analyze({ source: SOURCE, language: 'javascript' });
    } catch (err) {
      threw = true;
      code = err.code;
    }
    assert.ok(threw, 'deadline should surface an error');
    assert.strictEqual(calls, 0, 'generateContent must not be invoked once deadline passed');
    assert.strictEqual(code, 'PROVIDER_TIMEOUT');
  });
});

// ---------------------------------------------------------------------------
// Regression: the real SDK request shape (Critical — found only against the
// live API). The adapter previously passed a bare Content[] array as the
// request body and generationConfig in the requestOptions slot. The mocked
// transport accepted anything, so the suite passed while every real call
// failed with "400 Invalid JSON payload received. Unknown name \"role\"
// at 'contents[0].parts[0]'". These tests pin the serialized contract.
// ---------------------------------------------------------------------------
describe('Gemini request shape (real API contract)', () => {
  it('sends { contents, generationConfig } as the body and options separately', async () => {
    let capturedBody;
    let capturedOptions;
    const adapter = new GeminiAdapter({
      apiKey: 'test-key-not-used',
      model: 'gemini-3.1-flash-lite',
      timeoutMs: 5000,
      maxRetries: 0,
      maxOutputChars: 32768,
      genAI: {
        getGenerativeModel: () => ({
          generateContent: async (body, options) => {
            capturedBody = body;
            capturedOptions = options;
            return successResponse([]);
          },
        }),
      },
    });

    await adapter.analyze({ source: 'const a = 1;', language: 'javascript', focus: null });

    // Body must be an object with a contents array — never a bare array.
    assert.strictEqual(Array.isArray(capturedBody), false, 'body must not be a bare array');
    assert.ok(Array.isArray(capturedBody.contents), 'body.contents must be an array');
    assert.strictEqual(capturedBody.contents[0].role, 'user');
    assert.ok(Array.isArray(capturedBody.contents[0].parts));

    // generationConfig belongs in the body, not in request options.
    assert.ok(capturedBody.generationConfig, 'generationConfig must be inside the request body');
    assert.strictEqual(capturedBody.generationConfig.responseMimeType, 'application/json');
    assert.strictEqual(typeof capturedBody.generationConfig.maxOutputTokens, 'number');

    // The second argument carries cancellation only.
    assert.ok(capturedOptions && capturedOptions.signal, 'request options must carry an AbortSignal');
    assert.strictEqual(capturedOptions.generationConfig, undefined,
      'generationConfig must NOT be passed in request options');
  });

  it('sends the same shape for assist(explain) and assist(improve)', async () => {
    for (const action of ['explain', 'improve']) {
      let body;
      const adapter = new GeminiAdapter({
        apiKey: 'test-key-not-used',
        model: 'gemini-3.1-flash-lite',
        timeoutMs: 5000,
        maxRetries: 0,
        maxOutputChars: 32768,
        genAI: {
          getGenerativeModel: () => ({
            generateContent: async (b) => {
              body = b;
              const payload = action === 'explain' ?
                { explanation: 'It assigns a value.', keyPoints: ['a'], caveats: null } :
                { improvedCode: 'const a = 1;', changes: [], summary: 'Same.', caveats: null };
              return { response: { text: () => JSON.stringify(payload) } };
            },
          }),
        },
      });
      await adapter.assist({ source: 'var a = 1;', language: 'javascript', action });
      assert.strictEqual(Array.isArray(body), false, `${action}: body must not be a bare array`);
      assert.ok(Array.isArray(body.contents), `${action}: body.contents must be an array`);
      assert.ok(body.generationConfig, `${action}: generationConfig must be in the body`);
    }
  });
});
