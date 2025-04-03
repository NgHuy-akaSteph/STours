'use strict';

const Tour = require('../models/tour.model');
const APIFeatures = require('../utils/api.features');
const AppError = require('../utils/app.error');

/**
 * Lấy tất cả tours với các tùy chọn lọc, sắp xếp, phân trang
 * @param {Object} queryString - Query parameters từ request
 * @returns {Promise<Array>} Danh sách các tour
 */
exports.getAllTours = async (queryString) => {
    const features = new APIFeatures(Tour.find(), queryString)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    
    return await features.query;
};

/**
 * Lấy tour theo ID
 * @param {String} id - ID của tour
 * @returns {Promise<Object>} Tour tìm thấy
 * @throws {AppError} Nếu không tìm thấy tour
 */
exports.getTourById = async (id) => {
    const tour = await Tour.findById(id).populate('reviews').select('-__v');
    
    if (!tour) {
        throw new AppError(404, `No tour found with ID : ${id}`);
    }
    
    return tour;
};

/**
 * Tạo tour mới
 * @param {Object} tourData - Dữ liệu của tour mới
 * @returns {Promise<Object>} Tour đã được tạo
 */
exports.createTour = async (tourData) => {
    return await Tour.create(tourData);
};

/**
 * Cập nhật tour theo ID
 * @param {String} id - ID của tour cần cập nhật
 * @param {Object} tourData - Dữ liệu cập nhật
 * @returns {Promise<Object>} Tour đã được cập nhật
 * @throws {AppError} Nếu không tìm thấy tour
 */
exports.updateTour = async (id, tourData) => {
    const tour = await Tour.findByIdAndUpdate(id, tourData, {
        new: true,
        runValidators: true
    });

    if (!tour) {
        throw new AppError(404, `No tour found with ID : ${id}`);
    }
    
    return tour;
};

/**
 * Xóa tour theo ID
 * @param {String} id - ID của tour cần xóa
 * @throws {AppError} Nếu không tìm thấy tour
 */
exports.deleteTour = async (id) => {
    const tour = await Tour.findByIdAndDelete(id);
    
    if (!tour) {
        throw new AppError(404, `No tour found with ID : ${id}`);
    }
    
    return;
};

/**
 * Lấy thống kê tours
 * @returns {Promise<Array>} Thống kê tours theo các chỉ số
 */
exports.getTourStats = async () => {
    return await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                _id: { $toUpper: '$difficulty' },
                numTours: { $sum: 1 },
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        },
        {
            $sort: { avgPrice: 1 }
        }
    ]);
};

/**
 * Lấy kế hoạch tour theo tháng trong năm
 * @param {Number} year - Năm cần lấy thống kê
 * @returns {Promise<Array>} Kế hoạch tour theo tháng
 */
exports.getMonthlyPlan = async (year) => {
    return await Tour.aggregate([
        {
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numTours: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: { month: '$_id' }
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: {
                numTours: -1
            }
        }
    ]);
}; 