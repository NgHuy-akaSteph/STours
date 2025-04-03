'use strict';

const catchAsync = require("../utils/catchSync");
const userService = require("../services/user.service");
const handlerFactory = require('./handler.factory');
const User = require('../models/user.model');


const getAllUsers = handlerFactory.getAll(User);

const getUserById = handlerFactory.getOne(User);

const getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
}

const createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not yet defined. Please use /signup instead',
    });
};

const updateMe = catchAsync(async (req, res, next) => {
    const updatedUser = await userService.updateMe(req.user.id, req.body);

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser,
        }
    });
});

// Do not UPDATE PASSWORD with this
const updateUser = handlerFactory.updateOne(User);

const deleteMe = catchAsync(async(req, res, next) => {
    await userService.deleteMe(req.user.id);

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

const deleteUser = handlerFactory.deleteOne(User);

module.exports = {
    getAllUsers,
    getUserById,
    getMe,
    createUser,
    updateMe,
    updateUser,
    deleteMe,
    deleteUser,
};
