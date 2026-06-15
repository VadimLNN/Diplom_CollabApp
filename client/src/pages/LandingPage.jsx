import { Link } from "react-router-dom";
import FlipCard from "../shared/ui/FlipCard/FlipCard";
import pageStyles from "./PageStyles.module.css";

const LandingPage = () => {
    return (
        <div className={`${pageStyles.pageContainer} ${pageStyles.pageCentered}`}>
            <h1 style={{ fontSize: "48px", marginBottom: "10px" }}>Совместная работа над текстами. Просто.</h1>
            <p style={{ fontSize: "20px", color: "var(--color-text-secondary)", maxWidth: "600px", marginBottom: "40px" }}>
                Наше приложение позволяет командам создавать и редактировать документы в реальном времени.
            </p>

            <FlipCard
                frontContent={
                    <div>
                        <h3>🚀 Быстрый старт</h3>
                        <p>Регистрируйтесь и создавайте проекты за секунды.</p>
                    </div>
                }
                backContent={
                    <div>
                        <h3>🤝 Коллаборация</h3>
                        <p>Приглашайте коллег и работайте вместе в реальном времени.</p>
                    </div>
                }
            />

            <Link to="/register" className="btn-primary" style={{ marginTop: "40px" }}>
                Начать бесплатно
            </Link>
        </div>
    );
};

export default LandingPage;
