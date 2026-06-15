const { body } = require("express-validator");

const createTabValidator = [
    body("title")
        .trim()
        .notEmpty()
        .withMessage("Title required")
        .isLength({ max: 100 })
        .withMessage("Title cannot be more than 100 characters"),

    body("type")
        .isIn(["text", "board"])
        .withMessage("Type must be either text or board"),

    body("description")
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 500 })
        .withMessage("Description cannot be more than 500 characters"),
];

const updateTabValidator = [
    body("title")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Title required")
        .isLength({ max: 100 })
        .withMessage("Title cannot be more than 100 characters"),

    body("description")
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 500 })
        .withMessage("Description cannot be more than 500 characters"),

    body("type")
        .optional()
        .isIn(["text", "board"])
        .withMessage("Type must be either text or board"),
];

module.exports = {
    createTabValidator,
    updateTabValidator,
};
