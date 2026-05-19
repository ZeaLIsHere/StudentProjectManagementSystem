import ApiError from '../utils/ApiError.js';

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Autentikasi diperlukan');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, 'Anda tidak memiliki izin untuk mengakses resource ini');
    }

    next();
  };
};

export default authorize;
