import React from "react";
import { Routes as ReactRoutes, Route } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import LandingPage from "../../pages/LandingPage";
import LoginPage from "../../pages/LoginPage";
import RegisterPage from "../../pages/RegisterPage";
import ProjectsDashboardPage from "../../pages/ProjectsDashboardPage";
import ProjectDetailPage from "../../pages/ProjectDetailPage";
import DocumentEditorPage from "../../pages/DocumentEditorPage";
import SettingsPage from "../../pages/SettingsPage";

const AppRoutes = () => (
    <ReactRoutes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
            path="/projects"
            element={
                <PrivateRoute>
                    <ProjectsDashboardPage />
                </PrivateRoute>
            }
        />
        <Route
            path="/projects/:projectId"
            element={
                <PrivateRoute>
                    <ProjectDetailPage />
                </PrivateRoute>
            }
        />
        <Route
            path="/projects/:projectId/tabs/:tabId"
            element={
                <PrivateRoute>
                    <DocumentEditorPage />
                </PrivateRoute>
            }
        />
        <Route
            path="/settings"
            element={
                <PrivateRoute>
                    <SettingsPage />
                </PrivateRoute>
            }
        />

        <Route path="*" element={<div>404 - Страница не найдена</div>} />
    </ReactRoutes>
);

export default AppRoutes;
