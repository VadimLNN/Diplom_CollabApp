const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const checkProjectAccess = require("../middleware/checkProjectAccess");
const { hasRole } = require("../middleware/checkRole");

const projectService = require("../services/projectService");
const tabService = require("../services/tabService");

const asyncHandler = require("../utils/asyncHandler");

const validate = require("../middleware/validate");
const { validateProjectId } = require("../validators/commonValidators");
const { createTabValidator } = require("../validators/tabValidators");

router.use(authMiddleware);

// CREATE
router.post(
    "/",
    [
        body("name")
            .trim()
            .notEmpty()
            .withMessage("Project name is required")
            .isLength({ max: 100 })
            .withMessage("Max 100 chars"),
        body("description").optional().trim().isLength({ max: 500 }),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const userId = req.user.id;
            const newProject = await projectService.createProject(
                userId,
                req.body,
            );
            res.status(201).json(newProject);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },
);

// READ (ALL)
router.get(
    "/",
    asyncHandler(async (req, res) => {
        const projects = await projectService.getAllProjectsForUser(
            req.user.id,
        );
        res.json(projects);
    }),
);

// READ (ONE)
router.get(
    "/:id",
    checkProjectAccess,
    asyncHandler(async (req, res) => {
        const project = await projectService.getProjectById(req.params.id);

        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        res.json(project);
    }),
);

// UPDATE
router.put(
    "/:id",
    [checkProjectAccess, hasRole(["owner"])],

    body("name")
        .trim()
        .notEmpty()
        .withMessage("Project name cannot be empty.")
        .isLength({ max: 100 })
        .withMessage("Project name cannot be more than 100 characters."),
    body("description")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Description cannot be more than 500 characters."),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const updatedProject = await projectService.updateProject(
                req.params.id,
                req.body,
            );
            res.json(updatedProject);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },
);

// DELETE - Удаление проекта
router.delete(
    "/:id",
    [checkProjectAccess, hasRole(["owner"])],
    async (req, res) => {
        try {
            await projectService.deleteProject(req.params.id);
            res.status(200).json({ message: "Project deleted successfully" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to delete project" });
        }
    },
);

router.get(
    "/:projectId/tabs",
    checkProjectAccess,
    asyncHandler(async (req, res) => {
        const tabs = await tabService.getTabsForProject(req.params.projectId);
        res.json(tabs);
    }),
);

router.post(
    "/:projectId/tabs",
    [
        validateProjectId,
        checkProjectAccess,
        hasRole(["owner", "editor"]),
        ...createTabValidator,
        validate,
    ],
    asyncHandler(async (req, res) => {
        const newTab = await tabService.createTab(
            req.user.id,
            req.params.projectId,
            req.body,
        );

        res.status(201).json(newTab);
    }),
);

module.exports = router;
