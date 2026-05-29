const { param } = require("express-validator");

const validateProjectId = param("projectId")
    .isInt({ min: 1 })
    .withMessage("Project ID must be a positive integer");

const validateId = param("id")
    .isInt({ min: 1 })
    .withMessage("ID must be a positive integer");

const validateUserId = param("userId")
    .isInt({ min: 1 })
    .withMessage("User ID must be a positive integer");

const validateTabId = param("tabId")
    .isUUID()
    .withMessage("Tab ID must be a valid UUID");

module.exports = {
    validateProjectId,
    validateId,
    validateUserId,
    validateTabId,
};
