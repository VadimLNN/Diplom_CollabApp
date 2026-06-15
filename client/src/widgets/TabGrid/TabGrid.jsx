import TabCard from "../../entities/tab/TabCard";
import EmptyState from "../../shared/ui/EmptyState/EmptyState";

const TabGrid = ({
    tabs,
    userRole,
    onDeleteTab,
    onCreateClick,
}) => {
    if (!tabs || tabs.length === 0) {
        return (
            <EmptyState
                icon="🖥️"
                title="No Tabs in This Project"
                message="Collaborative tabs let you work together in real-time. Create one to get started!"
            >
                {(userRole === "owner" || userRole === "editor") && (
                    <button
                        type="button"
                        onClick={onCreateClick}
                        className="button button--primary"
                    >
                        + Create a New Tab
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
                    onDelete={
                        userRole === "owner" ? () => onDeleteTab(tab.id) : null
                    }
                />
            ))}
        </div>
    );
};

export default TabGrid;
