'use strict'

const path = require('path');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean'); 
const hpp = require('hpp');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/app.error');
const globalErrorHandler = require('./controllers/error.controller')
const tourRouter = require('./routes/tour.route');
const userRouter = require('./routes/user.route');
const reviewRouter = require('./routes/review.route');
const viewsRouter = require('./routes/views.route');

const app = express();

// setup view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views')); // set views directory

//middleware

app.use(cors({
        origin: 'http://localhost:3000',
        credentials: true // allow all origins
}))

// set security HTTP headers
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'", 'data:', 'blob:', 'ws:', 'http:'],
            baseUri: ["'self'"],
            fontSrc: ["'self'", 'https:', 'data:'],
            scriptSrc: ["'self'", 'https://*.cloudflare.com', 'https://*.stripe.com', 'https://*.mapbox.com', 'https://cdnjs.cloudflare.com', 'data:'],
            frameSrc: ["'self'", 'https://*.stripe.com'],
            objectSrc: ["'none'"],
            styleSrc: ["'self'", 'https:', "'unsafe-inline'"], // Allow inline styles
            workerSrc: ["'self'", 'data:', 'blob:'],
            childSrc: ["'self'", 'blob:'],
            imgSrc: ["'self'", 'data:', 'blob:'],
            connectSrc: [
                "'self'",
                "'unsafe-inline'",
                'data:',
                'blob:',
                'https://*.stripe.com',
                'https://*.mapbox.com',
                'https://*.cloudflare.com/',
                'https://bundle.js:*',
                'ws://127.0.0.1:*/',
                'ws://localhost:14285/',
              ],
            upgradeInsecureRequests: [],
        },
    })
);

// compress all responses
app.use(compression()); 

// development logging
if (process.env.NODE_ENV === 'dev') {
    app.use(morgan('dev'));
}

// limit requests from same IP
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// parse body data to req.body
app.use(express.json({ limit: '10kb' }));
// for parsing application/x-www-form-urlencoded
// app.use(express.urlencoded({ extended: true, limit: '10kb' })); 
// parse cookies to req.cookies
app.use(cookieParser()); 

// data sanitization against NoSQL query injection
// remove $ and . from req.body, req.query, req.params
app.use(mongoSanitize());

// data sanitization against XSS
// clean user input from malicious HTML code
app.use(xss());

// prevent parameter pollution
// remove duplicate query parameters
app.use(hpp({
    whitelist: [
        'duration',
        'ratingsQuantity',
        'ratingsAverage',
        'maxGroupSize',
        'difficulty',
        'price'
    ]
}));

// serve static files
app.use(express.static(path.join(__dirname, '../public')));


// init db
require('./dbs/init.mongodb');

//routes
app.use('/', viewsRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// handling errors
app.all('*', (req, res, next) => {
    next(new AppError(404, `Can't find ${req.originalUrl} on this server!`));
});

app.use(globalErrorHandler);

module.exports = app;
