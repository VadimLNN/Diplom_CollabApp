import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import api from "../../../shared/api/axios";

const EditTabForm = ({ tab, onSuccess }) => {
    const [title, setTitle] = useState(tab.title);
    const [description, setDescription] = useState(tab.description || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const titleInputRef = useRef(null);

    useEffect(() => {
        titleInputRef.current?.focus();
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();

        const normalizedTitle = title.trim();
        if (!normalizedTitle) {
            toast.error("Укажите название вкладки");
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await api.put(
                `/projects/${tab.project_id}/tabs/${tab.id}`,
                {
                    title: normalizedTitle,
                    description: description.trim(),
                },
            );
            toast.success("Вкладка обновлена");
            onSuccess(response.data);
        } catch (error) {
            const errorMessage =
                error.response?.data?.errors?.[0]?.msg ||
                error.response?.data?.error ||
                "Не удалось обновить вкладку";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form">
            <div className="field">
                <label className="field__label" htmlFor={`tab-title-${tab.id}`}>
                    Название вкладки
                </label>
                <input
                    id={`tab-title-${tab.id}`}
                    ref={titleInputRef}
                    className="field__control"
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={100}
                    required
                />
            </div>

            <div className="field field--textarea">
                <label
                    className="field__label"
                    htmlFor={`tab-description-${tab.id}`}
                >
                    Описание
                </label>
                <textarea
                    id={`tab-description-${tab.id}`}
                    className="field__control"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    maxLength={500}
                    rows="4"
                    placeholder="Кратко опишите назначение вкладки"
                />
            </div>

            <div className="form__actions">
                <button
                    type="submit"
                    className="button button--primary"
                    disabled={isSubmitting || !title.trim()}
                >
                    {isSubmitting ? "Сохранение..." : "Сохранить"}
                </button>
            </div>
        </form>
    );
};

export default EditTabForm;
