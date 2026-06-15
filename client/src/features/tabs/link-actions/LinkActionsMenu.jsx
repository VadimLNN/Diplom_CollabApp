import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

const getTabTypeLabel = (type) => {
    switch (type) {
        case "text":
            return "Текст";
        case "board":
            return "Доска";
        default:
            return "Вкладка";
    }
};

const LinkActionsMenu = ({
    actions = [],
    currentTab,
    projectTabs = [],
    onSelectTab,
    tabActionLabel = "Вставить ссылку на вкладку",
}) => {
    const availableTabs = projectTabs.filter(
        (projectTab) => String(projectTab.id) !== String(currentTab?.id),
    );

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    type="button"
                    className="button button--secondary link-actions-menu__trigger"
                    aria-label="Открыть меню ссылок"
                >
                    <span aria-hidden="true">↗</span>
                    Ссылки
                    <span
                        className="link-actions-menu__chevron"
                        aria-hidden="true"
                    >
                        ▾
                    </span>
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="link-actions-menu__content"
                    side="bottom"
                    align="end"
                    sideOffset={8}
                    collisionPadding={12}
                >
                    {availableTabs.length > 0 && onSelectTab && (
                        <>
                            <DropdownMenu.Sub>
                                <DropdownMenu.SubTrigger className="link-actions-menu__item">
                                    <span>{tabActionLabel}</span>
                                    <span aria-hidden="true">›</span>
                                </DropdownMenu.SubTrigger>

                                <DropdownMenu.Portal>
                                    <DropdownMenu.SubContent
                                        className="link-actions-menu__content link-actions-menu__content--tabs"
                                        sideOffset={6}
                                        collisionPadding={12}
                                    >
                                        {availableTabs.map((projectTab) => (
                                            <DropdownMenu.Item
                                                key={projectTab.id}
                                                className="link-actions-menu__item link-actions-menu__tab"
                                                onSelect={() =>
                                                    onSelectTab(projectTab)
                                                }
                                            >
                                                <span className="link-actions-menu__tab-title">
                                                    {projectTab.title}
                                                </span>
                                                <span className="link-actions-menu__meta">
                                                    {getTabTypeLabel(
                                                        projectTab.type,
                                                    )}
                                                </span>
                                            </DropdownMenu.Item>
                                        ))}
                                    </DropdownMenu.SubContent>
                                </DropdownMenu.Portal>
                            </DropdownMenu.Sub>

                            {actions.length > 0 && (
                                <DropdownMenu.Separator className="link-actions-menu__separator" />
                            )}
                        </>
                    )}

                    {actions.map((action) => (
                        <DropdownMenu.Item
                            key={action.id}
                            className="link-actions-menu__item"
                            disabled={action.disabled}
                            onSelect={action.onSelect}
                        >
                            <span>{action.label}</span>
                            {action.hint && (
                                <span className="link-actions-menu__meta">
                                    {action.hint}
                                </span>
                            )}
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
};

export default LinkActionsMenu;
