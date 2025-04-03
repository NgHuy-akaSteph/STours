'use strict'

const AppError = require('./../utils/app.error')

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(400, message);
}

const handleDuplicateFieldsDB = err => {
    const value = err.keyValue.name;
    const message = `Duplicate field value: ${value}`
    return new AppError(400, message);
}

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data: ${errors.join('. ')}`;
    return new AppError(400, message);
}

const handleJWTError = err => {
    return new AppError(401, 'Token is invalid or expired')
};

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
};

const sendErrorProd = (err, res) => {
    //Operational, trusted err: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    } else { // Progaming or other unknown error: don't leak error details
        //log error
        console.log('>>> Error: ', err);
        // send generic message
        res.status(500).json({
            status: 'error',
            message: 'Internal Server Error'
        });
    }
};

module.exports = (err, req, res, next) => {
    console.log(err.stack);
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error'

    if (process.env.NODE_ENV === 'dev') {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === 'prod') {

        if (err.name === 'CastError') err = handleCastErrorDB(err);
        if (err.code === 11000) err = handleDuplicateFieldsDB(err);
        if (err.name === 'ValidationError') err = handleValidationErrorDB(err);
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') 
            err = handleJWTError(err);

        sendErrorProd(err, res);
    }
}