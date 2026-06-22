const accessService = require("../services/accessService");

const hasRole = (allowedRoles) => {
    return async (req, res, next) => {
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
            const role =
                req.projectRole ||
                (await accessService.getUserRoleInProject(userId, projectId));

            if (!role || !allowedRoles.includes(role)) {
                return res.status(403).json({
                    error: "PROJECT_FORBIDDEN",
                    message: "Forbidden: Insufficient permissions.",
                });
            }

            req.projectRole = role;

            return next();
        } catch (error) {
            const statusCode = error.statusCode || 500;
            const message = error.statusCode
                ? error.message
                : "Server error checking role";

            return res.status(statusCode).json({
                error:
                    statusCode === 500
                        ? "INTERNAL_ERROR"
                        : error.code || error.message,
                message,
            });
        }
    };
};

module.exports = {
    hasRole,
};
