export const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  next();
};

export const attachUser = (req, res, next) => {
  if (req.isAuthenticated()) {
    req.userId = req.user.id;
  }
  next();
};
