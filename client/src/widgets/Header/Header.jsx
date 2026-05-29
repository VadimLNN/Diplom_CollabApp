// src/widgets/Header/ui/Header.jsx
import toast from "react-hot-toast";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        toast.success("You have been logged out.");
        navigate("/login");
    };

    return (
        <header className="app-header u-content-width">
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
                                Hi, {user.username}!
                            </span>

                            <NavLink
                                to="/settings"
                                className="app-header__link"
                            >
                                Settings
                            </NavLink>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="button button--ghost"
                            >
                                Log out
                            </button>
                        </>
                    ) : (
                        <>
                            <NavLink to="/login" className="app-header__link">
                                Login
                            </NavLink>

                            <NavLink
                                to="/register"
                                className="app-header__link"
                            >
                                Register
                            </NavLink>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;
