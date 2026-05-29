require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const { loginLimiter } = require("./middleware/rateLimiter");
const tabsRoutes = require("./routes/tabs");

const errorHandler = require("./middleware/errorHandler");

const app = express();
const server = http.createServer(app);

app.use(express.json({ limit: "1mb" }));
app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
        exposedHeaders: ["Authorization"],
    }),
);

app.use("/api/auth/login", loginLimiter);

app.use("/api/auth", require("./routes/auth"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api", tabsRoutes);
app.use(
    "/api/projects/:projectId/permissions",
    require("./routes/permissions"),
);

const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Collaborative Editor API",
            version: "1.0.0",
            description:
                "API документация для проекта коллаборативного редактора. Здесь описаны все эндпоинты для управления пользователями, проектами и документами.",
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 5000}`,
                description: "Development server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ["./routes/*.js"],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandler);

module.exports = { app, server };
