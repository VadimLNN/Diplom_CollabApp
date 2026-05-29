import BoardEditor from "./board/BoardEditor";
import TextEditor from "./text/ui/TextEditor";

const EditorRenderer = ({ tab, userRole }) => {
    if (!tab) {
        return <div className="card">Select a tab to start working.</div>;
    }

    const canEdit = userRole === "owner" || userRole === "editor";
    const isViewer = userRole === "viewer";

    const renderEditor = () => {
        if (tab.type === "text") {
            return <TextEditor tab={tab} canEdit={canEdit} />;
        }

        if (tab.type === "board") {
            return <BoardEditor tab={tab} canEdit={canEdit} />;
        }

        if (tab.type === "code") {
            return (
                <div className="card">Code editor is not implemented yet.</div>
            );
        }

        return <div className="card">Unknown tab type: {tab.type}</div>;
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
