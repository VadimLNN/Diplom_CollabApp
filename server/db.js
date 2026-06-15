const { Pool } = require("pg");
const env = require("./config/env");
const logger = require("./utils/logger");

const pool = new Pool(
    env.databaseUrl
        ? {
              connectionString: env.databaseUrl,
              ssl: { rejectUnauthorized: false },
          }
        : {
              host: env.db.host,
              user: env.db.user,
              password: env.db.password,
              database: env.db.database,
              port: env.db.port,
          },
);

pool.on("error", (err) => {
    logger.error({ err }, "Unexpected error on idle database client");
});

module.exports = pool;
