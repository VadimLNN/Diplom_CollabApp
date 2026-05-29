const logger = require("../utils/logger");

module.exports = (err, req, res, next) => {
    logger.error({ err, path: req.path, method: req.method }, "Request failed");

    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        error: statusCode === 500 ? "Internal server error" : err.message,
    });
};
