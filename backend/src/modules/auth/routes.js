/**
 * CodeSense AI — Authentication routes.
 *
 * Registration, login, logout, current-user. Secure session cookie, bcrypt
 * password hashing, generic credential errors, rate limiting, CSRF on mutating
 * endpoints. No account enumeration via error messages.
 */

const express = require('express');
const router = express.Router();
const crypto = require('node:crypto');
const { validate } = require('../../middleware/validation');
const {
  registerSchema,
  loginSchema,
} = require('../../validators/schemas');
const { authLimiter } = require('../../middleware/rateLimit');
const { csrfMiddleware } = require('../../middleware/csrf');
const { requireAuth, optionalAuth } = require('../../middleware/auth');
const {
  createUser,
  findByEmail,
  updateLastAuthenticated,
} = require('../../repositories/userRepository');
const { hashPassword, comparePassword } = require('../../utils/crypto');
const logger = require('../../utils/logger');

// CSRF token for mutating client forms.
router.get('/csrf-token', optionalAuth, (req, res) => {
  // Ensure a session exists to bind the token.
  if (!req.session) {
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Session unavailable.' } });
  }
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  res.json({ csrfToken: req.session.csrfToken });
});

// Registration.
router.post('/register', authLimiter, validate(registerSchema, 'body'), async (req, res, next) => {
  const { email, password } = req.validated;
  try {
    const existing = await findByEmail(email);
    if (existing) {
      // Generic response: do not reveal whether email exists.
      return res.status(201).json({
        message: 'If the account does not exist, it has been created. If it exists, no action was taken.',
        created: false,
      });
    }

    const passwordHash = await hashPassword(password);
    let user;
    try {
      user = await createUser({ email, passwordHash });
    } catch (err) {
      if (err && err.code === 11000) {
        return res.status(201).json({
          message: 'If the account does not exist, it has been created. If it exists, no action was taken.',
          created: false,
        });
      }
      throw err;
    }

    // Establish secure session.
    req.session.regenerate((err) => {
      if (err) {
        logger.error('codesense-auth.session-regenerate-failed', { message: err.message });
        return res.status(500).json({
          error: { code: 'INTERNAL_ERROR', message: 'Account created but session could not be established.', requestId: req.requestId },
        });
      }
      req.session.userId = user._id.toString();
      req.session.email = user.email;
      req.session.createdAt = new Date().toISOString();
      req.session.save((saveErr) => {
        if (saveErr) {
          return res.status(500).json({
            error: { code: 'INTERNAL_ERROR', message: 'Session save failed.', requestId: req.requestId },
          });
        }
        logger.info('codesense-auth.registered', { userId: user._id.toString(), email });
        return res.status(201).json({
          message: 'Account created.',
          created: true,
          user: { id: user._id.toString(), email: user.email },
        });
      });
    });
  } catch (err) {
    next(err);
  }
});

// Login.
router.post('/login', authLimiter, validate(loginSchema, 'body'), async (req, res, next) => {
  const { email, password } = req.validated;
  try {
    const user = await findByEmail(email);
    if (!user || user.status !== 'active') {
      // Generic failure — no account enumeration.
      return res.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Invalid email or password.', requestId: req.requestId },
      });
    }

    const match = await comparePassword(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Invalid email or password.', requestId: req.requestId },
      });
    }

    // Rotate session identifier after login (session fixation resistance).
    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({
          error: { code: 'INTERNAL_ERROR', message: 'Session could not be established.', requestId: req.requestId },
        });
      }
      req.session.userId = user._id.toString();
      req.session.email = user.email;
      req.session.authenticatedAt = new Date().toISOString();
      req.session.save(async (saveErr) => {
        if (saveErr) {
          return res.status(500).json({
            error: { code: 'INTERNAL_ERROR', message: 'Session save failed.', requestId: req.requestId },
          });
        }
        await updateLastAuthenticated(user._id);
        logger.info('codesense-auth.login', { userId: user._id.toString(), email });
        return res.json({
          message: 'Signed in.',
          user: { id: user._id.toString(), email: user.email },
        });
      });
    });
  } catch (err) {
    next(err);
  }
});

// Logout — idempotent, invalidates server-side session.
router.post('/logout', csrfMiddleware, requireAuth, (req, res, next) => {
  const userId = req.session.userId;
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.clearCookie('connect.sid', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.SECURE_COOKIES === 'true',
      path: '/',
    });
    logger.info('codesense-auth.logout', { userId });
    return res.json({ message: 'Signed out.' });
  });
});

// Current user.
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await (require('../../repositories/userRepository').findById)(req.auth.userId);
    if (!user) {
      return res.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Session invalid.', requestId: req.requestId },
      });
    }
    res.json({ user: { id: user._id.toString(), email: user.email, status: user.status } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
