const pool = require("../db");

class UserRepository {
    async findByUsername(username) {
        const { rows } = await pool.query(
            `SELECT
                id,
                username,
                email,
                hashed_password,
                created_at
             FROM users
             WHERE username = $1`,
            [username],
        );

        return rows[0];
    }

    async findById(userId) {
        const { rows } = await pool.query(
            `SELECT
                id,
                username,
                email,
                created_at
             FROM users
             WHERE id = $1`,
            [userId],
        );

        return rows[0];
    }

    async create({ username, email, hashedPassword }) {
        const { rows } = await pool.query(
            `INSERT INTO users (username, hashed_password, email)
             VALUES ($1, $2, $3)
             RETURNING id, username, email, created_at`,
            [username, hashedPassword, email],
        );

        return rows[0];
    }

    async findByEmail(email) {
        const { rows } = await pool.query(
            `SELECT
                id,
                username,
                email,
                created_at
             FROM users
             WHERE email = $1`,
            [email],
        );

        return rows[0];
    }

    async findUserWithPassword(userId) {
        const { rows } = await pool.query(
            `SELECT
                id,
                username,
                email,
                hashed_password,
                created_at
             FROM users
             WHERE id = $1`,
            [userId],
        );

        return rows[0];
    }

    async updatePassword(userId, newPasswordHash) {
        await pool.query(
            `UPDATE users
             SET hashed_password = $1
             WHERE id = $2`,
            [newPasswordHash, userId],
        );
    }

    async deleteById(userId) {
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            await client.query("DELETE FROM projects WHERE owner_id = $1", [
                userId,
            ]);

            await client.query(
                "DELETE FROM project_permissions WHERE user_id = $1",
                [userId],
            );

            await client.query("DELETE FROM users WHERE id = $1", [userId]);

            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = new UserRepository();
