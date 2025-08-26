const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer with Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'user-profiles',
        allowed_formats: ['jpg', 'jpeg', 'png'],
        transformation: [{ width: 500, height: 500, crop: 'limit' }]
    }
});

const upload = multer({ storage });

const transporter = nodemailer.createTransport({
    service: 'gmail', // Or use SMTP configuration
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

// Register with optional profile photo
// router.post('/register', upload.single('profilePhoto'), async (req, res) => {
//     try {
//         const { name, email, password, userType, licenseNumber } = req.body;

//         // Check if user already exists
//         const existingUser = await User.findOne({ email });
//         if (existingUser) {
//             return res.status(400).json({ message: 'User already exists' });
//         }

//         // Vet: Check if license number is required and already used
//         // if (userType === 'vet') {
//         //     if (!licenseNumber || !/^[0-9]{6,7}$/.test(licenseNumber)) {
//         //         return res.status(400).json({ message: 'Invalid or missing license number' });
//         //     }

//         //     const existingLicense = await User.findOne({ licenseNumber });
//         //     if (existingLicense) {
//         //         return res.status(400).json({ message: 'License number already registered' });
//         //     }
//         // }

//         // Hash password
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // Create user object
//         const userData = {
//             name,
//             email,
//             password: hashedPassword,
//             userType,
//         };

//         // Add license if vet
//         // if (userType === 'vet') {
//         //     userData.licenseNumber = licenseNumber;
//         // }

//         // Add profile photo if exists
//         if (req.file) {
//             userData.profilePhoto = req.file.path;
//         }

//         const user = await User.create(userData);

//         // Create token
//         const token = jwt.sign(
//             { id: user._id, userType: user.userType },
//             process.env.JWT_SECRET,
//             { expiresIn: '1d' }
//         );

//         res.status(201).json({
//             user: {
//                 id: user._id,
//                 name: user.name,
//                 email: user.email,
//                 userType: user.userType,
//                 // licenseNumber: user.licenseNumber,
//                 profilePhoto: user.profilePhoto,
//             },
//             token
//         });

//     } catch (error) {
//         console.error('Registration error:', error);
//         res.status(500).json({ message: error.message });
//     }
// });


router.post('/register', upload.single('profilePhoto'), async (req, res) => {
    try {
        const { username, email, password, userType } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const userData = {
            username,
            email,
            password: hashedPassword,
            userType,
            isVerified: false // ✅ add this
        };

        if (req.file) {
            userData.profilePhoto = req.file.path;
        }

        const user = await User.create(userData);

        // Create email verification token
        const verificationToken = jwt.sign(
            { email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        const verificationLink = `http://localhost:5000/auth/verify-email?token=${verificationToken}`;


        // Send verification email
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: user.email,
            subject: 'Verify Your Email',
            text: `Hi ${user.username}, please verify your email by clicking this link: ${verificationLink}`
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) console.error('Email send error:', error);
        });

        res.status(201).json({
            message: 'Registration successful! Please check your email to verify.',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                userType: user.userType,
                profilePhoto: user.profilePhoto
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ message: 'Invalid token' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findOne({ email: decoded.email });
        if (!user) return res.status(400).json({ message: 'User not found' });
        if (user.isVerified) return res.status(400).json({ message: 'Already verified' });

        user.isVerified = true;
        await user.save();

        res.status(200).json({ message: 'Email verified successfully!' });
    } catch (error) {
        res.status(400).json({ message: 'Invalid or expired token' });
    }
});


router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Email and password are required' 
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }

        // ✅ Check if email is verified
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email before logging in.'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }

        const token = jwt.sign(
            { id: user._id, userType: user.userType },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                _id: user._id,
                username: user.username,
                email: user.email,
                userType: user.userType,
                profilePhoto: user.profilePhoto
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
});


// router.post('/login', async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         // Validate request body
//         if (!email || !password) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: 'Email and password are required' 
//             });
//         }

//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: 'Invalid credentials' 
//             });
//         }

//         const isPasswordValid = await bcrypt.compare(password, user.password);
//         if (!isPasswordValid) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: 'Invalid credentials' 
//             });
//         }

//         const token = jwt.sign(
//             { id: user._id, userType: user.userType },
//             process.env.JWT_SECRET,
//             { expiresIn: '1d' }
//         );

//         res.status(200).json({
//             success: true,
//             token,
//             user: {
//                 id: user._id,
//                 _id: user._id,
//                 username: user.username,
//                 email: user.email,
//                 userType: user.userType,
//                 profilePhoto: user.profilePhoto
//             }
//         });

//     } catch (error) {
//         console.error('Login error:', error);
//         res.status(500).json({ 
//             success: false,
//             message: 'Internal server error' 
//         });
//     }
// });



module.exports = router;