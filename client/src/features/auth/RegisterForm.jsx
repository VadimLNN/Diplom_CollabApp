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

        const normalizedUsername = username.trim();
        const normalizedEmail = email.trim();

        setUsername(normalizedUsername);
        setEmail(normalizedEmail);

        await toast.promise(
            api.post("/auth/register", {
                username: normalizedUsername,
                email: normalizedEmail,
                password,
            }),
            {
                loading: "Регистрация...",
                success: () => {
                    setTimeout(() => navigate("/login"), 1500);
                    return <b>Регистрация завершена! Перенаправляем...</b>;
                },
                error: (error) => (
                    <b>
                        {error.response?.data?.error ||
                            "Не удалось зарегистрироваться"}
                    </b>
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
                <h1 id="register-title">Регистрация</h1>
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
                        onBlur={() => setUsername((value) => value.trim())}
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
                        onBlur={() => setEmail((value) => value.trim())}
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
