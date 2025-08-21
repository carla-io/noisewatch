const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const User = require('../models/User');



// GET /user/profile - Get authenticated user's profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Construct the user profile response
    const userProfile = {
      id: user._id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      profilePhoto: user.profilePhoto,
    };

   

    return res.status(200).json({
      success: true,
      user: userProfile
    });

  } catch (error) {
    console.error('Profile Fetch Error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error fetching profile'
    });
  }
});


 router.get('/getAll', async (req, res) => {
        try {
            const users = await User.find({}, '-password'); // exclude password field
            res.status(200).json({ success: true, users });
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });



router.get('/countUsersOnly', async (req, res) => {
  try {
    const count = await User.countDocuments({ userType: 'user' });
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error('Error counting user-type users:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});



router.get('/getAllUsersOnly', async (req, res) => {
  try {
    const users = await User.find({ userType: 'user' }, '-password');
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Error fetching user-type users:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});






module.exports = router;