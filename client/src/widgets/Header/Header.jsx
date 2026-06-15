import toast from "react-hot-toast";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/authContext";

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        toast.success("Вы вышли из аккаунта.");
        navigate("/login");
    };

    return (
        <header className="app-header">
            <div className="app-header__inner">
                <div className="app-header__brand">
                    <Link to={user ? "/projects" : "/"}>Collab App</Link>
                </div>

                <nav
                    className="app-header__nav"
                    aria-label="Основная навигация"
                >
                    {user ? (
                        <>
                            <span className="app-header__user">
                                Привет, {user.username}!
                            </span>

                            <NavLink
                                to="/settings"
                                className="app-header__link"
                            >
                                Настройки
                            </NavLink>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="button button--ghost"
                            >
                                Выйти
                            </button>
                        </>
                    ) : (
                        <>
                            <NavLink to="/login" className="app-header__link">
                                Войти
                            </NavLink>

                            <NavLink
                                to="/register"
                                className="app-header__link"
                            >
                                Регистрация
                            </NavLink>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;
