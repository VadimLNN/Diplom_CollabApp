import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/authContext";

const LoginForm = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();

    const usernameInputRef = useRef(null);

    useEffect(() => {
        if (usernameInputRef.current) {
            usernameInputRef.current.focus();
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const normalizedUsername = username.trim();
        setUsername(normalizedUsername);

        await toast.promise(login({ username: normalizedUsername, password }), {
            loading: "Выполняется вход...",
            success: () => {
                navigate("/projects");
                return <b>С возвращением!</b>;
            },
            error: (error) => (
                <b>{error.response?.data?.error || "Не удалось войти!"}</b>
            ),
        });
    };

    return (
        <section className="card form form--auth" aria-labelledby="login-title">
            <div className="card__head">
                <h1 id="login-title">Вход</h1>
            </div>

            <form className="form" onSubmit={handleSubmit}>
                <div className="field">
                    <label className="field__label" htmlFor="login-username">
                        Имя пользователя
                    </label>
                    <input
                        id="login-username"
                        ref={usernameInputRef}
                        type="text"
                        placeholder="Введите имя пользователя"
                        className="field__control"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onBlur={() => setUsername((value) => value.trim())}
                        autoComplete="username"
                        required
                    />
                </div>

                <div className="field">
                    <label className="field__label" htmlFor="login-password">
                        Пароль
                    </label>
                    <input
                        id="login-password"
                        type="password"
                        placeholder="Введите пароль"
                        className="field__control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />
                </div>

                <button type="submit" className="button button--primary">
                    Войти
                </button>
            </form>
        </section>
    );
};

export default LoginForm;
