const { param } = require("express-validator");

const validateProjectId = param("projectId")
    .isInt({ min: 1 })
    .withMessage("Project ID must be a positive integer");

module.exports = {
    validateProjectId,
};
