const catchAsync = require("../utils/catchSync");
const AppError = require('../utils/app.error');
const APIFeatures = require('../utils/api.features');


const createOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    const modelName = Model.modelName.toLowerCase();
    res.status(201).json({
        status: "success",
        data: {
            [modelName]: doc,
        },
    });
});

const getAll = (Model) => catchAsync(async (req, res, next) => {

    // To allow for nested GET reviews on tour (hack)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const docs = await features.query;

    const modelName = Model.modelName.toLowerCase();

    res.status(200).json({
        status: "success",
        results: docs.length,
        data: {
            [modelName]: docs,
        },
    });
});

const getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
    const query = Model.findById(req.params.id);
    // get populate options from the request if any
    if (popOptions) query.populate(popOptions);
    const doc = await query;

    if (!doc) {
        return next(new AppError(404, `No document found with ID: ${req.params.id}`));
    }

    const modelName = Model.modelName.toLowerCase();

    res.status(200).json({
        status: "success",
        data: {
            [modelName]: doc,
        },
    });
});

const updateOne = Model => catchAsync(async (req, res, next) => {

    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    if (!doc) {
        return next(new AppError(404, `No document found with ID: ${req.params.id}`));
    }

    const modelName = Model.modelName.toLowerCase();

    res.status(200).json({
        status: "success",
        data: {
            [modelName]: doc,
        },
    });

});

const deleteOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
        return next(new AppError(404, `No document found with ID: ${req.params.id}`));
    }

    res.status(204).json({
        status: "success",
        data: null,
    });
});



module.exports = {
    createOne,
    getAll,
    getOne,
    updateOne,
    deleteOne
}