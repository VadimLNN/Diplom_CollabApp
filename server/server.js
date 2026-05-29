const { server } = require("./app");
const env = require("./config/env");

server.listen(env.port, () => {
    console.log(`Server started on http://localhost:${env.port}`);
    console.log(
        `Swagger docs available at http://localhost:${env.port}/api-docs`,
    );
});
