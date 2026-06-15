const permissionRepository = require("../repositories/permissionRepository");
const userRepository = require("../repositories/userRepository");
const projectRepository = require("../repositories/projectRepository");

const accessService = require("./accessService");

class PermissionService {
    async getProjectMembers(projectId) {
        const members = await permissionRepository.findMembers(projectId);
        const owner = await projectRepository.findById(projectId);

        const ownerInfo = await userRepository.findById(owner.owner_id);
        const ownerAsMember = { ...ownerInfo, role: "owner" };

        const membersMap = new Map();
        [ownerAsMember, ...members].forEach((member) => {
            membersMap.set(member.id, member);
        });

        return Array.from(membersMap.values());
    }

    async getUserRole(userId, projectId) {
        return accessService.getUserRoleInProject(userId, projectId);
    }

    async inviteUser(projectId, { email, role }) {
        if (!email || !role || !["editor", "viewer"].includes(role)) {
            const error = new Error(
                "User email and a valid role ('editor' or 'viewer') are required",
            );
            error.statusCode = 400;
            throw error;
        }

        const userToInvite = await userRepository.findByEmail(email);
        if (!userToInvite) {
            const error = new Error("User with this email not found");
            error.statusCode = 404;
            throw error;
        }

        const project = await projectRepository.findById(projectId);
        if (project.owner_id === userToInvite.id) {
            const error = new Error("Cannot invite the project owner.");
            error.statusCode = 400;
            throw error;
        }

        try {
            return await permissionRepository.add(
                projectId,
                userToInvite.id,
                role,
            );
        } catch (error) {
            if (error.code === "23505") {
                const customError = new Error(
                    "This user already has access to the project.",
                );
                customError.statusCode = 409;
                throw customError;
            }
            throw error;
        }
    }

    async removeUser(projectId, userIdToRemove) {
        const project = await projectRepository.findById(projectId);
        if (String(project.owner_id) === String(userIdToRemove)) {
            const error = new Error("Project owner cannot be removed.");
            error.statusCode = 400;
            throw error;
        }
        return permissionRepository.remove(projectId, userIdToRemove);
    }
}

module.exports = new PermissionService();
