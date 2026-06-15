import React from "react";
import { Toaster } from "react-hot-toast";
import { BrowserRouter as Router } from "react-router-dom";
import AuroraBG from "../shared/ui/AuroraBG/AuroraBG";
import Header from "../widgets/Header/Header";
import { AuthProvider } from "./providers/AuthProvider";
import Routes from "./routes/index";

const App = () => (
    <Router>
        <AuthProvider>
            <AuroraBG
                colorStops={["#7cff67", "#b19eef", "#5227ff"]}
                blend={0.5}
                amplitude={1.0}
                speed={0.5}
            />
            <div className="app-shell">
                <div className="app-shell__header">
                    <Header />
                </div>

                <main id="app-content" className="app-shell__main">
                    <Routes />
                </main>

                <Toaster
                    position="bottom-right"
                    toastOptions={{
                        className: "toast",
                        style: {
                            background: "var(--color-surface-3)",
                            color: "var(--color-text-primary)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-2)",
                        },
                    }}
                />
            </div>
        </AuthProvider>
    </Router>
);

export default React.memo(App);
