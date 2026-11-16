/**
 * CodeSense AI — Language registry tests.
 */

const assert = require('node:assert/strict');
const { start, stop } = require('./setup.js');
const supertest = require('supertest');

let app, mongod;

async function test() {
  ({ app, mongod } = await start());
  const agent = supertest.agent(app);

  // Languages registry returns the five target languages
  const res = await agent.get('/api/v1/languages');
  assert.strictEqual(res.status, 200);
  const ids = res.body.languages.map((l) => l.canonicalId);
  for (const lang of ['javascript', 'typescript', 'python', 'java', 'cpp']) {
    assert.ok(ids.includes(lang), `language ${lang} should be registered`);
  }
  // Each entry has required public fields
  for (const l of res.body.languages) {
    assert.ok(l.canonicalId);
    assert.ok(l.displayName);
    assert.ok(l.monacoId);
    assert.strictEqual(typeof l.reviewEnabled, 'boolean');
  }

  await stop(mongod);
  console.log('language tests: PASS');
  process.exit(0);
}

test().catch((err) => {
  console.error('language tests: FAIL', err);
  process.exit(1);
});
