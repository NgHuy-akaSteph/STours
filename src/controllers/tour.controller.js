'use strict';

const catchAsync = require('../utils/catchSync');
const tourService = require('../services/tour.service');
const Tour = require('../models/tour.model');
const handlerFactory = require('./handler.factory');

const aliasTopTour = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingAverage,price';
  req.query.fields = 'name,price,ratingAverage,summary,difficulty';
  next();
};

const getAllTours = handlerFactory.getAll(Tour);

const getTourById = handlerFactory.getOne(Tour, { path: 'reviews' });

const createTour = handlerFactory.createOne(Tour);

const updateTour = handlerFactory.updateOne(Tour);

const deleteTour = handlerFactory.deleteOne(Tour);

const getTourStats = catchAsync(async (req, res, next) => {
  const stats = await tourService.getTourStats();

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

const getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await tourService.getMonthlyPlan(year);

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});

const getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  // Transform distance to radians
  // 1 radian = 6378.1 km = 3963.2 miles
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; // convert to radians

  if(!lat || !lng) {
    return next(new AppError(400, 'Please provide latitude and longitude in the format lat,lng.'));
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  })

  console.log(distance, latlng, unit);
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours
    }
  });
  
});

const getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001; // convert to miles or km

  if(!lat || !lng) {
    return next(new AppError(400, 'Please provide latitude and longitude in the format lat,lng.'));
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng * 1, lat * 1] },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
        spherical: true
      }
    },
    {
      $project: {
        distance: { $round: ['$distance', 2] },
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      distances
    }
  });
});

module.exports = {
  getAllTours,
  getTourById,
  createTour,
  updateTour,
  deleteTour,
  aliasTopTour,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances
};
