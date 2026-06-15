import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../../shared/api/axios";
import Card from "../../../shared/ui/Card/Card";

const ChangePasswordForm = () => {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        await toast.promise(
            api.put("/auth/change-password", { currentPassword, newPassword }),
            {
                loading: "Обновление пароля...",
                success: () => {
                    setCurrentPassword("");
                    setNewPassword("");
                    return <b>Пароль успешно обновлен!</b>;
                },
                error: (err) => (
                    <b>
                        {err.response?.data?.error ||
                            "Не удалось изменить пароль."}
                    </b>
                ),
            },
        );
    };

    return (
        <Card>
            <div className="card__head">
                <h3>Изменить пароль</h3>
            </div>

            <form onSubmit={handleSubmit} className="form">
                <div className="field">
                    <label className="field__label" htmlFor="current-password">
                        Текущий пароль
                    </label>
                    <input
                        id="current-password"
                        className="field__control"
                        type="password"
                        placeholder="Введите текущий пароль"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />
                </div>

                <div className="field">
                    <label className="field__label" htmlFor="new-password">
                        Новый пароль
                    </label>
                    <input
                        id="new-password"
                        className="field__control"
                        type="password"
                        placeholder="Введите новый пароль"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                    />
                </div>

                <div className="form__actions">
                    <button type="submit" className="button button--primary">
                        Обновить пароль
                    </button>
                </div>
            </form>
        </Card>
    );
};

export default ChangePasswordForm;
