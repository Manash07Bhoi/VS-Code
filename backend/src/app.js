/**
 * CodeSense AI — Express application composition.
 */

const express = require('express');
const path = require('node:path');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(expressSession);
const { requestId } = require('./middleware/requestId');
const { errorHandler, notFound } = require('./middleware/error');
const { generalLimiter } = require('./middleware/rateLimit');
const { SECURE_COOKIES, COOKIE_SAMESITE, COOKIE_DOMAIN, FRONTEND_ORIGIN, SESSION_SECRET, SESSION_MAX_AGE_MS, MONGODB_URI } = require('./config/env');
const healthRoutes = require('./modules/health/routes');
const authRoutes = require('./modules/auth/routes');
const reviewRoutes = require('./modules/reviews/routes');
const languageRoutes = require('./modules/languages/routes');
const assistRoutes = require('./modules/assist/routes');

const app = express();
app.set('trust proxy', process.env.TRUST_PROXY === 'true');

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ['\'self\''],
    scriptSrc: ['\'self\'', '\'unsafe-eval\'', 'https://cdnjs.cloudflare.com', 'https://cdn.jsdelivr.net'],
    styleSrc: ['\'self\'', '\'unsafe-inline\'', 'https://cdnjs.cloudflare.com', 'https://cdn.jsdelivr.net'],
    imgSrc: ['\'self\'', 'data:'],
    connectSrc: ['\'self\'', FRONTEND_ORIGIN || 'http://localhost:3000'],
    workerSrc: ['\'self\'', 'blob:'],
    childSrc: ['\'self\'', 'blob:'],
    frameSrc: ['\'self\''],
    objectSrc: ['\'none\''],
    baseUri: ['\'self\''],
    formAction: ['\'self\''],
  },
}));
app.use(helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }));
app.use(helmet.xFrameOptions({ action: 'deny' }));
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }));

const corsOrigin = FRONTEND_ORIGIN || 'http://localhost:3000';
app.use(cors({ origin: corsOrigin, credentials: true, methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','X-CSRF-Token','X-Requested-With','X-Request-Id','Accept'] }));
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: false, limit: '256kb' }));
app.use(cookieParser());
app.use(requestId);

const sessionStore = new MongoDBStore({ uri: MONGODB_URI, collection: 'sessions', ttl: SESSION_MAX_AGE_MS / 1000 });
sessionStore.on('error', (err) => { console.error(JSON.stringify({ level:'error', message:'codesense-session.store-error', timestamp: new Date().toISOString(), service:'codesense-backend', error: err.message })); });

const cookieConfig = {
  httpOnly: true,
  secure: SECURE_COOKIES,
  sameSite: COOKIE_SAMESITE,
  path: '/',
  maxAge: SESSION_MAX_AGE_MS,
};
if (COOKIE_DOMAIN) {
  cookieConfig.domain = COOKIE_DOMAIN;
}

app.use(expressSession({
  store: sessionStore,
  secret: SESSION_SECRET,
  name: 'cs.sid',
  resave: false,
  saveUninitialized: false,
  cookie: cookieConfig,
}));

app.use(generalLimiter);

// --- Serve frontend static files (same origin) ---
const frontendDir = path.resolve(__dirname, '../../frontend');
app.use(express.static(frontendDir));
// SPA fallback: serve index.html for client-side routes (non-API)
app.get(/^\/((?!api).)*$/, (_req, res) => {
  res.sendFile(path.resolve(frontendDir, 'index.html'));
});

app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/languages', languageRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/assist', assistRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
