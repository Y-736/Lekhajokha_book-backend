require('dotenv').config();
const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key';
const jwtExpiry = process.env.JWT_EXPIRY || '30d'; // Longer expiry for convenience

const generateToken = (payload) => {
  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiry });
};

const verifyToken = (token) => {
  return jwt.verify(token, jwtSecret);
};

module.exports = {
  generateToken,
  verifyToken
};