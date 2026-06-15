import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Link } from "react-router-dom";
import Card from "../../shared/ui/Card/Card";

const TabCard = ({ tab, isActive, onDelete, onEdit }) => {
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

    return (
        <Card
            className={`tab-card card--interactive ${isActive ? "is-active" : ""}`}
        >
            <div className="tab-card__head">
                <div className="tab-card__heading">
                    <span className="tab-card__icon" aria-hidden="true">
                        {getIcon(tab.type)}
                    </span>

                    <h3 className="tab-card__title">{tab.title}</h3>
                </div>

                <div className="tab-card__head-actions">
                    <span className="badge badge--neutral">
                        {getTypeLabel(tab.type)}
                    </span>

                    {(onEdit || onDelete) && (
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                                <button
                                    type="button"
                                    className="tab-card__menu-trigger"
                                    aria-label={`Открыть меню вкладки «${tab.title}»`}
                                >
                                    <span aria-hidden="true">•••</span>
                                </button>
                            </DropdownMenu.Trigger>

                            <DropdownMenu.Portal>
                                <DropdownMenu.Content
                                    className="tab-card__menu"
                                    side="bottom"
                                    align="end"
                                    sideOffset={6}
                                    collisionPadding={12}
                                >
                                    {onEdit && (
                                        <DropdownMenu.Item
                                            className="tab-card__menu-item"
                                            onSelect={() => onEdit(tab)}
                                        >
                                            Изменить название и описание
                                        </DropdownMenu.Item>
                                    )}
                                    {onEdit && onDelete && (
                                        <DropdownMenu.Separator className="tab-card__menu-separator" />
                                    )}
                                    {onDelete && (
                                        <DropdownMenu.Item
                                            className="tab-card__menu-item tab-card__menu-item--danger"
                                            onSelect={() => onDelete(tab.id)}
                                        >
                                            Удалить
                                        </DropdownMenu.Item>
                                    )}
                                </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                    )}
                </div>
            </div>

            <p className="tab-card__description">
                {tab.description || "Описание не указано."}
            </p>

            <div className="card__footer">
                <span className="tab-card__meta">
                    Обновлено:{" "}
                    {new Date(tab.updated_at).toLocaleDateString("ru-RU")}
                </span>

                <div className="tab-card__actions">
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
