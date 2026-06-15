import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import api from "../../../shared/api/axios";

const CreateTabForm = ({ projectId, onSuccess, isOpen }) => {
    const [title, setTitle] = useState("");
    const [tabType, setTabType] = useState("text");
    const titleInputRef = useRef(null);

    useEffect(() => {
        if (isOpen && titleInputRef.current) {
            setTimeout(() => {
                titleInputRef.current.focus();
            }, 100);
        }
        if (!isOpen) {
            setTitle("");
            setTabType("text");
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const normalizedTitle = title.trim();
        setTitle(normalizedTitle);

        if (!normalizedTitle) {
            toast.error("Укажите название вкладки");
            return;
        }

        try {
            const response = await api.post(`/projects/${projectId}/tabs`, {
                title: normalizedTitle,
                type: tabType,
            });
            toast.success(`Вкладка «${normalizedTitle}» создана!`);
            onSuccess(response.data);
        } catch (err) {
            const errorMessage =
                err.response?.data?.errors?.[0]?.msg ||
                err.response?.data?.error ||
                "Не удалось создать вкладку";
            toast.error(errorMessage);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form">
            <div className="field">
                <label className="field__label" htmlFor="tab-title">
                    Название вкладки
                </label>
                <input
                    id="tab-title"
                    ref={titleInputRef}
                    className="field__control"
                    type="text"
                    placeholder="Введите название вкладки"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => setTitle((value) => value.trim())}
                    required
                />
            </div>

            <div className="field">
                <label className="field__label" htmlFor="tab-type">
                    Тип вкладки
                </label>
                <select
                    id="tab-type"
                    value={tabType}
                    onChange={(e) => setTabType(e.target.value)}
                    className="field__control"
                    required
                >
                    <option value="text">Текстовый документ</option>
                    <option value="board">Доска для рисования</option>
                </select>
            </div>

            <div className="form__actions">
                <button
                    type="submit"
                    className="button button--primary"
                    disabled={!title.trim()}
                >
                    Создать вкладку
                </button>
            </div>
        </form>
    );
};

export default CreateTabForm;
