import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProjectMembers from "../features/projects/manage-members/ProjectMembers";
import ProjectSettings from "../features/projects/settings/ProjectSettings";
import CreateTabForm from "../features/tabs/create_tab/CreateTabForm";
import EditTabForm from "../features/tabs/edit_tab/EditTabForm";
import api from "../shared/api/axios";
import Modal from "../shared/ui/Modal/Modal";
import TabGrid from "../widgets/TabGrid/TabGrid";

import pageStyles from "./PageStyles.module.css";

const SORT_OPTIONS = [
    { value: "updated-desc", label: "Недавно обновленные" },
    { value: "created-desc", label: "Сначала новые" },
    { value: "created-asc", label: "Сначала старые" },
    { value: "title-asc", label: "По названию А–Я" },
    { value: "title-desc", label: "По названию Я–А" },
];

const TAB_SORT_STORAGE_KEY = "collab-app:tab-sort";
const DEFAULT_TAB_SORT = "updated-desc";
const VALID_TAB_SORTS = new Set(SORT_OPTIONS.map((option) => option.value));

const getInitialTabSort = () => {
    const savedSort = localStorage.getItem(TAB_SORT_STORAGE_KEY);
    return VALID_TAB_SORTS.has(savedSort) ? savedSort : DEFAULT_TAB_SORT;
};

const getRequestStatus = (error) => {
    if (!error.response) {
        return "networkError";
    }

    const status = error.response.status;

    if (status === 401) {
        return "unauthorized";
    }

    if (status === 403) {
        return "forbidden";
    }

    if (status === 404) {
        return "notFound";
    }

    if (status >= 500) {
        return "serverError";
    }

    return "error";
};

const projectStatusMessages = {
    unauthorized: "Не удалось подтвердить сессию. Обновите страницу.",
    forbidden: "Нет доступа к проекту.",
    notFound: "Проект не найден.",
    networkError: "Сервер временно недоступен. Попробуйте позже.",
    serverError: "Ошибка сервера при загрузке проекта.",
    error: "Не удалось загрузить данные проекта.",
};

const tabsStatusMessages = {
    unauthorized: "Не удалось подтвердить сессию. Обновите страницу.",
    forbidden: "Нет доступа к вкладкам проекта.",
    notFound: "Вкладки проекта не найдены.",
    networkError: "Сервер временно недоступен. Не удалось загрузить вкладки.",
    serverError: "Ошибка сервера при загрузке вкладок.",
    error: "Не удалось загрузить вкладки проекта.",
};

