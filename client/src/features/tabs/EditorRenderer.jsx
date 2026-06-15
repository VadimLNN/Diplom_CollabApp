import BoardEditor from "./board/BoardEditor";
import TextEditor from "./text/ui/TextEditor";

const EditorRenderer = ({ tab, userRole, projectTabs = [] }) => {
    if (!tab) {
        return <div className="card">Выберите вкладку, чтобы начать работу.</div>;
    }

    const canEdit = userRole === "owner" || userRole === "editor";
    const isViewer = userRole === "viewer";

    const renderEditor = () => {
        switch (tab.type) {
            case "text":
                return (
                    <TextEditor
                        tab={tab}
                        canEdit={canEdit}
                        projectTabs={projectTabs}
                    />
                );

            case "board":
                return (
                    <BoardEditor
                        tab={tab}
                        canEdit={canEdit}
                    />
                );

            default:
                return (
                    <div className="card">
                        Неизвестный тип вкладки: <strong>{tab.type}</strong>
                    </div>
                );
        }
    };

    return (
        <>
            {isViewer && (
                <div className="card editor-readonly-banner">
                    👁️ Режим просмотра. Вы можете просматривать проект, но не
                    можете его редактировать.
                </div>
            )}

            {renderEditor()}
        </>
    );
};

export default EditorRenderer;
