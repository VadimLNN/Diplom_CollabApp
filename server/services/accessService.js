const projectRepository = require("../repositories/projectRepository");
const permissionRepository = require("../repositories/permissionRepository");

class AccessService {
    async getUserRoleInProject(userId, projectId) {
        const project = await projectRepository.findById(projectId);

        if (!project) {
            const error = new Error("Project not found");
            error.statusCode = 404;
            throw error;
        }

        if (String(project.owner_id) === String(userId)) {
            return "owner";
        }

        const permission = await permissionRepository.findByProjectAndUser(
            projectId,
            userId,
        );

        return permission ? permission.role : null;
    }

    async assertProjectAccess(userId, projectId) {
        const role = await this.getUserRoleInProject(userId, projectId);

        if (!role) {
            const error = new Error("Forbidden: No access to this project.");
            error.statusCode = 403;
            throw error;
        }

        return role;
    }

    async assertProjectRole(userId, projectId, allowedRoles) {
        const role = await this.getUserRoleInProject(userId, projectId);

        if (!role || !allowedRoles.includes(role)) {
            const error = new Error("Forbidden: Insufficient permissions.");
            error.statusCode = 403;
            throw error;
        }

        return role;
    }
}

module.exports = new AccessService();
