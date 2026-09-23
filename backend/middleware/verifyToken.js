import jwt from 'jsonwebtoken';
import { UserModel } from '../models/UserModel.js';

export const verifyToken = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token Missing. Please login to access this resource.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'medassist_student_super_secret_jwt_key_2026');

    // Verify user exists and is active
    const user = await UserModel.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.'
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact Clinic Admin.'
      });
    }

    req.userId = decoded.userId;
    req.role = decoded.role;
    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or Expired Token'
    });
  }
};
