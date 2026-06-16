const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router({ mergeParams: true });

const authMiddleware = require("../middleware/authMiddleware");
const checkProjectAccess = require("../middleware/checkProjectAccess");
const { hasRole } = require("../middleware/checkRole");

const permissionService = require("../services/permissionService");
const logger = require("../utils/logger");

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Permissions
 *   description: Управление доступом пользователей к проектам
 */

/**
 * @swagger
 * /api/projects/{projectId}/permissions:
 *   get:
 *     summary: Получить список всех участников проекта
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Список участников проекта, включая владельца.
 *       403:
 *         description: Доступ к проекту запрещен.
 */
router.get("/", checkProjectAccess, async (req, res) => {
    try {
        const members = await permissionService.getProjectMembers(
            req.params.projectId,
        );
        res.json(members);
    } catch (error) {
        logger.error(
            { err: error, projectId: req.params.projectId },
            "Failed to fetch project members",
        );
        res.status(500).json({ error: "Failed to fetch project members" });
    }
});

/**
 * @swagger
 * /api/projects/{projectId}/permissions/my-role:
 *   get:
 *     summary: Получить свою роль в проекте
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Роль текущего пользователя.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 role:
 *                   type: string
 *                   example: editor
 *       403:
 *         description: Доступ к проекту запрещен.
 */
router.get("/my-role", checkProjectAccess, async (req, res) => {
    try {
        const role = await permissionService.getUserRole(
            req.user.id,
            req.params.projectId,
        );

        if (role) {
            res.json({ role });
        } else {
            res.status(404).json({
                error: "Role for this user in this project not found.",
            });
        }
    } catch (error) {
        logger.error(
            {
                err: error,
                projectId: req.params.projectId,
                userId: req.user.id,
            },
            "Failed to determine project role",
        );
        res.status(500).json({
            error: "Could not determine user role due to a server error.",
        });
    }
});

/**
 * @swagger
 * /api/projects/{projectId}/permissions:
 *   post:
 *     summary: Пригласить нового пользователя в проект (только для владельца)
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, role]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "newmember@example.com"
 *               role:
 *                 type: string
 *                 enum: [editor, viewer]
 *                 example: "editor"
 *     responses:
 *       201:
 *         description: Пользователь успешно приглашен.
 *       403:
 *         description: Нет прав для приглашения (не владелец).
 *       404:
 *         description: Пользователь с таким email не найден.
 *       409:
 *         description: Этот пользователь уже в проекте.
 */
router.post(
    "/",
    hasRole(["owner"]),
    body("email").isEmail().withMessage("Please provide a valid email address"),
    body("role")
        .isIn(["editor", "viewer"])
        .withMessage("Role must be either 'editor' or 'viewer'"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const newPermission = await permissionService.inviteUser(
                req.params.projectId,
                req.body,
            );
            res.status(201).json(newPermission);
        } catch (error) {
            res.status(error.statusCode || 500).json({ error: error.message });
        }
    },
);

/**
 * @swagger
 * /api/projects/{projectId}/permissions/{userId}:
 *   patch:
 *     summary: Изменить роль участника проекта (только для владельца)
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [editor, viewer]
 *                 example: "viewer"
 *     responses:
 *       200:
 *         description: Роль участника успешно изменена.
 *       400:
 *         description: Некорректная роль или попытка изменить владельца.
 *       403:
 *         description: Нет прав для изменения роли.
 *       404:
 *         description: Участник проекта не найден.
 */
router.patch(
    "/:userId",
    hasRole(["owner"]),
    body("role")
        .isIn(["editor", "viewer"])
        .withMessage("Role must be either 'editor' or 'viewer'"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const updatedPermission = await permissionService.updateUserRole(
                req.params.projectId,
                req.params.userId,
                req.body.role,
            );
            res.json(updatedPermission);
        } catch (error) {
            res.status(error.statusCode || 500).json({ error: error.message });
        }
    },
);

/**
 * @swagger
 * /api/projects/{projectId}/permissions/{userId}:
 *   delete:
 *     summary: Удалить пользователя из проекта (только для владельца)
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Пользователь успешно удален из проекта.
 *       403:
 *         description: Нет прав для удаления (не владелец).
 */
router.delete("/:userId", hasRole(["owner"]), async (req, res) => {
    try {
        await permissionService.removeUser(
            req.params.projectId,
            req.params.userId,
        );
        res.status(200).json({
            message: "User removed from project successfully",
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

module.exports = router;
