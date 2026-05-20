const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

const requireAdmin = requireRole(['Admin']);
const requireMember = requireRole(['Admin', 'Member']); // Admins can do anything members can do

module.exports = {
  requireRole,
  requireAdmin,
  requireMember
};
