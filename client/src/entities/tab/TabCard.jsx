import { Link } from "react-router-dom";
import Card from "../../shared/ui/Card/Card";

const TabCard = ({ tab, isActive, onDelete }) => {
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
                    <span className="badge badge--neutral">{tab.type}</span>
                </div>
            </div>

            <p className="tab-card__description">
                {tab.type === "text"
                    ? "Collaborative text editor"
                    : tab.type === "board"
                      ? "Drawing canvas"
                      : tab.type === "code"}
            </p>

            <div className="card__footer">
                <span className="tab-card__meta">
                    Updated: {new Date(tab.created_at).toLocaleDateString()}
                </span>

                <div className="tab-card__actions">
                    {onDelete && (
                        <button
                            type="button"
                            onClick={handleDeleteTab}
                            className="button button--ghost"
                        >
                            Delete
                        </button>
                    )}

                    <Link
                        to={`/projects/${tab.project_id}/tabs/${tab.id}`}
                        className="button button--secondary"
                    >
                        {isActive ? "Editing..." : "Open"}
                    </Link>
                </div>
            </div>
        </Card>
    );
};

export default TabCard;
