import { Link } from "react-router-dom";
import Card from "../../shared/ui/Card/Card";

const TabCard = ({ tab, isActive, onDelete }) => {
    const getTypeLabel = (type) => {
        const labels = {
            text: "Текст",
            board: "Доска",
        };
        return labels[type] || type;
    };

    const getIcon = (type) => {
        const icons = {
            text: "📄",
            board: "🎨",
        };
        return icons[type] || "📋";
    };

    const handleDeleteTab = (event) => {
        event.preventDefault();
        event.stopPropagation();
        onDelete?.(tab.id);
    };

    return (
        <Card
            className={`tab-card card--interactive ${isActive ? "is-active" : ""}`}
        >
            <div className="tab-card__head">
                <span className="tab-card__icon" aria-hidden="true">
                    {getIcon(tab.type)}
                </span>

                <div>
                    <h3 className="tab-card__title">{tab.title}</h3>
                    <span className="badge badge--neutral">
                        {getTypeLabel(tab.type)}
                    </span>
                </div>
            </div>

            <p className="tab-card__description">
                {tab.type === "text"
                    ? "Совместный текстовый редактор"
                    : tab.type === "board"
                      ? "Доска для рисования"
                      : tab.type === "code"}
            </p>

            <div className="card__footer">
                <span className="tab-card__meta">
                    Обновлено:{" "}
                    {new Date(tab.created_at).toLocaleDateString("ru-RU")}
                </span>

                <div className="tab-card__actions">
                    {onDelete && (
                        <button
                            type="button"
                            onClick={handleDeleteTab}
                            className="button button--ghost"
                        >
                            Удалить
                        </button>
                    )}

                    <Link
                        to={`/projects/${tab.project_id}/tabs/${tab.id}`}
                        className="button button--secondary"
                    >
                        {isActive ? "Редактирование..." : "Открыть"}
                    </Link>
                </div>
            </div>
        </Card>
    );
};

export default TabCard;
