const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/userRepository");
const env = require("../config/env");

class AuthService {
    createAccessToken(user) {
        const payload = {
            id: user.id,
            username: user.username,
        };

        return jwt.sign(payload, env.jwtSecret, {
            expiresIn: env.jwtAccessExpiresIn,
        });
    }

    createRefreshToken(user) {
        const payload = {
            id: user.id,
            username: user.username,
            type: "refresh",
        };

        return jwt.sign(payload, env.jwtRefreshSecret, {
            expiresIn: env.jwtRefreshExpiresIn,
        });
    }

    async register(userData) {
        const { username, email, password } = userData;

        if (!username || !email || !password) {
            const error = new Error(
                "Username, email, and password are required",
            );
            error.statusCode = 400;
            throw error;
        }

        const existingUser = await userRepository.findByUsername(username);
        if (existingUser) {
            const error = new Error("Username already exists");
            error.statusCode = 409;
            throw error;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        return userRepository.create({
            username,
            email,
            hashedPassword,
        });
    }

    async login(credentials) {
        const { username, password } = credentials;

        const user = await userRepository.findByUsername(username);
        if (!user) {
            const error = new Error("Invalid credentials");
            error.statusCode = 401;
            throw error;
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.hashed_password,
        );

        if (!isPasswordValid) {
            const error = new Error("Invalid credentials");
            error.statusCode = 401;
            throw error;
        }

        const accessToken = this.createAccessToken(user);
        const refreshToken = this.createRefreshToken(user);

        return {
            accessToken,
            refreshToken,
        };
    }

    async refresh(refreshToken) {
        if (!refreshToken) {
            const error = new Error("Refresh token is required");
            error.statusCode = 401;
            throw error;
        }

        let decoded;

        try {
            decoded = jwt.verify(refreshToken, env.jwtRefreshSecret);
        } catch (error) {
            const authError = new Error("Refresh token is invalid or expired");
            authError.statusCode = 401;
            throw authError;
        }

        if (decoded.type !== "refresh") {
            const error = new Error("Invalid token type");
            error.statusCode = 401;
            throw error;
        }

        const user = await userRepository.findById(decoded.id);
        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 401;
            throw error;
        }

        const accessToken = this.createAccessToken(user);

        return { accessToken };
    }

    async getUserInfo(userId) {
        return userRepository.findById(userId);
    }

    async changePassword(userId, currentPassword, newPassword) {
        const user = await userRepository.findUserWithPassword(userId);
        if (!user) {
            const error = new Error("User not found.");
            error.statusCode = 404;
            throw error;
        }

        const isMatch = await bcrypt.compare(
            currentPassword,
            user.hashed_password,
        );

        if (!isMatch) {
            const error = new Error("Incorrect current password.");
            error.statusCode = 401;
            throw error;
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await userRepository.updatePassword(userId, hashedNewPassword);
    }

    async deleteAccount(userId, password) {
        const user = await userRepository.findUserWithPassword(userId);
        if (!user) {
            const error = new Error("User not found.");
            error.statusCode = 404;
            throw error;
        }

        const isMatch = await bcrypt.compare(password, user.hashed_password);

        if (!isMatch) {
            const error = new Error(
                "Incorrect password. Account deletion failed.",
            );
            error.statusCode = 401;
            throw error;
        }

        await userRepository.deleteById(userId);
    }
}

module.exports = new AuthService();
