import ChangePasswordForm from "../features/user/settings/ChangePasswordForm";
import DeleteAccountSection from "../features/user/settings/DeleteAccountSection";

const SettingsPage = () => {
    return (
        <div className="page page--narrow u-content-width">
            <header className="page-header">
                <div className="page-header__content">
                    <h1>Настройки аккаунта</h1>
                </div>
            </header>

            <div className="stack">
                <ChangePasswordForm />
                <DeleteAccountSection />
            </div>
        </div>
    );
};

export default SettingsPage;
