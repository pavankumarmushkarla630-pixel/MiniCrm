import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { apiResponse, apiError } from '../utils/apiResponse.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'strict', // 'none' required for cross-origin (Netlify → Render)
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
};

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return apiError(res, 400, 'User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    const token = generateToken(user._id);
    setTokenCookie(res, token);
    
    return apiResponse(res, 201, {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token, // Also send token in response body for flexibility
    });
  } else {
    return apiError(res, 400, 'Invalid user data');
  }
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    const token = generateToken(user._id);
    setTokenCookie(res, token);

    return apiResponse(res, 200, {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } else {
    return apiError(res, 401, 'Invalid email or password');
  }
});

export const refreshUser = asyncHandler(async (req, res) => {
  const token = req.cookies.jwt;
  
  if (!token) {
    return apiError(res, 401, 'Not authorized, no token');
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
       return apiError(res, 401, 'User not found');
    }
    
    // Refresh the token
    const newToken = generateToken(user._id);
    setTokenCookie(res, newToken);
    
    return apiResponse(res, 200, {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: newToken
    });
  } catch (error) {
    return apiError(res, 401, 'Token failed or expired');
  }
});

export const logoutUser = asyncHandler(async (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  return apiResponse(res, 200, { message: 'Logged out successfully' });
});
