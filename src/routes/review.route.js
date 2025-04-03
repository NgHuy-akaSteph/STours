'use strict'

const express = require('express');
const reviewController = require('../controllers/review.controller');
const authController = require('../controllers/auth.controller');

const router = express.Router({mergeParams: true}); // Merge params allows us to access the tourId from the parent route

router.use(authController.protect); // Protect all routes after this middleware
router
    .route('/')
    .get(reviewController.getAllReviews)
    .post(authController.protect, 
        authController.restrictTo('user'), 
        reviewController.setUserAndTourIds,
        reviewController.createReview
    );

router
    .route('/:id')
    .get(reviewController.getReviewById)
    .patch(
        authController.protect, 
        authController.restrictTo('user', 'admin'), 
        reviewController.updateReview
    )
    .delete(
        authController.protect, 
        authController.restrictTo('user', 'admin'), 
        reviewController.deleteReview
    );


module.exports = router;
