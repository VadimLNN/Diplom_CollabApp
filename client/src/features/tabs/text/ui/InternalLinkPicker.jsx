const getTabTypeLabel = (type) => {
    switch (type) {
        case "text":
            return "Текст";
        case "board":
            return "Доска";
        default:
            return type || "Вкладка";
    }
};

const getTabTypeIcon = (type) => {
    switch (type) {
        case "text":
            return "T";
        case "board":
            return "B";
        default:
            return "↗";
    }
};

const InternalLinkPicker = ({
    currentTab,
    projectTabs = [],
    disabled = false,
    onSelect,
}) => {
    const availableTabs = projectTabs.filter(
        (projectTab) => String(projectTab.id) !== String(currentTab?.id),
    );

    const handleChange = (event) => {
        const targetTabId = event.target.value;

        if (!targetTabId) {
            return;
        }

        const targetTab = availableTabs.find(
            (projectTab) => String(projectTab.id) === String(targetTabId),
        );

        if (targetTab) {
            onSelect?.(targetTab);
        }

        event.target.value = "";
    };

    if (!availableTabs.length) {
        return null;
    }

    return (
        <div className="internal-link-picker">
            <span className="internal-link-picker__label">Ссылка</span>

            <div className="internal-link-picker__control">
                <select
                    className="internal-link-picker__select"
                    defaultValue=""
                    disabled={disabled}
                    onChange={handleChange}
                    aria-label="Вставить ссылку на вкладку"
                >
                    <option value="" disabled>
                        Вставить ссылку на вкладку...
                    </option>

                    {availableTabs.map((projectTab) => (
                        <option key={projectTab.id} value={projectTab.id}>
                            {getTabTypeIcon(projectTab.type)} {projectTab.title}{" "}
                            · {getTabTypeLabel(projectTab.type)}
                        </option>
                    ))}
                </select>

                <span className="internal-link-picker__chevron">▾</span>
            </div>
        </div>
    );
};

export default InternalLinkPicker;
