const accessService = require("../services/accessService");

const checkProjectAccess = async (req, res, next) => {
    const projectId = req.params.projectId || req.params.id;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({
            error: "UNAUTHORIZED",
            message: "Authentication required",
        });
    }

    if (!projectId) {
        return res.status(400).json({
            error: "VALIDATION_ERROR",
            message: "Project ID missing",
        });
    }

    try {
        const role = await accessService.assertProjectAccess(userId, projectId);

        req.projectRole = role;

        return next();
    } catch (error) {
        const statusCode = error.statusCode || 500;
        const message = error.statusCode
            ? error.message
            : "Server error checking access";

        return res.status(statusCode).json({
            error:
                statusCode === 500
                    ? "INTERNAL_ERROR"
                    : error.code || error.message,
            message,
        });
    }
};

module.exports = checkProjectAccess;
