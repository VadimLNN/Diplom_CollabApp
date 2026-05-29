const accessService = require("../services/accessService");

const hasRole = (allowedRoles) => {
    return async (req, res, next) => {
        const projectId = req.params.projectId || req.params.id;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: "Authentication required" });
        }

        if (!projectId) {
            return res.status(400).json({ error: "Project ID missing" });
        }

        try {
            const role =
                req.projectRole ||
                (await accessService.getUserRoleInProject(userId, projectId));

            if (!role || !allowedRoles.includes(role)) {
                return res.status(403).json({
                    error: "Forbidden: Insufficient permissions.",
                });
            }

            req.projectRole = role;

            return next();
        } catch (error) {
            return res.status(500).json({
                error: "Server error checking role",
            });
        }
    };
};

module.exports = {
    hasRole,
};
