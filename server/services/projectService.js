const projectRepository = require("../repositories/projectRepository");

class ProjectService {
    async createProject(userId, projectData) {
        if (!projectData.name) {
            throw new Error("Project name is required");
        }

        return projectRepository.create({
            ...projectData,
            ownerId: userId,
        });
    }

    async getProjectById(projectId) {
        return projectRepository.findById(projectId);
    }

    async getAllProjectsForUser(userId) {
        return projectRepository.findAllForUser(userId);
    }

    async updateProject(projectId, projectData) {
        if (
            projectData.name === undefined &&
            projectData.description === undefined
        ) {
            const error = new Error("Nothing to update");
            error.statusCode = 400;
            throw error;
        }

        return projectRepository.update(projectId, projectData);
    }

    async deleteProject(projectId) {
        return projectRepository.delete(projectId);
    }
}

module.exports = new ProjectService();
