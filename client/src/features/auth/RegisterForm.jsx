import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "../../shared/api/axios";

const RegisterForm = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const usernameInputRef = useRef(null);

    useEffect(() => {
        if (usernameInputRef.current) {
            usernameInputRef.current.focus();
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        await toast.promise(
            api.post("/auth/register", { username, email, password }),
            {
                loading: "Registering...",
                success: (response) => {
                    setTimeout(() => navigate("/login"), 1500);
                    return <b>Registration successful! Redirecting...</b>;
                },
                error: (err) => (
                    <b>{err.response?.data?.error || "Registration failed"}</b>
                ),
            },
        );
    };

    return (
        <section
            className="card form form--auth"
            aria-labelledby="register-title"
        >
            <div className="card__head">
                <h1 id="register-title">Register</h1>
            </div>

            <form className="form" onSubmit={handleSubmit}>
                <div className="field">
                    <label className="field__label" htmlFor="register-username">
                        Имя пользователя
                    </label>
                    <input
                        id="register-username"
                        ref={usernameInputRef}
                        type="text"
                        placeholder="Введите имя пользователя"
                        className="field__control"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        required
                    />
                </div>

                <div className="field">
                    <label className="field__label" htmlFor="register-email">
                        Email
                    </label>
                    <input
                        id="register-email"
                        type="email"
                        placeholder="Введите email"
                        className="field__control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                    />
                </div>

                <div className="field">
                    <label className="field__label" htmlFor="register-password">
                        Пароль
                    </label>
                    <input
                        id="register-password"
                        type="password"
                        placeholder="Введите пароль"
                        className="field__control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                    />
                </div>

                <button type="submit" className="button button--primary">
                    Зарегистрироваться
                </button>
            </form>
        </section>
    );
};

export default RegisterForm;
