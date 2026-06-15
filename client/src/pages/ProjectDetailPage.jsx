import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProjectMembers from "../features/projects/manage-members/ProjectMembers";
import ProjectSettings from "../features/projects/settings/ProjectSettings";
import CreateTabForm from "../features/tabs/create_tab/CreateTabForm";
import api from "../shared/api/axios";
import Modal from "../shared/ui/Modal/Modal";
import TabGrid from "../widgets/TabGrid/TabGrid";

import pageStyles from "./PageStyles.module.css";

const ProjectDetailPage = () => {
    const { projectId } = useParams();
    const [activeTab, setActiveTab] = useState("tabs");

    const [project, setProject] = useState(null);
    const [tabs, setTabs] = useState([]);
    const [userRole, setUserRole] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isCreateTabModalOpen, setIsCreateTabModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError("");

            const projectRes = await api.get(`/projects/${projectId}`);
            setProject(projectRes.data);

            const tabsRes = await api.get(`/projects/${projectId}/tabs`);
            setTabs(
                tabsRes.data.map((tab) => ({
                    ...tab,
                    project_id: projectId,
                })),
            );

            try {
                const roleRes = await api.get(
                    `/projects/${projectId}/permissions/my-role`,
                );
                setUserRole(roleRes.data.role);
            } catch {
                setUserRole("viewer");
            }
        } catch (err) {
            setError("Failed to load project data.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleTabCreated = (newTab) => {
        setTabs((prev) => [newTab, ...prev]);
        setIsCreateTabModalOpen(false);
    };

    const handleDeleteTab = async (tabId) => {
        if (window.confirm("Delete this tab?")) {
            try {
                await api.delete(`/projects/${projectId}/tabs/${tabId}`);
                setTabs((prev) => prev.filter((tab) => tab.id !== tabId));
            } catch {
                alert("Failed to delete tab");
            }
        }
    };

    if (isLoading)
        return <div className={pageStyles.pageContainer}>Loading...</div>;
    if (error)
        return (
            <div className={pageStyles.pageContainer}>
                <p style={{ color: "red" }}>{error}</p>
            </div>
        );

    return (
        <div className="page u-content-width">
            <nav className="breadcrumbs" aria-label="Breadcrumbs">
                <Link to="/projects">My Projects</Link>
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
                aria-label="Project sections"
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "tabs"}
                    className={`tabs-nav__tab ${activeTab === "tabs" ? "tabs-nav__tab--active" : ""}`}
                    onClick={() => setActiveTab("tabs")}
                >
                    <span aria-hidden="true">🖥️</span>
                    Tabs
                    <span className="tabs-nav__count">({tabs.length})</span>
                </button>

                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "members"}
                    className={`tabs-nav__tab ${activeTab === "members" ? "tabs-nav__tab--active" : ""}`}
                    onClick={() => setActiveTab("members")}
                >
                    <span aria-hidden="true">👥</span>
                    Members
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
                        Settings
                    </button>
                )}
            </div>

            <div className="tabs-nav__panel">
                {activeTab === "tabs" && (
                    <>
                        <div className="page-header">
                            <div className="page-header__content">
                                <h3>Collaborative Workspace</h3>
                            </div>

                            <div className="page-header__actions">
                                {(userRole === "owner" ||
                                    userRole === "editor") && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsCreateTabModalOpen(true)
                                        }
                                        className="button button--primary"
                                    >
                                        + New Tab
                                    </button>
                                )}
                            </div>
                        </div>

                        <TabGrid
                            tabs={tabs}
                            onCreateClick={() => setIsCreateTabModalOpen(true)}
                            userRole={userRole}
                            onDeleteTab={handleDeleteTab}
                        />
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
                title="Create New Tab"
            >
                <CreateTabForm
                    projectId={projectId}
                    onSuccess={handleTabCreated}
                />
            </Modal>
        </div>
    );
};

export default ProjectDetailPage;