const ProjectDetailPage = () => {
    const { projectId } = useParams();
    const [activeTab, setActiveTab] = useState("tabs");

    const [project, setProject] = useState(null);
    const [tabs, setTabs] = useState([]);
    const [userRole, setUserRole] = useState(null);
    const [projectStatus, setProjectStatus] = useState("idle");
    const [tabsStatus, setTabsStatus] = useState("idle");
    const [isCreateTabModalOpen, setIsCreateTabModalOpen] = useState(false);
    const [editingTab, setEditingTab] = useState(null);
    const [sortBy, setSortBy] = useState(getInitialTabSort);
    const selectedSortLabel =
        SORT_OPTIONS.find((option) => option.value === sortBy)?.label ||
        SORT_OPTIONS[0].label;

    const sortedTabs = useMemo(() => {
        const nextTabs = [...tabs];

        nextTabs.sort((firstTab, secondTab) => {
            switch (sortBy) {
                case "created-asc":
                    return (
                        new Date(firstTab.created_at) -
                        new Date(secondTab.created_at)
                    );
                case "updated-desc":
                    return (
                        new Date(secondTab.updated_at) -
                        new Date(firstTab.updated_at)
                    );
                case "title-asc":
                    return firstTab.title.localeCompare(secondTab.title, "ru", {
                        sensitivity: "base",
                    });
                case "title-desc":
                    return secondTab.title.localeCompare(firstTab.title, "ru", {
                        sensitivity: "base",
                    });
                case "created-desc":
                default:
                    return (
                        new Date(secondTab.created_at) -
                        new Date(firstTab.created_at)
                    );
            }
        });

        return nextTabs;
    }, [sortBy, tabs]);

    const fetchData = useCallback(async () => {
        setProjectStatus("loading");
        setTabsStatus("idle");
        setProject(null);
        setTabs([]);
        setUserRole(null);

        try {
            const projectRes = await api.get(`/projects/${projectId}`);
            setProject(projectRes.data);
            setProjectStatus("loaded");
        } catch (err) {
            setProjectStatus(getRequestStatus(err));
            console.error(err);
            return;
        }

        try {
            setTabsStatus("loading");
            const tabsRes = await api.get(`/projects/${projectId}/tabs`);
            setTabs(
                tabsRes.data.map((tab) => ({
                    ...tab,
                    project_id: projectId,
                })),
            );
            setTabsStatus("loaded");
        } catch (err) {
            setTabsStatus(getRequestStatus(err));
            console.error(err);
        }

        try {
            const roleRes = await api.get(
                `/projects/${projectId}/permissions/my-role`,
            );
            setUserRole(roleRes.data.role);
        } catch {
            setUserRole("viewer");
        }
    }, [projectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        localStorage.setItem(TAB_SORT_STORAGE_KEY, sortBy);
    }, [sortBy]);

    const handleTabCreated = (newTab) => {
        setTabs((prev) => [newTab, ...prev]);
        setIsCreateTabModalOpen(false);
    };

    const handleDeleteTab = async (tabId) => {
        if (window.confirm("Удалить эту вкладку?")) {
            try {
                await api.delete(`/projects/${projectId}/tabs/${tabId}`);
                setTabs((prev) => prev.filter((tab) => tab.id !== tabId));
            } catch {
                alert("Не удалось удалить вкладку");
            }
        }
    };

    const handleTabUpdated = (updatedTab) => {
        setTabs((previousTabs) =>
            previousTabs.map((tab) =>
                tab.id === updatedTab.id
                    ? { ...updatedTab, project_id: projectId }
                    : tab,
            ),
        );
        setEditingTab(null);
    };

    if (projectStatus === "idle" || projectStatus === "loading")
        return <div className={pageStyles.pageContainer}>Загрузка...</div>;

    if (projectStatus !== "loaded" || !project)
        return (
            <div className={pageStyles.pageContainer}>
                <p className="field__error">
                    {projectStatusMessages[projectStatus] ||
                        projectStatusMessages.error}
                </p>
                <Link to="/projects" className="button button--secondary">
                    Вернуться к проектам
                </Link>
            </div>
        );

    return (
        <div className="page u-content-width">
            <nav className="breadcrumbs" aria-label="Навигационная цепочка">
                <Link to="/projects">Мои проекты</Link>
                <span>/</span>
                <span>{project.name}</span>
            </nav>

            <header className="page-header">
                <div className="page-header__content">
                    <h1>{project.name}</h1>
                    {project.description && (
                        <p className="page-header__description">
                            {project.description}
                        </p>
                    )}
                </div>
            </header>

            <div
                className="tabs-nav"
                role="tablist"
                aria-label="Разделы проекта"
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "tabs"}
                    className={`tabs-nav__tab ${activeTab === "tabs" ? "tabs-nav__tab--active" : ""}`}
                    onClick={() => setActiveTab("tabs")}
                >
                    <span aria-hidden="true">🖥️</span>
                    Вкладки
                    <span className="tabs-nav__count">
                        ({tabsStatus === "loaded" ? tabs.length : 0})
                    </span>
                </button>

                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "members"}
                    className={`tabs-nav__tab ${activeTab === "members" ? "tabs-nav__tab--active" : ""}`}
                    onClick={() => setActiveTab("members")}
                >
                    <span aria-hidden="true">👥</span>
                    Участники
                </button>

                {userRole === "owner" && (
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === "settings"}
                        className={`tabs-nav__tab ${activeTab === "settings" ? "tabs-nav__tab--active" : ""}`}
                        onClick={() => setActiveTab("settings")}
                    >
                        <span aria-hidden="true">⚙️</span>
                        Настройки
                    </button>
                )}
            </div>

            <div className="tabs-nav__panel">
                {activeTab === "tabs" && (
                    <>
                        <div className="page-header">
                            <div className="page-header__content">
                                <h3>Совместное рабочее пространство</h3>
                            </div>

                            <div className="tab-toolbar">
                                <DropdownMenu.Root>
                                    <DropdownMenu.Trigger asChild>
                                        <button
                                            type="button"
                                            className="tab-sort__trigger"
                                            aria-label={`Сортировка вкладок: ${selectedSortLabel}`}
                                        >
                                            <span
                                                className="tab-sort__icon"
                                                aria-hidden="true"
                                            >
                                                ↕
                                            </span>
                                            <span>{selectedSortLabel}</span>
                                            <span
                                                className="tab-sort__chevron"
                                                aria-hidden="true"
                                            >
                                                ▾
                                            </span>
                                        </button>
                                    </DropdownMenu.Trigger>

                                    <DropdownMenu.Portal>
                                        <DropdownMenu.Content
                                            className="tab-sort__menu"
                                            side="bottom"
                                            align="start"
                                            sideOffset={8}
                                            collisionPadding={12}
                                        >
                                            <DropdownMenu.Label className="tab-sort__menu-label">
                                                Сортировать вкладки
                                            </DropdownMenu.Label>
                                            <DropdownMenu.RadioGroup
                                                value={sortBy}
                                                onValueChange={setSortBy}
                                            >
                                                {SORT_OPTIONS.map((option) => (
                                                    <DropdownMenu.RadioItem
                                                        key={option.value}
                                                        value={option.value}
                                                        className="tab-sort__menu-item"
                                                    >
                                                        <DropdownMenu.ItemIndicator className="tab-sort__indicator">
                                                            ✓
                                                        </DropdownMenu.ItemIndicator>
                                                        <span>
                                                            {option.label}
                                                        </span>
                                                    </DropdownMenu.RadioItem>
                                                ))}
                                            </DropdownMenu.RadioGroup>
                                        </DropdownMenu.Content>
                                    </DropdownMenu.Portal>
                                </DropdownMenu.Root>

                                {(userRole === "owner" ||
                                    userRole === "editor") && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsCreateTabModalOpen(true)
                                        }
                                        className="button button--primary tab-toolbar__create"
                                    >
                                        <span aria-hidden="true">+</span>
                                        Новая вкладка
                                    </button>
                                )}
                            </div>
                        </div>

                        {tabsStatus === "loading" && (
                            <p>Загрузка вкладок...</p>
                        )}

                        {tabsStatus === "loaded" && (
                            <TabGrid
                                tabs={sortedTabs}
                                onCreateClick={() =>
                                    setIsCreateTabModalOpen(true)
                                }
                                userRole={userRole}
                                onDeleteTab={handleDeleteTab}
                                onEditTab={setEditingTab}
                            />
                        )}

                        {tabsStatus !== "idle" &&
                            tabsStatus !== "loading" &&
                            tabsStatus !== "loaded" && (
                                <p className="field__error">
                                    {tabsStatusMessages[tabsStatus] ||
                                        tabsStatusMessages.error}
                                </p>
                            )}
                    </>
                )}

                {activeTab === "members" && (
                    <ProjectMembers projectId={projectId} userRole={userRole} />
                )}
                {activeTab === "settings" && userRole === "owner" && (
                    <ProjectSettings project={project} />
                )}
            </div>

            <Modal
                isOpen={isCreateTabModalOpen}
                onClose={() => setIsCreateTabModalOpen(false)}
                title="Создать вкладку"
            >
                <CreateTabForm
                    projectId={projectId}
                    onSuccess={handleTabCreated}
                    isOpen={isCreateTabModalOpen}
                />
            </Modal>

            <Modal
                isOpen={Boolean(editingTab)}
                onClose={() => setEditingTab(null)}
                title="Изменить вкладку"
            >
                {editingTab && (
                    <EditTabForm
                        key={editingTab.id}
                        tab={editingTab}
                        onSuccess={handleTabUpdated}
                    />
                )}
            </Modal>
        </div>
    );
};

export default ProjectDetailPage;
