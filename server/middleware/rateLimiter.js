const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: ipKeyGenerator,
    message: {
        error: "Too many login attempts from this IP, please try again later",
    },
});

module.exports = {
    loginLimiter,
};
