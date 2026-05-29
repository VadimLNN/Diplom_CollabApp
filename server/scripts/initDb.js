require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const logger = require("../utils/logger");

async function init() {
    const sqlPath = path.join(__dirname, "..", "db.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    const client = new Client(
        process.env.DATABASE_URL
            ? {
                  connectionString: process.env.DATABASE_URL,
                  ssl:
                      process.env.DB_SSL_REJECT_UNAUTHORIZED === "false"
                          ? { rejectUnauthorized: false }
                          : true,
              }
            : {
                  host: process.env.DB_HOST,
                  user: process.env.DB_USER,
                  password: process.env.DB_PASSWORD,
                  database: process.env.DB_DATABASE,
                  port: Number(process.env.DB_PORT || 5432),
              },
    );

    try {
        await client.connect();
        logger.info("Connected to database");

        await client.query(sql);
        logger.info("Database schema initialized");
    } catch (err) {
        logger.error({ err }, "Database initialization failed");
        process.exitCode = 1;
    } finally {
        await client.end();
    }
}

init();
