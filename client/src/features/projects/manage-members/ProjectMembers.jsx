import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../../shared/api/axios.js";
import Card from "../../../shared/ui/Card/Card.jsx";
import Modal from "../../../shared/ui/Modal/Modal.jsx";

const ProjectMembers = ({ projectId, userRole }) => {
    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState("");
    const [isInviting, setIsInviting] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState("editor");

    const fetchMembers = useCallback(async () => {
        try {
            setIsLoading(true);

            const response = await api.get(
                `/projects/${projectId}/permissions`,
            );
            setMembers(response.data);
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to load members");
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const handleOpenInviteModal = (event) => {
        event.preventDefault();

        if (!inviteEmail.trim()) {
            toast.error("Enter user email");
            return;
        }

        setSelectedRole("editor");
        setIsInviteModalOpen(true);
    };

    const handleInvite = async (event) => {
        event.preventDefault();

        if (!inviteEmail.trim()) return;

        try {
            setIsInviting(true);

            await api.post(`/projects/${projectId}/permissions`, {
                email: inviteEmail.trim(),
                role: selectedRole,
            });

            toast.success(`Invitation sent to ${inviteEmail}`);
            setInviteEmail("");
            setSelectedRole("editor");
            setIsInviteModalOpen(false);
            fetchMembers();
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to invite user");
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemove = async (userId, username) => {
        toast(
            (t) => (
                <div className="toast-confirm">
                    <p className="toast-confirm__text">
                        Remove <strong>{username}</strong> from project?
                    </p>

                    <div className="toast-confirm__actions">
                        <button
                            type="button"
                            className="button button--ghost"
                            onClick={() => toast.dismiss(t.id)}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="button button--danger"
                            onClick={() => {
                                toast.dismiss(t.id);

                                toast.promise(
                                    api.delete(
                                        `/projects/${projectId}/permissions/${userId}`,
                                    ),
                                    {
                                        loading: "Removing member...",
                                        success: () => {
                                            fetchMembers();
                                            return "Member removed";
                                        },
                                        error: (err) =>
                                            err.response?.data?.error ||
                                            "Failed to remove member",
                                    },
                                );
                            }}
                        >
                            Remove
                        </button>
                    </div>
                </div>
            ),
            {
                duration: 8000,
                icon: "⚠️",
            },
        );
    };

    if (isLoading) {
        return (
            <Card>
                <p className="u-text-muted">Loading members...</p>
            </Card>
        );
    }

    return (
        <div className="stack">
            {userRole === "owner" && (
                <Card>
                    <div className="card__head">
                        <h3>Invite a new member</h3>
                        <p className="card__subtitle">
                            Add teammates by email and give them access to this
                            workspace.
                        </p>
                    </div>

                    <form onSubmit={handleOpenInviteModal} className="form">
                        <div className="field">
                            <label
                                className="field__label"
                                htmlFor="invite-email"
                            >
                                User email
                            </label>

                            <input
                                id="invite-email"
                                type="email"
                                value={inviteEmail}
                                onChange={(event) =>
                                    setInviteEmail(event.target.value)
                                }
                                placeholder="Enter user email"
                                className="field__control"
                                disabled={isInviting}
                                required
                            />
                        </div>

                        <div className="form__actions">
                            <button
                                type="submit"
                                className="button button--primary"
                                disabled={isInviting || !inviteEmail.trim()}
                            >
                                Continue
                            </button>
                        </div>
                    </form>
                </Card>
            )}

            <Card>
                <div className="card__head">
                    <h3>Team Members</h3>
                    <p className="card__subtitle">
                        {members.length}{" "}
                        {members.length === 1 ? "member" : "members"} in this
                        project.
                    </p>
                </div>

                {members.length === 0 ? (
                    <p className="u-text-muted">No members yet.</p>
                ) : (
                    <ul className="member-list">
                        {members.map((member) => (
                            <li key={member.id} className="member-list__item">
                                <div className="member-list__main">
                                    <strong>{member.username}</strong>
                                    <span className="member-list__meta">
                                        {member.email}
                                    </span>
                                </div>

                                <div className="member-list__actions">
                                    <span
                                        className={`badge ${
                                            member.role === "owner"
                                                ? "badge--accent"
                                                : "badge--neutral"
                                        }`}
                                    >
                                        {member.role}
                                    </span>

                                    {userRole === "owner" &&
                                        member.role !== "owner" && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleRemove(
                                                        member.id,
                                                        member.username,
                                                    )
                                                }
                                                className="button button--ghost"
                                            >
                                                Remove
                                            </button>
                                        )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
            <Modal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                title="Invite member"
                description={`Choose a role for ${inviteEmail}`}
            >
                <form onSubmit={handleInvite} className="form">
                    <div className="field">
                        <label className="field__label" htmlFor="invite-role">
                            Role
                        </label>

                        <select
                            id="invite-role"
                            className="field__control"
                            value={selectedRole}
                            onChange={(event) =>
                                setSelectedRole(event.target.value)
                            }
                            disabled={isInviting}
                        >
                            <option value="viewer">
                                Viewer — can view project content
                            </option>
                            <option value="editor">
                                Editor — can edit project content
                            </option>
                        </select>
                    </div>

                    <div className="card card--panel">
                        <div className="invite-preview">
                            <div>
                                <span className="u-text-muted">Email</span>
                                <strong>{inviteEmail}</strong>
                            </div>

                            <div>
                                <span className="u-text-muted">Role</span>
                                <strong>{selectedRole}</strong>
                            </div>
                        </div>
                    </div>

                    <div className="form__actions form__actions--end">
                        <button
                            type="button"
                            className="button button--ghost"
                            onClick={() => setIsInviteModalOpen(false)}
                            disabled={isInviting}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className={`button button--primary ${isInviting ? "is-loading" : ""}`}
                            disabled={isInviting}
                        >
                            <span className="button__label">
                                {isInviting ? "Inviting..." : "Send invite"}
                            </span>
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ProjectMembers;
