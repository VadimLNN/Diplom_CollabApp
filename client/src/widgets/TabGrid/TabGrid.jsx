import TabCard from "../../entities/tab/TabCard";
import EmptyState from "../../shared/ui/EmptyState/EmptyState";

const TabGrid = ({
    tabs,
    userRole,
    onDeleteTab,
    onEditTab,
    onCreateClick,
}) => {
    if (!tabs || tabs.length === 0) {
        return (
            <EmptyState
                icon="🖥️"
                title="В проекте пока нет вкладок"
                message="Создайте вкладку, чтобы начать совместную работу в реальном времени."
            >
                {(userRole === "owner" || userRole === "editor") && (
                    <button
                        type="button"
                        onClick={onCreateClick}
                        className="button button--primary"
                    >
                        + Создать вкладку
                    </button>
                )}
            </EmptyState>
        );
    }

    return (
        <div className="tab-grid">
            {tabs.map((tab) => (
                <TabCard
                    key={tab.id}
                    tab={tab}
                    onEdit={
                        userRole === "owner" || userRole === "editor"
                            ? onEditTab
                            : null
                    }
                    onDelete={
                        userRole === "owner" ? onDeleteTab : null
                    }
                />
            ))}
        </div>
    );
};

export default TabGrid;
