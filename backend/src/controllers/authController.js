const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const userModel = require('../models/userModel');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { sendEmail } = require('../utils/email');
const { AppError } = require('../middleware/errorHandler');
const { clientUrl } = require('../config/env');

function sanitize(user) {
  const { passwordHash, resetToken, resetTokenExpires, ...safe } = user;
  return safe;
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      throw new AppError('Name, email, and password are required', 400);
    }
    const existing = await userModel.findByEmail(email);
    if (existing) throw new AppError('Email already registered', 409);

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await userModel.create({ name, email, passwordHash });

    const accessToken = signAccessToken({ id: user.id, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id });

    res.status(201).json({ success: true, user: sanitize(user), accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new AppError('Email and password are required', 400);

    const user = await userModel.findByEmail(email);
    if (!user) throw new AppError('Invalid credentials', 401);

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) throw new AppError('Invalid credentials', 401);

    const accessToken = signAccessToken({ id: user.id, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id });

    res.json({ success: true, user: sanitize(user), accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError('Refresh token required', 400);

    const decoded = verifyRefreshToken(refreshToken);
    const user = await userModel.findById(decoded.id);
    if (!user) throw new AppError('User not found', 404);

    const accessToken = signAccessToken({ id: user.id, role: user.role });
    res.json({ success: true, accessToken });
  } catch (err) {
    next(new AppError('Invalid or expired refresh token', 401));
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await userModel.findByEmail(email);
    // Always respond success to avoid leaking which emails are registered
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expires = Date.now() + 1000 * 60 * 30; // 30 min
      await userModel.setResetToken(email, token, expires);

      const resetUrl = `${clientUrl}/reset-password/${token}`;
      await sendEmail({
        to: email,
        subject: 'Reset your password',
        html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Expires in 30 minutes.</p>`,
      });
    }
    res.json({ success: true, message: 'If that email exists, a reset link has been sent' });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password) throw new AppError('New password is required', 400);

    const user = await userModel.findByResetToken(token);
    if (!user) throw new AppError('Invalid or expired reset token', 400);

    const passwordHash = await bcrypt.hash(password, 12);
    await userModel.updateById(user.id, {
      passwordHash,
      resetToken: null,
      resetTokenExpires: null,
    });

    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) throw new AppError('User not found', 404);
    res.json({ success: true, user: sanitize(user) });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name } = req.body;
    const user = await userModel.updateById(req.user.id, { name });
    if (!user) throw new AppError('User not found', 404);
    res.json({ success: true, user: sanitize(user) });
  } catch (err) {
    next(err);
  }
}

function logout(req, res) {
  // Stateless JWT: client discards tokens. If you add refresh-token
  // revocation later, blacklist it here.
  res.json({ success: true, message: 'Logged out' });
}

module.exports = {
  register,
  login,
  refresh,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  logout,
};
