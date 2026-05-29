import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../shared/api/axios";

import EditorRenderer from "../features/tabs/EditorRenderer";

const DocumentEditorPage = () => {
    const { projectId, tabId } = useParams();
    const navigate = useNavigate();

    const [tab, setTab] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchTab = async () => {
            try {
                setIsLoading(true);
                const response = await api.get(
                    `/projects/${projectId}/tabs/${tabId}`,
                );
                setTab(response.data);
            } catch (err) {
                setError("Failed to load tab");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        if (tabId && projectId) fetchTab();
    }, [tabId, projectId]);

    if (isLoading) {
        return (
            <div className="page page--editor u-content-width">
                🔄 Loading editor...
            </div>
        );
    }

    if (error || !tab) {
        return (
            <div className="page page--editor u-content-width">
                <p className="field__error">{error || "Tab not found"}</p>
                <Link
                    to={`/projects/${projectId}`}
                    className="button button--secondary"
                >
                    ← Back to Project
                </Link>
            </div>
        );
    }

    return (
        <div className="page page--editor u-content-width">
            <nav className="breadcrumbs" aria-label="Breadcrumbs">
                <Link to={`/projects/${projectId}`}>
                    ← {tab.project_name || "Project"}
                </Link>
            </nav>

            <header className="page-header">
                <div className="page-header__content">
                    <h1>{tab.title}</h1>
                </div>
            </header>

            <EditorRenderer tab={tab} />
        </div>
    );
};

export default DocumentEditorPage;
