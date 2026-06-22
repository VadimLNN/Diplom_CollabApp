const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const tabService = require("../services/tabService");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const { updateTabValidator } = require("../validators/tabValidators");

router.use(authMiddleware);

router.get(
    "/projects/:projectId/tabs/:tabId",
    asyncHandler(async (req, res) => {
        const tab = await tabService.getTabByIdForUser(
            req.user.id,
            req.params.projectId,
            req.params.tabId,
        );

        res.json(tab);
    }),
);

router.put(
    "/projects/:projectId/tabs/:tabId",
    ...updateTabValidator,
    validate,
    asyncHandler(async (req, res) => {
        const updatedTab = await tabService.updateTab(
            req.user.id,
            req.params.projectId,
            req.params.tabId,
            req.body,
        );

        res.json(updatedTab);
    }),
);

router.delete(
    "/projects/:projectId/tabs/:tabId",
    asyncHandler(async (req, res) => {
        await tabService.deleteTab(
            req.user.id,
            req.params.projectId,
            req.params.tabId,
        );

        res.json({ message: "Tab deleted successfully" });
    }),
);

module.exports = router;
