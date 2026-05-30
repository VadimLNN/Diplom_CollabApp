const jwt = require("jsonwebtoken");
const env = require("../config/env");

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            error: "Authentication token is required",
            code: "AUTH_TOKEN_REQUIRED",
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, env.jwtSecret);

        req.user = { id: decoded.id };

        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                error: "Token has expired",
                code: "ACCESS_TOKEN_EXPIRED",
            });
        }

        return res.status(401).json({
            error: "Token is invalid",
            code: "ACCESS_TOKEN_INVALID",
        });
    }
};
