import ProjectCard from "../../entities/project/ui/ProjectCard";
import EmptyState from "../../shared/ui/EmptyState/EmptyState";

const ProjectGrid = ({ projects, onCreateClick }) => {
    if (!projects || projects.length === 0) {
        return (
            <EmptyState
                icon="🗂️"
                title="No Projects Yet"
                message="It looks a bit empty here. Let's create your first project to get started!"
            >
                <button
                    type="button"
                    onClick={onCreateClick}
                    className="button button--primary"
                >
                    + Create Your First Project
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
