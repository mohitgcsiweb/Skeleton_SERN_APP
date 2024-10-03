import jwt from 'jsonwebtoken';   
import { User } from '../models/index.js';
import { jwtSecret } from "../config.js";

const { verify } = jwt;

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
    const verified = verify(token, jwtSecret);
    if (!verified) return res.status(401).json({ message: "Token verification failed, authorization denied" });
    req.user = await User.findById(verified.id).populate('audience');
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export default authenticate;