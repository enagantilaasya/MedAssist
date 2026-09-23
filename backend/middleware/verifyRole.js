export const verifyRole = (...roles) => {
  return (req, res, next) => {
    if (!req.role || !roles.includes(req.role)) {
      return res.status(403).json({
        success: false,
        message: `403 Forbidden: Role '${req.role || 'Guest'}' is not authorized to access this feature`
      });
    }
    next();
  };
};
