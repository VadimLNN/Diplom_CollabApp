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
];

module.exports = {
    createTabValidator,
};
