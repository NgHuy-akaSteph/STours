'use strict';

const mongoose = require('mongoose');
const slugify = require('slugify');

const { User } = require('./user.model');

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        unique: true,
        trim: true,
        maxlength: [
            40,
            'A tour name must have less or equal than 40 characters',
        ],
        minlength: [10, 'A tour name must have more or equal than 10 characters']
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size'],
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty is either: easy, medium, difficult',
        },
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0'],
        set: (val) => Math.round(val * 10) / 10, // round to 1 decimal
    },
    ratingsQuantity: {
        type: Number,
        default: 0,
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function (val) {
                // this only points to current doc on NEW document creation
                return val < this.price;
            },
            message: 'Discount price ({VALUE}) should be below regular price',
        },
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have a summary'],
    },
    description: {
        type: String,
        trim: true,
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false, // not show in query result
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false,
        select: false,
    },
    startLocation: {
        // GeoJSON
        type: {
            type: String,
            default: 'Point',
            enum: ['Point'],
        },
        coordinates: { type: [Number], default: [0, 0] }, //[longitude, latitude]
        address: String,
        description: String,
    },
    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point'],
            },
            coordinates: [Number], //[longitude, latitude]
            address: String,
            description: String,
            day: Number,
        },
    ],
    guides: [
        // arr of ObjectId reference User
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
        },
    ]
},
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
        id: false
    }
);
/*
 * * @note: 1: ascending, -1: descending
 */
tourSchema.index({ price: 1, ratingsAverage: -1 }); // compound index
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' }); // geospatial index

// Virtual fields
tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7; // 7 days in week
});

// Virtual populate
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour', // field in review model
    localField: '_id' // field in tour model reference to review
});

// Document middleware : run before .save() and .create()
// middleware to create slug by name before save
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

/** 
 * * @param {Function} next
 * * @returns {Function} next
 * * @description Middleware to populate guides before executing query.
 */
tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    });
    next();
});


/**
 * * @param {Function} next
 * * @returns {Function} next
 * * @description Middleware to filter secret tours from query.
 */
tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } })
    next();
});


/**
 * * @param {Function} next
 * * @returns {Function} next
 * * @description Middleware to filter secret tours from aggregation pipeline.
 */
// tourSchema.pre('aggregate', function (next) {
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//     next();
// });


const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
