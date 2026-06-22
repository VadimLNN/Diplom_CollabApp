import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../shared/api/axios";

import EditorRenderer from "../features/tabs/EditorRenderer";

const roleLabels = {
    owner: "Владелец",
    editor: "Редактор",
    viewer: "Наблюдатель",
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
    networkError: "Сервер временно недоступен, попробуйте позже.",
    serverError: "Ошибка сервера при загрузке проекта.",
    error: "Не удалось загрузить проект.",
};

const tabStatusMessages = {
    unauthorized: "Не удалось подтвердить сессию. Обновите страницу.",
    forbidden: "Нет доступа к вкладке или проекту.",
    notFound: "Вкладка не найдена.",
    networkError: "Сервер временно недоступен, попробуйте позже.",
    serverError: "Ошибка сервера при загрузке документа.",
    error: "Не удалось загрузить документ.",
};

const DocumentEditorPage = () => {
    const { projectId, tabId } = useParams();

    const [tab, setTab] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [projectTabs, setProjectTabs] = useState([]);

    const [projectStatus, setProjectStatus] = useState("idle");
    const [tabStatus, setTabStatus] = useState("idle");
    const [tabsStatus, setTabsStatus] = useState("idle");

    useEffect(() => {
        const fetchEditorData = async () => {
            setProjectStatus("loading");
            setTabStatus("idle");
            setTabsStatus("idle");
            setTab(null);
            setUserRole(null);
            setProjectTabs([]);

            try {
                await api.get(`/projects/${projectId}`);
                setProjectStatus("loaded");
            } catch (err) {
                setProjectStatus(getRequestStatus(err));
                console.error(err);
                return;
            }

            try {
                setTabStatus("loading");
                const tabResponse = await api.get(
                    `/projects/${projectId}/tabs/${tabId}`,
                );
                setTab(tabResponse.data);
                setTabStatus("loaded");
            } catch (err) {
                setTabStatus(getRequestStatus(err));
                console.error(err);
                return;
            }

            try {
                const roleResponse = await api.get(
                    `/projects/${projectId}/permissions/my-role`,
                );
                setUserRole(roleResponse.data.role);
            } catch (err) {
                setTabStatus(getRequestStatus(err));
                console.error(err);
                return;
            }

            try {
                setTabsStatus("loading");
                const tabsResponse = await api.get(
                    `/projects/${projectId}/tabs`,
                );
                setProjectTabs(tabsResponse.data);
                setTabsStatus("loaded");
            } catch (err) {
                setProjectTabs([]);
                setTabsStatus(getRequestStatus(err));
                console.error(err);
            }
        };

        if (tabId && projectId) {
            fetchEditorData();
        }
    }, [tabId, projectId]);

    if (projectStatus === "idle" || projectStatus === "loading") {
        return (
            <div className="page page--editor u-content-width">
                🔄 Загрузка редактора...
            </div>
        );
    }

    if (projectStatus !== "loaded") {
        return (
            <div className="page page--editor u-content-width">
                <p className="field__error">
                    {projectStatusMessages[projectStatus] ||
                        projectStatusMessages.error}
                </p>

                <Link to="/projects" className="button button--secondary">
                    ← Вернуться к проектам
                </Link>
            </div>
        );
    }

    if (tabStatus === "idle" || tabStatus === "loading") {
        return (
            <div className="page page--editor u-content-width">
                🔄 Загрузка редактора...
            </div>
        );
    }

    if (tabStatus !== "loaded" || !tab) {
        return (
            <div className="page page--editor u-content-width">
                <p className="field__error">
                    {tabStatusMessages[tabStatus] || tabStatusMessages.error}
                </p>

                <Link
                    to={`/projects/${projectId}`}
                    className="button button--secondary"
                >
                    ← Вернуться к проекту
                </Link>
            </div>
        );
    }

    return (
        <div className="page page--editor u-content-width">
            <nav className="breadcrumbs" aria-label="Навигационная цепочка">
                <Link to={`/projects/${projectId}`}>
                    ← {tab.project_name || "Проект"}
                </Link>
            </nav>

            <header className="page-header">
                <div className="page-header__content">
                    <h1>{tab.title}</h1>

                    {userRole && (
                        <span className="status-chip">
                            Роль: {roleLabels[userRole] || userRole}
                        </span>
                    )}
                </div>
            </header>

            {tabsStatus !== "idle" &&
                tabsStatus !== "loading" &&
                tabsStatus !== "loaded" && (
                    <p className="field__error">
                        Не удалось загрузить список вкладок для быстрых ссылок.
                    </p>
                )}

            <EditorRenderer
                tab={tab}
                userRole={userRole}
                projectTabs={projectTabs}
            />
        </div>
    );
};

export default DocumentEditorPage;
