const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate
    if (!email || !password) {
      return res.status(400).json({ message: 'Not all fields have been entered.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, villageId: user.villageId },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        villageId: user.villageId
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userProfile = await User.findById(req.user.id)
      .select('-password')
      .populate('villageId', 'name district state villageId');
    
    if (!userProfile) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(userProfile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
