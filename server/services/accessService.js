const projectRepository = require("../repositories/projectRepository");
const permissionRepository = require("../repositories/permissionRepository");

const createAccessError = (statusCode, code, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
};

class AccessService {
    async getUserRoleInProject(userId, projectId) {
        const project = await projectRepository.findById(projectId);

        if (!project) {
            throw createAccessError(
                404,
                "PROJECT_NOT_FOUND",
                "Project not found",
            );
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
            throw createAccessError(
                403,
                "PROJECT_FORBIDDEN",
                "Forbidden: No access to this project.",
            );
        }

        return role;
    }

    async assertProjectRole(userId, projectId, allowedRoles) {
        const role = await this.getUserRoleInProject(userId, projectId);

        if (!role || !allowedRoles.includes(role)) {
            throw createAccessError(
                403,
                "PROJECT_FORBIDDEN",
                "Forbidden: Insufficient permissions.",
            );
        }

        return role;
    }
}

module.exports = new AccessService();
