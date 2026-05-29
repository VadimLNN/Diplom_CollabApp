import { HocuspocusProvider } from "@hocuspocus/provider";
import { useEffect, useState } from "react";

export function useHocusProvider(tab) {
    const [provider, setProvider] = useState(null);
    const [connected, setConnected] = useState(false);
    const [synced, setSynced] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!tab?.id || !tab?.ydoc_document_name) {
            setProvider(null);
            setConnected(false);
            setSynced(false);
            return;
        }

        setProvider(null);
        setConnected(false);
        setSynced(false);
        setError(null);

        const nextProvider = new HocuspocusProvider({
            url: import.meta.env.VITE_WS_URL,
            name: tab.ydoc_document_name,
        });

        const handleStatus = ({ status }) => {
            console.log("[Hocuspocus] status:", tab.ydoc_document_name, status);
            setConnected(status === "connected");
        };

        const handleSynced = () => {
            console.log("[Hocuspocus] synced:", tab.ydoc_document_name);
            setSynced(true);
        };

        const handleClose = (event) => {
            console.warn("[Hocuspocus] close:", tab.ydoc_document_name, event);
            setConnected(false);
        };

        const handleConnectionError = (event) => {
            console.error(
                "[Hocuspocus] connection error:",
                tab.ydoc_document_name,
                event,
            );
            setError("Realtime connection error");
            setConnected(false);
        };

        nextProvider.on("status", handleStatus);
        nextProvider.on("synced", handleSynced);
        nextProvider.on("close", handleClose);
        nextProvider.on("connection-error", handleConnectionError);

        setProvider(nextProvider);

        return () => {
            nextProvider.off("status", handleStatus);
            nextProvider.off("synced", handleSynced);
            nextProvider.off("close", handleClose);
            nextProvider.off("connection-error", handleConnectionError);

            nextProvider.destroy();

            setProvider(null);
            setConnected(false);
            setSynced(false);
        };
    }, [tab?.id, tab?.ydoc_document_name]);

    return {
        provider,
        connected,
        synced,
        error,
    };
}
