import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../../shared/api/axios.js";
import Card from "../../../shared/ui/Card/Card.jsx";
import Modal from "../../../shared/ui/Modal/Modal.jsx";

const roleLabels = {
    owner: "Владелец",
    editor: "Редактор",
    viewer: "Наблюдатель",
};

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
            toast.error(
                err.response?.data?.error || "Не удалось загрузить участников",
            );
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
            toast.error("Введите email пользователя");
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

            toast.success(`Приглашение отправлено на ${inviteEmail}`);
            setInviteEmail("");
            setSelectedRole("editor");
            setIsInviteModalOpen(false);
            fetchMembers();
        } catch (err) {
            toast.error(
                err.response?.data?.error ||
                    "Не удалось пригласить пользователя",
            );
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemove = async (userId, username) => {
        toast(
            (t) => (
                <div className="toast-confirm">
                    <p className="toast-confirm__text">
                        Удалить <strong>{username}</strong> из проекта?
                    </p>

                    <div className="toast-confirm__actions">
                        <button
                            type="button"
                            className="button button--ghost"
                            onClick={() => toast.dismiss(t.id)}
                        >
                            Отмена
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
                                        loading: "Удаление участника...",
                                        success: () => {
                                            fetchMembers();
                                            return "Участник удален";
                                        },
                                        error: (err) =>
                                            err.response?.data?.error ||
                                            "Не удалось удалить участника",
                                    },
                                );
                            }}
                        >
                            Удалить
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
                <p className="u-text-muted">Загрузка участников...</p>
            </Card>
        );
    }

    return (
        <div className="stack">
            {userRole === "owner" && (
                <Card>
                    <div className="card__head">
                        <h3>Пригласить участника</h3>
                        <p className="card__subtitle">
                            Добавьте участника по email и предоставьте ему
                            доступ к проекту.
                        </p>
                    </div>

                    <form onSubmit={handleOpenInviteModal} className="form">
                        <div className="field">
                            <label
                                className="field__label"
                                htmlFor="invite-email"
                            >
                                Email пользователя
                            </label>

                            <input
                                id="invite-email"
                                type="email"
                                value={inviteEmail}
                                onChange={(event) =>
                                    setInviteEmail(event.target.value)
                                }
                                placeholder="Введите email пользователя"
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
                                Продолжить
                            </button>
                        </div>
                    </form>
                </Card>
            )}

            <Card>
                <div className="card__head">
                    <h3>Участники проекта</h3>
                    <p className="card__subtitle">
                        Участников в проекте: {members.length}.
                    </p>
                </div>

                {members.length === 0 ? (
                    <p className="u-text-muted">Участников пока нет.</p>
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
                                        {roleLabels[member.role] || member.role}
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
                                                Удалить
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
                title="Пригласить участника"
                description={`Выберите роль для ${inviteEmail}`}
            >
                <form onSubmit={handleInvite} className="form">
                    <div className="field">
                        <label className="field__label" htmlFor="invite-role">
                            Роль
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
                                Наблюдатель — может просматривать содержимое
                                проекта
                            </option>
                            <option value="editor">
                                Редактор — может изменять содержимое проекта
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
                                <span className="u-text-muted">Роль</span>
                                <strong>
                                    {roleLabels[selectedRole] || selectedRole}
                                </strong>
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
                            Отмена
                        </button>

                        <button
                            type="submit"
                            className={`button button--primary ${isInviting ? "is-loading" : ""}`}
                            disabled={isInviting}
                        >
                            <span className="button__label">
                                {isInviting
                                    ? "Отправка..."
                                    : "Отправить приглашение"}
                            </span>
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ProjectMembers;
