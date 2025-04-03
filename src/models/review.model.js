'use strict'

const mongoose = require('mongoose');
const Tour = require('./tour.model');
const User = require('./user.model');

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Review cannot be empty'],
        trim: true,
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: Tour,
        required: [true, 'Review must belong to a tour'],
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: User,
        required: [true, 'Review must belong to a user'],
    },
},
{
    toJSON: { virtuals: true }, // show virtuals in JSON
    toObject: { virtuals: true }, // show virtuals in Object
}
);

// prevent user from reviewing the same tour multiple times
// 1 user can only review 1 tour once
reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); 

// populate user and tour data
reviewSchema.pre(/^find/, function (next) {

    this.populate({ path: 'user', select: 'name' });

    next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 }, // number of reviews
                avgRating: { $avg: '$rating' } // average rating
            }
        }
    ]);
    
    if(stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating //ratingsAverage
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5 // default value
        });
    }
}


reviewSchema.post('save', function () {
    // this points to current review
    this.constructor.calcAverageRatings(this.tour); // call static method
});


// reviewSchema.pre(/^findOneAnd/, async function (next) {
//     this.r = await this.findOne(); // store current review
//     console.log(this.r);
//     next();
// });
// NOTE: No Need To Pass The Document Manually 
// When you define a post middleware function, Mongoose passes the document directly to your function
reviewSchema.post(/^findOneAnd/, async function (document) {
    // await this.findOne() does NOT work here, query has already executed
    if(document){
        await document.constructor.calcAverageRatings(document.tour._id); // call static method
    }
    console.log(document);
});


const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
