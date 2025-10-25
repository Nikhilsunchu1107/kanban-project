import User from "../models/userModel.js";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from "bcryptjs";

dotenv.config();

// Function to generate a token
const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
    try {
        const {name, email, password} = req.body;

        // 1. Check if the user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({message: 'User already exists'});
        }

        // 2. Create a new user (password will be hashed by the model)
        const user = await User.create({
            name,
            email,
            password,
        });

        // 3. If user created successfully, send back user data and token
        if (user) {
            res.status(201).json({
                id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Auth user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find user by email
        const user = await User.findOne({ email });

        // 2. Check if user exists AND if password matches
        // We use bcrypt.compare to check the plaintext password against the hashed one
        if (user && (await bcrypt.compare(password, user.password))) {
            // 3. User is valid, send back data and token
            res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id),
            });
        } else {
            // 4. User not found or password incorrect
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private (Needs token)
export const getUserProfile = async (req, res) => {
  // req.user was added by the protect middleware
  if (req.user) {
    res.status(200).json(req.user);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};