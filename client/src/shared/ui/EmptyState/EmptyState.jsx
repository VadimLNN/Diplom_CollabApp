const EmptyState = ({ icon, title, message, children }) => {
    return (
        <div className="empty-state">
            {icon && (
                <div className="empty-state__icon" aria-hidden="true">
                    {icon}
                </div>
            )}

            {title && <h3 className="empty-state__title">{title}</h3>}

            {message && <p className="empty-state__message">{message}</p>}

            {children && <div className="empty-state__actions">{children}</div>}
        </div>
    );
};

export default EmptyState;
