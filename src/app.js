'use strict';

const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean'); 
const hpp = require('hpp');

const AppError = require('./utils/app.error');
const globalErrorHandler = require('./controllers/error.controller')
const tourRouter = require('./routes/tour.route');
const userRouter = require('./routes/user.route');
const reviewRouter = require('./routes/review.route');

const app = express();

//middleware

// set security HTTP headers
app.use(helmet()); 

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
app.use(express.static(`${__dirname}/../public`)); 

// init db
require('./dbs/init.mongodb');

//routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// handling errors
app.all('*', (req, res, next) => {
    next(new AppError(404, `Can't find ${req.originalUrl} on this server!`));
});

app.use(globalErrorHandler);

module.exports = app;
