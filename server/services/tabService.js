const tabRepository = require("../repositories/tabRepository");
const accessService = require("./accessService");

class TabService {
    async getTabsForProject(projectId) {
        return tabRepository.findByProjectId(projectId);
    }

    async getTabByIdForUser(userId, projectId, tabId) {
        await accessService.assertProjectAccess(userId, projectId);

        const tab = await tabRepository.findById(tabId);

        if (!tab || String(tab.project_id) !== String(projectId)) {
            const error = new Error("Tab not found");
            error.statusCode = 404;
            throw error;
        }

        return tab;
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

    async updateTab(userId, tabId, tabData) {
        const tab = await tabRepository.findById(tabId);

        if (!tab) {
            const error = new Error("Tab not found");
            error.statusCode = 404;
            throw error;
        }

        await accessService.assertProjectRole(userId, tab.project_id, [
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

    async deleteTab(userId, tabId) {
        const tab = await tabRepository.findById(tabId);

        if (!tab) {
            const error = new Error("Tab not found");
            error.statusCode = 404;
            throw error;
        }

        await accessService.assertProjectRole(userId, tab.project_id, [
            "owner",
        ]);

        return tabRepository.delete(tabId);
    }
}

module.exports = new TabService();
