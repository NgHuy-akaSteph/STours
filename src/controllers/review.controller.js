'use strict'

const reviewService = require('../services/review.service');
const handlerFactory = require('./handler.factory');
const Review = require('../models/review.model');


const setUserAndTourIds = (req, res, next) => {
    // Nếu có tourId trong params, thêm vào body
    if (!req.body.tour) req.body.tour = req.params.tourId;
    
    // Nếu không có userId trong body, thêm vào từ req.user
    if (!req.body.user) req.body.user = req.user.id;
    
    next();
}

const getAllReviews = handlerFactory.getAll(Review)

const getReviewById = handlerFactory.getOne(Review, { path: 'user' });

const createReview = handlerFactory.createOne(Review);

const updateReview = handlerFactory.updateOne(Review);

const deleteReview = handlerFactory.deleteOne(Review);

module.exports = {
    getAllReviews,
    getReviewById,
    createReview,
    updateReview,
    deleteReview,
    setUserAndTourIds,
};