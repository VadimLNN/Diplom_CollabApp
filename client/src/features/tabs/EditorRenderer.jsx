import BoardEditor from "./board/BoardEditor";
import TextEditor from "./text/ui/TextEditor";

const EditorRenderer = ({ tab, userRole, projectTabs = [] }) => {
    if (!tab) {
        return <div className="card">Select a tab to start working.</div>;
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
                        projectTabs={projectTabs}
                    />
                );

            case "code":
                return (
                    <div className="card">
                        Code editor is not implemented yet.
                    </div>
                );

            default:
                return (
                    <div className="card">
                        Unknown tab type: <strong>{tab.type}</strong>
                    </div>
                );
        }
    };

    return (
        <>
            {isViewer && (
                <div className="card editor-readonly-banner">
                    👁️ View-only mode. You can view this project, but cannot
                    edit it.
                </div>
            )}

            {renderEditor()}
        </>
    );
};

export default EditorRenderer;
