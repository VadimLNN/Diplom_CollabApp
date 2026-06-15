import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../../app/providers/authContext";
import api from "../../../shared/api/axios";
import Card from "../../../shared/ui/Card/Card";

const DeleteAccountSection = () => {
    const [password, setPassword] = useState("");
    const { logout } = useAuth();

    const handleDelete = async () => {
        if (
            window.confirm(
                "Вы уверены? Это действие нельзя отменить.",
            )
        ) {
            try {
                await api.delete("/auth/delete-account", {
                    data: { password },
                });
                toast.success("Ваш аккаунт удален.");
                logout();
            } catch (error) {
                toast.error(
                    error.response?.data?.error ||
                        "Не удалось удалить аккаунт.",
                );
            }
        }
    };

    return (
        <Card className="card--danger">
            <div className="card__head">
                <h3>Опасная зона</h3>
                <p className="card__subtitle">
                    После удаления аккаунта восстановить его будет невозможно.
                </p>
            </div>

            <div className="form">
                <div className="field">
                    <label
                        className="field__label"
                        htmlFor="delete-account-password"
                    >
                        Подтвердите пароль
                    </label>
                    <input
                        id="delete-account-password"
                        className="field__control"
                        type="password"
                        placeholder="Введите пароль для подтверждения"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />
                </div>

                <div className="form__actions">
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="button button--danger"
                    >
                        Удалить мой аккаунт
                    </button>
                </div>
            </div>
        </Card>
    );
};

export default DeleteAccountSection;
