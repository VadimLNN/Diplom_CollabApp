const permissionRepository = require("../repositories/permissionRepository");
const projectRepository = require("../repositories/projectRepository");

class AccessService {
    async getUserRoleInProject(userId, projectId) {
        const project = await projectRepository.findById(projectId);

        if (!project) return null;
        if (project.owner_id === userId) return "owner";

        const permission = await permissionRepository.findByProjectAndUser(
            projectId,
            userId,
        );
        return permission?.role || null;
    }

    assertRole(role, allowedRoles) {
        if (!role || !allowedRoles.includes(role)) {
            const error = new Error("Forbidden");
            error.statusCode = 403;
            throw error;
        }
    }
}

module.exports = new AccessService();
