'use strict';

const User = require('../models/user.model');
const APIFeatures = require('../utils/api.features');
const AppError = require('../utils/app.error');

/**
 * Lọc đối tượng, chỉ giữ lại các trường được phép
 * @param {Object} obj - Đối tượng cần lọc 
 * @param  {...String} allowedFields - Các trường được phép
 * @returns {Object} Đối tượng đã được lọc
 */
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

/**
 * Lấy tất cả users
 * @param {Object} queryString - Query parameters từ request
 * @returns {Promise<Array>} Danh sách các user
 */
exports.getAllUsers = async (queryString) => {
    const features = new APIFeatures(User.find(), queryString)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    
    return await features.query;
};

/**
 * Lấy user theo ID
 * @param {String} id - ID của user
 * @returns {Promise<Object>} User tìm thấy
 * @throws {AppError} Nếu không tìm thấy user
 */
exports.getUserById = async (id) => {
    const user = await User.findById(id);
    
    if (!user) {
        throw new AppError(404, `No user found with ID: ${id}`);
    }
    
    return user;
};

/**
 * Cập nhật thông tin người dùng hiện tại (chỉ cho phép cập nhật name và email)
 * @param {String} userId - ID của user cần cập nhật
 * @param {Object} userData - Dữ liệu cập nhật
 * @returns {Promise<Object>} User đã được cập nhật
 * @throws {AppError} Nếu dữ liệu không hợp lệ hoặc không tìm thấy user
 */
exports.updateMe = async (userId, userData) => {
    // Kiểm tra nếu có cố gắng cập nhật mật khẩu
    if (userData.password || userData.passwordConfirm) {
        throw new AppError(400, 'You cannot update password on this route');
    }
    
    // Chỉ lọc ra các trường được phép cập nhật
    const filteredBody = filterObj(userData, 'name', 'email');
    
    // Cập nhật user
    const updatedUser = await User.findByIdAndUpdate(userId, filteredBody, {
        new: true,
        runValidators: true,
    });
    
    if (!updatedUser) {
        throw new AppError(404, `No user found with ID: ${userId}`);
    }
    
    return updatedUser;
};

/**
 * Vô hiệu hóa tài khoản người dùng (đánh dấu không hoạt động)
 * @param {String} userId - ID của user cần vô hiệu hóa
 * @returns {Promise<void>}
 */
exports.deleteMe = async (userId) => {
    const user = await User.findByIdAndUpdate(userId, { active: false });
    
    if (!user) {
        throw new AppError(404, `No user found with ID: ${userId}`);
    }
    
    return;
};

/**
 * Cập nhật thông tin user (admin only)
 * @param {String} id - ID của user cần cập nhật
 * @param {Object} userData - Dữ liệu cập nhật
 * @returns {Promise<Object>} User đã được cập nhật
 */
exports.updateUser = async (id, userData) => {
    // Không sử dụng method này để cập nhật mật khẩu
    if (userData.password) {
        throw new AppError(400, 'Please use /updateMyPassword to update password');
    }
    
    const user = await User.findByIdAndUpdate(id, userData, {
        new: true,
        runValidators: true
    });
    
    if (!user) {
        throw new AppError(404, `No user found with ID: ${id}`);
    }
    
    return user;
};

/**
 * Xóa user theo ID (admin only)
 * @param {String} id - ID của user cần xóa
 * @returns {Promise<void>}
 */
exports.deleteUser = async (id) => {
    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
        throw new AppError(404, `No user found with ID: ${id}`);
    }
    
    return;
}; 