const { body, validationResult } = require("express-validator");
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware"); // <-- Импортируем middleware
const authService = require("../services/authService");
const env = require("../config/env");

router.post(
    "/register",
    body("username")
        .isLength({ min: 3 })
        .withMessage("Username must be at least 3 characters long"),
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Если есть ошибки, возвращаем 400 и список ошибок
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const newUser = await authService.register(req.body);
            res.status(201).json(newUser);
        } catch (error) {
            res.status(error.statusCode || 500).json({ error: error.message });
        }
    },
);

router.post(
    "/login",
    [
        body("username").notEmpty().withMessage("Username is required"),
        body("password").notEmpty().withMessage("Password is required"),
    ],
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { accessToken, refreshToken } = await authService.login(
                req.body,
            );

            res.cookie(
                env.refreshCookieName,
                refreshToken,
                getRefreshCookieOptions(),
            );

            return res.json({
                token: accessToken,
            });
        } catch (error) {
            next(error);
        }
    },
);

router.get("/user", authMiddleware, async (req, res) => {
    try {
        const user = await authService.getUserInfo(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch user data" });
    }
});

router.put(
    "/change-password",
    authMiddleware, // Пользователь должен быть авторизован
    body("currentPassword")
        .notEmpty()
        .withMessage("Current password is required"),
    body("newPassword")
        .isLength({ min: 6 })
        .withMessage("New password must be at least 6 characters long"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const userId = req.user.id;
            const { currentPassword, newPassword } = req.body;

            // Вызываем новый метод сервиса для смены пароля
            await authService.changePassword(
                userId,
                currentPassword,
                newPassword,
            );

            res.status(200).json({ message: "Password updated successfully." });
        } catch (error) {
            res.status(error.statusCode || 500).json({ error: error.message });
        }
    },
);

router.delete(
    "/delete-account",
    authMiddleware, // Пользователь должен быть авторизован
    body("password")
        .notEmpty()
        .withMessage("Password is required for confirmation"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const userId = req.user.id;
            const { password } = req.body;

            // Вызываем новый метод сервиса для удаления
            await authService.deleteAccount(userId, password);

            res.status(200).json({ message: "Account deleted successfully." });
        } catch (error) {
            res.status(error.statusCode || 500).json({ error: error.message });
        }
    },
);

router.post("/refresh", async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.[env.refreshCookieName];

        const { accessToken } = await authService.refresh(refreshToken);

        return res.json({
            token: accessToken,
        });
    } catch (error) {
        next(error);
    }
});

router.post("/logout", (req, res) => {
    res.clearCookie(env.refreshCookieName, getRefreshCookieOptions());

    return res.json({ ok: true });
});

const getRefreshCookieOptions = () => ({
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? "none" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
});

module.exports = router;
