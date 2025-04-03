'use strict';

const Review = require('../models/review.model');
const APIFeatures = require('../utils/api.features');
const AppError = require('../utils/app.error');

/**
 * Lấy tất cả reviews
 * @param {Object} queryString - Query parameters từ request
 * @returns {Promise<Array>} Danh sách các review
 */
const getAllReviews = async (queryString) => {
    let filter = {};
    
    // Nếu có tour ID, lọc reviews theo tour đó
    if (queryString.tourId) filter = { tour: queryString.tourId };
    
    const features = new APIFeatures(Review.find(filter), queryString)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    
    return await features.query;
};

/**
 * Lấy review theo ID
 * @param {String} id - ID của review
 * @returns {Promise<Object>} Review tìm thấy
 * @throws {AppError} Nếu không tìm thấy review
 */
const getReviewById = async (id) => {
    const review = await Review.findById(id).select('-__v');
    
    if (!review) {
        throw new AppError(404, `No review found with ID: ${id}`);
    }
    
    return review;
};

/**
 * Tạo review mới
 * @param {Object} reviewData - Dữ liệu của review
 * @param {String} userId - ID của user tạo review
 * @returns {Promise<Object>} Review đã được tạo
 */
const createReview = async (reviewData, userId) => {

    // Đảm bảo user ID được set trong review
    if (!reviewData.user) reviewData.user = userId;
    
    return await Review.create(reviewData);
};

/**
 * Cập nhật review
 * @param {String} id - ID của review cần cập nhật
 * @param {Object} reviewData - Dữ liệu cập nhật
 * @returns {Promise<Object>} Review đã được cập nhật
 * @throws {AppError} Nếu không tìm thấy review
 */
const updateReview = async (id, reviewData) => {
    const review = await Review.findByIdAndUpdate(id, reviewData, {
        new: true,
        runValidators: true
    });
    
    if (!review) {
        throw new AppError(404, `No review found with ID: ${id}`);
    }
    
    return review;
};

/**
 * Xóa review
 * @param {String} id - ID của review cần xóa
 * @throws {AppError} Nếu không tìm thấy review
 */
const deleteReview = async (id) => {
    const review = await Review.findByIdAndDelete(id);
    
    if (!review) {
        throw new AppError(404, `No review found with ID: ${id}`);
    }
    
    return;
}; 

module.exports = {
    getAllReviews,
    getReviewById,
    createReview,
    updateReview,
    deleteReview
}