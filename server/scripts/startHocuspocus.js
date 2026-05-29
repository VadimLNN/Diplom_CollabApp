const env = require("../config/env");
const logger = require("../utils/logger");
const hocuspocusServer = require("../realtime/hocuspocus_server");

if (!env.hocoPort) {
    throw new Error("HOCO_PORT is required to start Hocuspocus server");
}

hocuspocusServer.listen(env.hocoPort, () => {
    logger.info(`Hocuspocus server started on ws://localhost:${env.hocoPort}`);
});
