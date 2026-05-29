const env = require("../config/env");
const logger = require("../utils/logger");
const hocuspocusServer = require("../realtime/hocuspocus_server");
const pool = require("../db");

if (!env.hocoPort) {
    throw new Error("HOCO_PORT is required to start Hocuspocus server");
}

hocuspocusServer.listen(env.hocoPort, () => {
    logger.info(`Hocuspocus server started on ws://localhost:${env.hocoPort}`);
});

async function shutdown(signal) {
    logger.info({ signal }, "Stopping Hocuspocus server");

    try {
        await hocuspocusServer.destroy();
        await pool.end();

        logger.info("Hocuspocus server stopped cleanly");
        process.exit(0);
    } catch (err) {
        logger.error({ err }, "Failed to stop Hocuspocus server cleanly");
        process.exit(1);
    }
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
