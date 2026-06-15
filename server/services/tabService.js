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
        if (!tabData.title) {
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
            tabData.title !== undefined ? tabData.title : tab.title;
        const newType = tabData.type !== undefined ? tabData.type : tab.type;

        if (!["text", "board"].includes(newType)) {
            const error = new Error("Invalid tab type. Must be: text or board");
            error.statusCode = 400;
            throw error;
        }

        return tabRepository.update(tabId, {
            title: newTitle,
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
