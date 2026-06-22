import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../providers/authContext";

function PrivateRoute({ children }) {
    const { status } = useAuth();
    const location = useLocation();

    if (status === "checking") {
        return <div className="page u-content-width">Проверка сессии...</div>;
    }

    if (status === "unavailable") {
        return (
            <div className="page u-content-width">
                <p className="field__error">
                    Сервер временно недоступен. Обновите страницу позже.
                </p>
            </div>
        );
    }

    if (status === "authenticated") {
        return children;
    }

    return (
        <Navigate
            to="/login"
            replace
            state={{ from: location }}
        />
    );
}

export default PrivateRoute;
