const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/jwt');

// Retailer Signup
exports.signup = async (req, res) => {
  try {
    const { name, mobile, email, password } = req.body;
    
    // Check if retailer exists
    const [existing] = await pool.query(
      'SELECT * FROM retailers WHERE email = ? OR mobile = ?', 
      [email, mobile]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Email or mobile already registered' 
      });
    }

    // Create retailer account
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO retailers (name, mobile, email, password) VALUES (?, ?, ?, ?)',
      [name, mobile, email, hashedPassword]
    );

    // Generate token
    const token = generateToken({
      id: result.insertId,
      email: email,
      name: name
    });

    res.status(201).json({ 
      success: true,
      message: 'Account created successfully',
      token,
      retailer: {
        id: result.insertId,
        name,
        email,
        mobile
      }
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
};

// Retailer Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if retailer exists
    const [retailer] = await pool.query(
      'SELECT id, name, email, mobile, password FROM retailers WHERE email = ?',
      [email]
    );

    if (!retailer || retailer.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, retailer[0].password);
    if (!isMatch) {
      return res.status(200).json({
        success: false, 
        message: 'Invalid credentials'
      });
    }

    // Successful login
    const token = generateToken({
      id: retailer[0].id,
      email: retailer[0].email,
      name: retailer[0].name
    });

    res.json({
      success: true,
      token,
      retailer: {
        id: retailer[0].id,
        name: retailer[0].name,
        email: retailer[0].email,
        mobile: retailer[0].mobile
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};