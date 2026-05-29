const accessService = require("../services/accessService");

const checkProjectAccess = async (req, res, next) => {
    const projectId = req.params.projectId || req.params.id;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
    }

    if (!projectId) {
        return res.status(400).json({ error: "Project ID missing" });
    }

    try {
        const role = await accessService.assertProjectAccess(userId, projectId);

        req.projectRole = role;

        return next();
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            error: error.statusCode
                ? error.message
                : "Server error checking access",
        });
    }
};

module.exports = checkProjectAccess;
