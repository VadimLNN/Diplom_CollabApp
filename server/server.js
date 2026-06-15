const { server } = require("./app");
const env = require("./config/env");
const logger = require("./utils/logger");

server.listen(env.port, () => {
    logger.info({ port: env.port }, "REST API started");
    logger.info(
        { url: `http://localhost:${env.port}/api-docs` },
        "Swagger UI available",
    );
});
