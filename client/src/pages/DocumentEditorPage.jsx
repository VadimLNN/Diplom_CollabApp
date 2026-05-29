import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../shared/api/axios";

import EditorRenderer from "../features/tabs/EditorRenderer";

const DocumentEditorPage = () => {
    const { projectId, tabId } = useParams();

    const [tab, setTab] = useState(null);
    const [userRole, setUserRole] = useState(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchEditorData = async () => {
            try {
                setIsLoading(true);
                setError("");

                const [tabResponse, roleResponse] = await Promise.all([
                    api.get(`/projects/${projectId}/tabs/${tabId}`),
                    api.get(`/projects/${projectId}/permissions/my-role`),
                ]);

                setTab(tabResponse.data);
                setUserRole(roleResponse.data.role);
            } catch (err) {
                setError("Failed to load editor");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        if (tabId && projectId) {
            fetchEditorData();
        }
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

                    {userRole && (
                        <span className="status-chip">Role: {userRole}</span>
                    )}
                </div>
            </header>

            <EditorRenderer tab={tab} userRole={userRole} />
        </div>
    );
};

export default DocumentEditorPage;
