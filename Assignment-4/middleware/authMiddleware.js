const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

// Pulls the token from, in order:
//   1. Authorization: Bearer <token>
//   2. token: <token>  (custom header)
//   3. Cookie: token=<token>
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  if (req.headers.token) {
    return String(req.headers.token).trim();
  }

  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }

  return null;
};

// Verifies the JWT and attaches { id, username, role } to req.user
const protect = (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return next(new ApiError(403, 'No token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
    };
    next();
  } catch (err) {
    next(new ApiError(401, 'Invalid or expired token'));
  }
};

// Role-based access control: use after protect()
// Example: router.get('/admin', protect, authorize('admin'), handler)
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to perform this action'));
  }
  next();
};

module.exports = { protect, authorize };
