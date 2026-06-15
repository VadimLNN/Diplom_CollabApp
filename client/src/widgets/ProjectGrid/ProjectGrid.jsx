import ProjectCard from "../../entities/project/ui/ProjectCard";
import EmptyState from "../../shared/ui/EmptyState/EmptyState";

const ProjectGrid = ({ projects, onCreateClick }) => {
    if (!projects || projects.length === 0) {
        return (
            <EmptyState
                icon="🗂️"
                title="Проектов пока нет"
                message="Создайте первый проект, чтобы начать работу."
            >
                <button
                    type="button"
                    onClick={onCreateClick}
                    className="button button--primary"
                >
                    + Создать первый проект
                </button>
            </EmptyState>
        );
    }

    return (
        <div className="project-grid">
            {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
            ))}
        </div>
    );
};

export default ProjectGrid;
