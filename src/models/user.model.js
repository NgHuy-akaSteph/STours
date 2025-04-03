'use strict'

const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { type } = require('os');

//user: name, email, photo, password, passwordConfirm
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator.isEmail, 'Please provide a valid email'] 
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user' 
    },
    photo: {
        type: String,
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            // when save
            validator: function(ele) {
                return ele === this.password;
            }
        }
    },
    passwordChangedAt: {
        type: Date,
        select: false
    },
    passwordResetToken: {
        type: String,
        select: false
    },
    passwordResetExpires: {
        type: Date,
        select: false
    },
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

userSchema.pre('save', async function(next) {
    // only run this function if password was actually modified
    if(!this.isModified('password')) return next();
    // hash the password with cost of 12: the higher the cost, the more secure but slower
    // recommended: 10-12
    this.password = await bcrypt.hash(this.password, 12)
    // delete passwordConfirm field
    this.passwordConfirm = undefined; // not save to db
    next();
});

userSchema.pre('save', async function(next) {
    // ignore if password is not modified or new user
    if(!this.isModified('password') || this.isNew) return next();
    // -1s to make sure the token is always created after the passwordChangedAt
    this.passwordChangedAt = Date.now() - 1000;
    next();
});


// query middleware: only find active users
userSchema.pre(/^find/, function(next) {
    this.find({ active: true });
    next();
});

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    //JWTTimestamp format: seconds
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    // false means not changed
    return false;
}

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    console.log({resetToken}, this.passwordResetToken);

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes for expiration

    return resetToken;
}

const User = mongoose.model('User', userSchema);

module.exports = User;