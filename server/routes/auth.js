const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'studyai_jwt_secret_key_2024';

// Helper to generate a JWT
const generateToken = (id, name, email) => {
    return jwt.sign({ id, name, email }, JWT_SECRET, { expiresIn: '7d' });
};


// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please fill in all fields.' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        const user = await User.create({ name, email, password });
        const token = generateToken(user._id, user.name, user.email);

        res.status(201).json({
            token,
            user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin },
        });
    } catch (err) {
        console.error('Register Error:', err);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        console.log('Login attempt for:', email);
        const user = await User.findOne({ email });

        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.password) {
            console.log('User has no password (likely Google-only):', email);
            return res.status(401).json({ message: 'This account uses Google Login. Please sign in with Google.' });
        }

        console.log('Comparing passwords...');
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            console.log('Password mismatch for:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log('Password match, generating token...');
        const token = generateToken(user._id, user.name, user.email);

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                isAdmin: user.isAdmin
            },
        });
    } catch (err) {
        console.error('Login Route Error:', err);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

// @route   POST /api/auth/google-login
// @desc    Authenticate with Google
router.post('/google-login', async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ message: 'Google Token is required.' });
        }

        console.log('Verifying Google Token with Client ID:', process.env.GOOGLE_CLIENT_ID);

        // Verify Google Token
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture: avatar } = payload;

        // Check if user exists
        let user = await User.findOne({ email });

        if (!user) {
            console.log('Creating new user for:', email);
            // Create New Verified User
            user = await User.create({
                name,
                email,
                googleId,
                avatar,
            });
        } else {
            console.log('Found existing user:', email);
            if (!user.googleId) {
                console.log('Linking Google ID to existing user');
                // Link Google account to existing email user
                user.googleId = googleId;
                if (avatar) user.avatar = avatar;
                await user.save();
            }
        }

        const token = generateToken(user._id, user.name, user.email);

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                isAdmin: user.isAdmin,
                isVerified: true
            },
        });
    } catch (err) {
        console.error('Google Login Error:', err);
        res.status(500).json({ message: 'Google Authentication failed.' });
    }
});

module.exports = router;
