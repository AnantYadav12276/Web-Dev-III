const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { appEvents, EVENTS } = require('../utils/events');

const generateToken = (user) =>
  jwt.sign(
    {
      id: user._id.toString(),
      username: user.username,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

// POST /api/auth/signup
const signup = async (req, res) => {
  const { username, email, password } = req.body || {};

  if (!username || !email || !password) {
    throw new ApiError(400, 'username, email and password are required');
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedUsername = String(username).trim();

  const existing = await User.findOne({
    $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
  });

  if (existing) {
    throw new ApiError(409, 'Username or email is already registered');
  }

  // Role is never taken from the request body, so users cannot make themselves admins
  const user = await User.create({
    username: normalizedUsername,
    email: normalizedEmail,
    password: String(password),
  });

  appEvents.emit(EVENTS.USER_REGISTERED, {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
  });

  res.status(201).json({
    message: 'User registered',
    id: user._id,
    username: user.username,
    email: user.email,
  });
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    throw new ApiError(400, 'email and password are required');
  }

  const user = await User.findOne({
    email: String(email).trim().toLowerCase(),
  }).select('+password');

  const isMatch = user && (await user.comparePassword(String(password)));

  if (!isMatch) {
    // Same message for unknown email and wrong password to avoid account enumeration
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = generateToken(user);

  appEvents.emit(EVENTS.USER_LOGGED_IN, {
    id: user._id.toString(),
    username: user.username,
  });

  res.status(200).json({
    message: 'Login successful',
    token,
  });
};

module.exports = { signup, login };
