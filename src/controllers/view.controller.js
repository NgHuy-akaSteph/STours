'use strict'


const { title } = require('process');
const Tour = require('../models/tour.model');
const catchAsync = require('../utils/catchSync');
const AppError = require('../utils/app.error');


const getOverview = catchAsync(async (req, res) => {
    //1) Get tour data from the collection
    const tours = await Tour.find();

    //2) Build template
    //3) Render that template using tour data
    res.status(200).render('overview', {
        title: 'All Tours',
        tours: tours
    });
});

const getTour = catchAsync( async (req, res, next) => {
    //1) Get the data for the requested tour (including reviews and guides)
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: 'reviews',
        fields: 'review rating user'
    });

    if(!tour) {
        return next(new AppError(404, 'There is no tour with that name'));
    }

    //2) Build template
    //3) Render template using data
    res.status(200).render('tour', {
        title: `${tour.name} Tour`,
        tour
    });
});

const getLoginForm = (req, res) => {
    res.status(200).render('login', {
        title: 'Login into your account'
    });
}

const getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'Your account'
    });
}



module.exports = {
    getOverview,
    getTour,
    getLoginForm,
    getAccount
};

