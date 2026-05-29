require("dotenv").config();

const required = ["JWT_SECRET"];

for (const key of required) {
    if (!process.env[key]) {
        throw new Error(`Missing required env variable: ${key}`);
    }
}

module.exports = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT || 5000),
    hocoPort: process.env.HOCO_PORT ? Number(process.env.HOCO_PORT) : null,
    jwtSecret: process.env.JWT_SECRET,
    clientUrl: process.env.CLIENT_URL || "http://localhost:3000",

    databaseUrl: process.env.DATABASE_URL,
    db: {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database:
            process.env.NODE_ENV === "test"
                ? process.env.DB_TEST_DATABASE
                : process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT || 5432),
    },
};
