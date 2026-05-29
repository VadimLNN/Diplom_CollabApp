const logger = require("../utils/logger");

module.exports = (err, req, res, next) => {
    logger.error(
        {
            err,
            method: req.method,
            path: req.originalUrl,
            userId: req.user?.id,
        },
        "Request failed",
    );

    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        error: statusCode === 500 ? "Internal server error" : err.message,
    });
};
