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
                "Are you absolutely sure? This action cannot be undone.",
            )
        ) {
            try {
                await api.delete("/auth/delete-account", {
                    data: { password },
                });
                toast.success("Your account has been deleted.");
                logout();
            } catch (error) {
                toast.error(
                    error.response?.data?.error || "Failed to delete account.",
                );
            }
        }
    };

    return (
        <Card className="card--danger">
            <div className="card__head">
                <h3>Danger Zone</h3>
                <p className="card__subtitle">
                    Once you delete your account, there is no going back. Please
                    be certain.
                </p>
            </div>

            <div className="form">
                <div className="field">
                    <label
                        className="field__label"
                        htmlFor="delete-account-password"
                    >
                        Confirm your password
                    </label>
                    <input
                        id="delete-account-password"
                        className="field__control"
                        type="password"
                        placeholder="Confirm your password"
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
                        Delete My Account
                    </button>
                </div>
            </div>
        </Card>
    );
};

export default DeleteAccountSection;
