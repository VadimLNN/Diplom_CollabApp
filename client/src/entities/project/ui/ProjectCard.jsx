import { useNavigate } from "react-router-dom";
import Card from "../../../shared/ui/Card/Card";

const ProjectCard = ({ project }) => {
    const navigate = useNavigate();

    const handleOpenProject = () => {
        navigate(`/projects/${project.id}`);
    };

    return (
        <Card className="project-card card--interactive">
            <div className="project-card__head">
                <h3 className="project-card__title">{project.name}</h3>
            </div>

            <p className="project-card__text">
                {project.description || "Описание не указано."}
            </p>

            <div className="card__footer">
                <span className="project-card__meta">
                    Создан:{" "}
                    {new Date(project.created_at).toLocaleDateString("ru-RU")}
                </span>

                <button
                    type="button"
                    onClick={handleOpenProject}
                    className="button button--secondary"
                >
                    Открыть
                </button>
            </div>
        </Card>
    );
};

export default ProjectCard;
