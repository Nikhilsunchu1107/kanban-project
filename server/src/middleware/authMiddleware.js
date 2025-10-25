import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

dotenv.config();

export const protect = async (req, res, next) => {
    let token;

    // Check for the token in the authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1. Get token from the header
            token = req.headers.authorization.split(' ')[1];

            // 2. Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Get user from the token and attach to req object
            // We exclude the password whent fetching the user
            req.user = await User.findById(decoded.id).select('-password');

            // 4. Call the next middleware or controller
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' })
        }
    }

    if (!token) [
        res.status(401).json({ message: 'Not authorized, no token' })
    ]
};