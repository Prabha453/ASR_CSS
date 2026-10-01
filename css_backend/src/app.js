const express = require('express');
const cors = require('cors');
const passport = require('passport');
const httpStatus = require('http-status');
const helmet = require('helmet');
const xss = require('xss-clean');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const routes = require('./route');
const portRoute = require('./route/portRoute');
const { jwtStrategy } = require('./config/passport');
const { errorConverter, errorHandler } = require('./middlewares/error');
const ApiError = require('./helper/ApiError');
const dbMiddleware = require('./middlewares/dbMiddleware');
const path = require('path');

process.env.PWD = process.cwd();

const app = express();

// ✅ security headers
app.use(helmet());

// ✅ cors
app.use(cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
}));
app.options('*', cors());

// ✅ body parsers with size limit
app.use(express.static(`${process.env.PWD}/public`));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.json({ limit: '10kb' }));

// ✅ xss sanitization
app.use(xss());

// ✅ global rate limiter
// app.use(rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 100,
//     skipSuccessfulRequests: false,
//     standardHeaders: true,
//     legacyHeaders: false,
//     message: {
//         status: false,
//         message: 'Too many requests, please try again after 15 minutes'
//     }
// }));

// ✅ strict auth rate limiter
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `${ipKeyGenerator(req)}_${req.body?.email ?? 'unknown'}`,
    handler: (req, res) => {
        res.status(429).json({
            status: false,
            message: 'Too many login attempts. Please try again after 15 minutes.',
            remaining_attempts: 0,
            retryAfter: '15 minutes'
        });
    }
});

// ✅ jwt passport
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// ✅ health check
app.get('/', (req, res) => {
    res.status(200).send('Congratulations! API is working!');
});

// ✅ port registry route — must be before /:db to avoid wildcard match
app.use('/port', portRoute);

// ✅ auth limiter on login/register routes
app.use('/:db/auth/login', authLimiter);
app.use('/:db/auth/register', authLimiter);

// ✅ static uploads — Cross-Origin-Resource-Policy: cross-origin fixes
//    ERR_BLOCKED_BY_RESPONSE.NotSameOrigin when the React app (e.g. :3000)
//    tries to display images served from a different port (e.g. :5000).
//    helmet() sets CORP: same-origin by default; we override it here only
//    for the /uploads path so the rest of the app stays locked down.

app.use('/uploads', (req, res, next) => {
    const uploadPath = String(req.path || '').replace(/\\/g, '/');
    if (/(^|\/)form_generation\/(pdf|docx)(\/|$)/i.test(uploadPath)) {
        return res.status(httpStatus.NOT_FOUND).send({ status: false, message: 'Not found' });
    }
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static(path.join(process.cwd(), 'uploads')));

// ✅ db middleware + routes
app.use('/:db', dbMiddleware, routes);

// ✅ 404 handler
app.use((req, res, next) => {
    next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// ✅ error handlers
app.use(errorConverter);
app.use(errorHandler);

module.exports = app;
