import { User } from '../models/index.js';

const adminOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('audience');
    if (!user.audience.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default adminOnly;