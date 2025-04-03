'use strict';

const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user.model');
const AppError = require('../utils/app.error');
const sendEmail = require('../utils/email');

/**
 * Tạo JWT token từ user ID
 * @param {String} id - ID của user
 * @returns {String} JWT token đã ký
 */
exports.signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

/**
 * Đăng ký tài khoản mới
 * @param {Object} userData - Dữ liệu đăng ký
 * @returns {Promise<Object>} User đã được tạo
 */
exports.signUp = async (userData) => {
    return await User.create(userData);
};

/**
 * Đăng nhập
 * @param {String} email - Email đăng nhập
 * @param {String} password - Mật khẩu đăng nhập
 * @returns {Promise<Object>} User đã đăng nhập và token
 * @throws {AppError} Nếu thông tin đăng nhập không hợp lệ
 */
exports.logIn = async (email, password) => {
    // Kiểm tra nếu email và password được cung cấp
    if (!email || !password) {
        throw new AppError(400, 'Please provide email and password');
    }
    
    // Kiểm tra nếu user tồn tại và password đúng
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.correctPassword(password, user.password))) {
        throw new AppError(401, 'Incorrect email or password');
    }
    
    // Trả về user và token
    return {
        user,
        token: exports.signToken(user._id)
    };
};

/**
 * Xác thực token và lấy thông tin user
 * @param {String} token - JWT token cần xác thực
 * @returns {Promise<Object>} User tương ứng với token
 * @throws {AppError} Nếu token không hợp lệ hoặc user không tồn tại
 */
exports.protect = async (token) => {
    // Kiểm tra nếu token không tồn tại
    if (!token) {
        throw new AppError(401, 'You are not logged in! Please log in to get access');
    }
    
    // Xác thực token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    
    // Kiểm tra nếu user vẫn tồn tại
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        throw new AppError(401, 'The user belonging to this token does no longer exist');
    }
    
    // Kiểm tra nếu user đã thay đổi mật khẩu sau khi token được tạo
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        throw new AppError(401, 'User recently changed password! Please log in again');
    }
    
    // Trả về user
    return currentUser;
};

/**
 * Quên mật khẩu - tạo token reset và gửi email
 * @param {String} email - Email của tài khoản cần reset
 * @returns {Promise<String>} Token reset (chưa mã hóa)
 * @throws {AppError} Nếu email không tồn tại
 */
exports.forgotPassword = async (email) => {
    // Tìm user với email
    const user = await User.findOne({ email });
    if (!user) {
        throw new AppError(404, 'There is no user with that email address');
    }
    
    // Tạo token reset ngẫu nhiên
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    
    return resetToken;
};

/**
 * Gửi email reset mật khẩu
 * @param {String} email - Email nhận
 * @param {String} resetToken - Token reset
 * @param {String} resetURL - URL reset mật khẩu
 * @returns {Promise<void>}
 * @throws {AppError} Nếu không thể gửi email
 */
exports.sendPasswordResetEmail = async (email, resetToken, resetURL) => {
    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;
    
    try {
        await sendEmail({
            email,
            subject: 'Your password reset token (valid for 10 min)',
            message
        });
    } catch (err) {
        // Nếu gửi email thất bại, xóa token và expires
        const user = await User.findOne({ email });
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        
        throw new AppError(500, 'There was an error sending the email. Try again later!');
    }
};

/**
 * Reset mật khẩu
 * @param {String} token - Token reset (chưa mã hóa)
 * @param {String} password - Mật khẩu mới
 * @param {String} passwordConfirm - Xác nhận mật khẩu mới
 * @returns {Promise<Object>} User đã được cập nhật và token
 * @throws {AppError} Nếu token không hợp lệ hoặc đã hết hạn
 */
exports.resetPassword = async (token, password, passwordConfirm) => {
    // Mã hóa token để tìm kiếm trong DB
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
    
    // Tìm user với token và kiểm tra nếu token chưa hết hạn
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });
    
    if (!user) {
        throw new AppError(400, 'Token is invalid or has expired');
    }
    
    // Cập nhật mật khẩu mới
    user.password = password;
    user.passwordConfirm = passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    // Trả về user và token
    return {
        user,
        token: exports.signToken(user._id)
    };
};

/**
 * Cập nhật mật khẩu
 * @param {String} userId - ID của user
 * @param {String} currentPassword - Mật khẩu hiện tại
 * @param {String} newPassword - Mật khẩu mới
 * @param {String} newPasswordConfirm - Xác nhận mật khẩu mới
 * @returns {Promise<Object>} User đã được cập nhật và token
 * @throws {AppError} Nếu mật khẩu hiện tại không đúng
 */
exports.updatePassword = async (userId, currentPassword, newPassword, newPasswordConfirm) => {
    // Tìm user và lấy password
    const user = await User.findById(userId).select('+password');
    
    // Kiểm tra nếu mật khẩu hiện tại đúng
    if (!(await user.correctPassword(currentPassword, user.password))) {
        throw new AppError(401, 'Your current password is wrong');
    }
    
    // Cập nhật mật khẩu
    user.password = newPassword;
    user.passwordConfirm = newPasswordConfirm;
    await user.save();
    
    // Trả về user và token
    return {
        user,
        token: exports.signToken(user._id)
    };
}; 