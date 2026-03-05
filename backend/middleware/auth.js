const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    // 1. Try httpOnly cookie first (new secure method)
    // 2. Fall back to Authorization header (keeps old API calls working during transition)
    const token =
      req.cookies?.token ||
      req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      ...decoded,
      role: decoded.role || 'patient' // fallback for tokens issued before role was added
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }
    res.status(401).json({ error: 'Token is not valid' });
  }
};

module.exports = auth;
