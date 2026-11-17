/**
 * CodeSense AI — rate-limit key generator regression tests.
 *
 * express-rate-limit v8 rejects custom key generators that return a bare
 * `req.ip` (ERR_ERL_KEY_GEN_IPV6): an IPv6 client controls a whole /64 (or
 * larger) prefix, so per-address keys hand it unlimited fresh buckets and the
 * limiter becomes a no-op. These tests pin the property that all address-based
 * buckets are derived through ipKeyGenerator, so a regression is caught by the
 * unit suite rather than only by a runtime validation warning.
 */

const test = require('node:test');
const assert = require('node:assert');
const { keyGenerators } = require('../src/middleware/rateLimit');

const { authKey, ipKey, reviewKey } = keyGenerators;

// Two addresses inside the same IPv6 prefix; a client can rotate between them
// at will, so they must land in the SAME bucket.
const IPV6_A = '2001:db8:85a3:8d3:1319:8a2e:370:7348';
const IPV6_B = '2001:db8:85a3:8d3:ffff:ffff:ffff:ffff';
// A genuinely different prefix must still get its own bucket.
const IPV6_OTHER = '2001:db8:85a3:9999::1';

test('IP key collapses addresses from the same IPv6 prefix into one bucket', () => {
  assert.strictEqual(ipKey({ ip: IPV6_A }), ipKey({ ip: IPV6_B }));
});

test('IP key keeps different IPv6 prefixes in separate buckets', () => {
  assert.notStrictEqual(ipKey({ ip: IPV6_A }), ipKey({ ip: IPV6_OTHER }));
});

test('IP key leaves IPv4 addresses unchanged', () => {
  assert.strictEqual(ipKey({ ip: '203.0.113.7' }), '203.0.113.7');
});

test('auth key still separates accounts behind the same address', () => {
  const req = (email) => ({ ip: '203.0.113.7', body: { email } });
  assert.strictEqual(authKey(req('a@example.com')), '203.0.113.7:a@example.com');
  assert.notStrictEqual(authKey(req('a@example.com')), authKey(req('b@example.com')));
});

test('auth key cannot be bypassed by rotating inside one IPv6 prefix', () => {
  const req = (ip) => ({ ip, body: { email: 'a@example.com' } });
  assert.strictEqual(authKey(req(IPV6_A)), authKey(req(IPV6_B)));
});

test('review key prefers the authenticated user over the address', () => {
  assert.strictEqual(reviewKey({ ip: '203.0.113.7', session: { userId: 'u1' } }), 'user:u1');
  assert.strictEqual(reviewKey({ ip: IPV6_A }), 'ip:' + ipKey({ ip: IPV6_A }));
});
