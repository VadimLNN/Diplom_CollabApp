import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "../../../shared/api/axios";
import Card from "../../../shared/ui/Card/Card";

const ProjectSettings = ({ project }) => {
    const [name, setName] = useState(project.name);
    const [description, setDescription] = useState(project.description);
    const navigate = useNavigate();

    const handleUpdate = async (e) => {
        e.preventDefault();
        await toast.promise(
            api.put(`/projects/${project.id}`, { name, description }),
            {
                loading: "Сохранение изменений...",
                success: <b>Проект успешно обновлен!</b>,
                error: (err) => (
                    <b>
                        {err.response?.data?.error ||
                            "Не удалось обновить проект."}
                    </b>
                ),
            },
        );
    };

    const handleDelete = async () => {
        toast(
            (t) => (
                <div className="toast-container">
                    <span>
                        Удалить проект <b>«{project.name}»</b>?
                    </span>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button
                            className="toast-button toast-button-cancel"
                            onClick={() => toast.dismiss(t.id)}
                        >
                            Отмена
                        </button>
                        <button
                            className="toast-button toast-button-confirm"
                            onClick={() => {
                                toast.dismiss(t.id);
                                toast.promise(
                                    api.delete(`/projects/${project.id}`),
                                    {
                                        loading: "Удаление проекта...",
                                        success: () => {
                                            navigate("/projects");
                                            return (
                                                <b>Проект удален.</b>
                                            );
                                        },
                                        error: (err) => (
                                            <b>
                                                {err.response?.data?.error ||
                                                    "Не удалось удалить проект."}
                                            </b>
                                        ),
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
                duration: 10000,
                icon: "⚠️",
            },
        );
    };

    return (
        <div className="stack">
            <Card>
                <div className="card__head">
                    <h3>Основные настройки</h3>
                </div>

                <form onSubmit={handleUpdate} className="form">
                    <div className="field">
                        <label
                            className="field__label"
                            htmlFor="project-settings-name"
                        >
                            Название проекта
                        </label>
                        <input
                            id="project-settings-name"
                            className="field__control"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="field field--textarea">
                        <label
                            className="field__label"
                            htmlFor="project-settings-description"
                        >
                            Описание
                        </label>
                        <textarea
                            id="project-settings-description"
                            className="field__control"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows="4"
                        />
                    </div>

                    <div className="form__actions">
                        <button
                            type="submit"
                            className="button button--primary"
                        >
                            Сохранить изменения
                        </button>
                    </div>
                </form>
            </Card>

            <Card className="card--danger">
                <div className="card__head">
                    <h3>Опасная зона</h3>
                    <p className="card__subtitle">
                        При удалении проекта все его документы и участники
                        будут удалены безвозвратно.
                    </p>
                </div>

                <div className="card__footer">
                    <span className="u-text-muted">
                        Это действие нельзя отменить.
                    </span>

                    <button
                        type="button"
                        onClick={handleDelete}
                        className="button button--danger"
                    >
                        Удалить проект
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default ProjectSettings;
