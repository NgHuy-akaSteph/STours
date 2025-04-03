'use strict'

const authService = require('../services/auth.service');
const catchAsync = require('../utils/catchSync');
const AppError = require('../utils/app.error');

const createAccessToken = (user, statusCode, res) => {
    const token = authService.signToken(user._id);
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        secure: false,
        httpOnly: true // cookie cannot be accessed or modified in any way by the browser
    }
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    res.cookie('jwt', token, cookieOptions);
    // hide password from output
    user.password = undefined; 

    res.status(statusCode).json({
        status: 'success',
        token: token,
        data: { user }
    });
}

const signUp = catchAsync(async (req, res, next) => {
    const newUser = await authService.signUp(req.body);
    createAccessToken(newUser, 201, res);
});

const logIn = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    
    // Xác thực user và lấy thông tin
    const { user, token } = await authService.logIn(email, password);
    
    // Gửi response
    res.status(200).json({
        status: 'success',
        token,
        data: { user }
    });
});

const protect = catchAsync(async (req, res, next) => {
    // 1) get token
    let token;
    if (req.headers.authorization
        && req.headers.authorization.startsWith('Bearer')) {

        token = req.headers.authorization.split(' ')[1];
    }
    
    // 2) Xác thực token và lấy thông tin user
    const currentUser = await authService.protect(token);
    
    // 3) Gán thông tin user vào request
    req.user = currentUser;
    next();
});

const restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles: ['admin', 'lead-guide']
        if (!roles.includes(req.user.role)) {
            return next(new AppError(403, 'You do not have permission to perform this action'));
        }
        next();
    }
}

const forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Tạo token reset và lưu vào database
    const resetToken = await authService.forgotPassword(req.body.email);
    
    // 2) Tạo URL reset
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    
    // 3) Gửi email
    await authService.sendPasswordResetEmail(req.body.email, resetToken, resetURL);
    
    // 4) Gửi response
    res.status(200).json({
        status: 'success',
        message: 'Token sent to email!'
    });
});

const resetPassword = catchAsync(async (req, res, next) => {
    // 1) Reset mật khẩu và lấy user
    const { user, token } = await authService.resetPassword(
        req.params.token,
        req.body.password,
        req.body.passwordConfirm
    );
    
    // 2) Gửi response với JWT mới
    createAccessToken(user, 200, res);
});

const updatePassword = catchAsync(async (req, res, next) => {
    // 1) Cập nhật mật khẩu và lấy user
    const { user, token } = await authService.updatePassword(
        req.user.id,
        req.body.passwordCurrent,
        req.body.password,
        req.body.passwordConfirm
    );
    
    // 2) Gửi response với JWT mới
    createAccessToken(user, 200, res);
});

module.exports = {
    signUp,
    logIn,
    protect,
    restrictTo,
    forgotPassword,
    resetPassword,
    updatePassword
};