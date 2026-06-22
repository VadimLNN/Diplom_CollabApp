const tabRepository = require("../repositories/tabRepository");
const accessService = require("./accessService");

const createTabError = (statusCode, code, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
};

class TabService {
    async getTabsForProject(projectId) {
        return tabRepository.findByProjectId(projectId);
    }

    async getTabByIdForUser(userId, projectId, tabId) {
        const tab = await tabRepository.findById(tabId);

        if (!tab || String(tab.project_id) !== String(projectId)) {
            throw createTabError(404, "TAB_NOT_FOUND", "Tab not found");
        }

        await this.assertTabAccess(userId, tab.project_id);

        return tab;
    }

    async assertTabAccess(userId, projectId) {
        try {
            return await accessService.assertProjectAccess(userId, projectId);
        } catch (error) {
            if (error.statusCode === 403) {
                throw createTabError(
                    403,
                    "TAB_FORBIDDEN",
                    "Forbidden: No access to this tab.",
                );
            }

            throw error;
        }
    }

    async assertTabRole(userId, projectId, allowedRoles) {
        try {
            return await accessService.assertProjectRole(
                userId,
                projectId,
                allowedRoles,
            );
        } catch (error) {
            if (error.statusCode === 403) {
                throw createTabError(
                    403,
                    "TAB_FORBIDDEN",
                    "Forbidden: Insufficient permissions for this tab.",
                );
            }

            throw error;
        }
    }

    async createTab(userId, projectId, tabData) {
        const title = tabData.title?.trim();
        const description = tabData.description?.trim() || null;

        if (!title) {
            const error = new Error("Title is required");
            error.statusCode = 400;
            throw error;
        }

        if (!["text", "board"].includes(tabData.type)) {
            const error = new Error("Invalid tab type. Must be: text or board");
            error.statusCode = 400;
            throw error;
        }

        await accessService.assertProjectRole(userId, projectId, [
            "owner",
            "editor",
        ]);

        return tabRepository.create({
            ...tabData,
            title,
            description,
            projectId,
        });
    }

    async updateTab(userId, projectId, tabId, tabData) {
        const tab = await tabRepository.findById(tabId);

        if (!tab || String(tab.project_id) !== String(projectId)) {
            throw createTabError(404, "TAB_NOT_FOUND", "Tab not found");
        }

        await this.assertTabRole(userId, tab.project_id, [
            "owner",
            "editor",
        ]);

        const newTitle =
            tabData.title !== undefined ? tabData.title.trim() : tab.title;
        const newDescription =
            tabData.description !== undefined
                ? tabData.description?.trim() || null
                : tab.description;
        const newType = tabData.type !== undefined ? tabData.type : tab.type;

        if (!newTitle || newTitle.length > 100) {
            const error = new Error("Title must be between 1 and 100 characters");
            error.statusCode = 400;
            throw error;
        }

        if (newDescription && newDescription.length > 500) {
            const error = new Error(
                "Description cannot be more than 500 characters",
            );
            error.statusCode = 400;
            throw error;
        }

        if (!["text", "board"].includes(newType)) {
            const error = new Error("Invalid tab type. Must be: text or board");
            error.statusCode = 400;
            throw error;
        }

        return tabRepository.update(tabId, {
            title: newTitle,
            description: newDescription,
            type: newType,
        });
    }

    async deleteTab(userId, projectId, tabId) {
        const tab = await tabRepository.findById(tabId);

        if (!tab || String(tab.project_id) !== String(projectId)) {
            throw createTabError(404, "TAB_NOT_FOUND", "Tab not found");
        }

        await this.assertTabRole(userId, tab.project_id, ["owner"]);

        return tabRepository.delete(tabId);
    }
}

module.exports = new TabService();
