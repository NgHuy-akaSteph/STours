'use strict';

const express = require('express');
const tourController = require('../controllers/tour.controller');
const authController = require('../controllers/auth.controller');
const reviewRouter = require('./review.route');

const router = express.Router();

router
    .route('/')
    .get(tourController.getAllTours)
    .post(authController.protect, 
        authController.restrictTo('admin', 'lead-guide'),
        tourController.createTour
    );


router
    .route('/:id')
    .get(tourController.getTourById)
    .patch(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.updateTour
    )
    .delete(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.deleteTour
    );


router
    .route('/top-5-cheap')
    .get(tourController.aliasTopTour, tourController.getAllTours);

router
    .route('/tour-stats')
    .get(tourController.getTourStats);

router
    .route('/monthly-plan/:year')
    .get(authController.protect, 
        authController.restrictTo('admin', 'lead-guide', ''), 
        tourController.getMonthlyPlan
    );

    // tours-within/233/center/34.111,-118.113/unit/mi
router
    .route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(tourController.getToursWithin);

router
    .route('/distances/:latlng/unit/:unit')
    .get(tourController.getDistances);


router.use('/:tourId/reviews', reviewRouter);


module.exports = router;
