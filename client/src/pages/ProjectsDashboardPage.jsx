import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import CreateProjectForm from "../features/projects/create/CreateProjectForm";
import api from "../shared/api/axios";
import Modal from "../shared/ui/Modal/Modal";
import ProjectGrid from "../widgets/ProjectGrid/ProjectGrid";

const ProjectsDashboardPage = () => {
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchProjects = useCallback(async () => {
        try {
            setIsLoading(true);
            setError("");
            const response = await api.get("/projects");

            const validProjects = response.data.filter(
                (project) => project.id && project.name && !project.deleted_at,
            );

            setProjects(validProjects);
        } catch (err) {
            setError("Не удалось получить список проектов.");
            toast.error("Не удалось загрузить проекты");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const handleProjectCreated = useCallback((newProject) => {
        setProjects((prev) => [newProject, ...prev]);
        setIsModalOpen(false);
        toast.success("Проект создан!");
    }, []);

    const handleOpenCreateModal = () => {
        setIsModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="page u-content-width">
                <p>Загрузка проектов...</p>
            </div>
        );
    }

    return (
        <div className="page u-content-width">
            <header className="page-header">
                <div className="page-header__content">
                    <h1>Мои проекты</h1>
                </div>

                {projects.length > 0 && (
                    <div className="page-header__actions">
                        <button
                            type="button"
                            onClick={handleOpenCreateModal}
                            className="button button--primary"
                        >
                            + Создать проект
                        </button>
                    </div>
                )}
            </header>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <ProjectGrid
                projects={projects}
                onCreateClick={handleOpenCreateModal}
                onRefresh={fetchProjects}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Создать проект"
            >
                <CreateProjectForm onSuccess={handleProjectCreated} />
            </Modal>
        </div>
    );
};

export default ProjectsDashboardPage;
