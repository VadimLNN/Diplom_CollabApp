import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useHocusProvider } from "../../../shared/realtime/getHocusProvider";

const LOCAL_ORIGIN = "local-excalidraw-change";

const SYNC_INTERVAL_MS = 33;

const BoardEditor = ({ tab }) => {
    const {
        provider,
        connected,
        synced,
        error: syncError,
    } = useHocusProvider(tab);

    const [apiReady, setApiReady] = useState(false);

    const excalidrawAPIRef = useRef(null);

    const applyingRemoteRef = useRef(false);
    const initialSceneAppliedRef = useRef(false);

    const latestElementsRef = useRef(null);
    const pendingSyncTimerRef = useRef(null);
    const lastSyncAtRef = useRef(0);
    const remoteApplyTimerRef = useRef(null);

    const ydoc = provider?.document;

    const sceneMap = useMemo(() => {
        if (!ydoc) {
            return null;
        }

        return ydoc.getMap("excalidraw_scene");
    }, [ydoc]);

    const applySceneFromYjs = useCallback(() => {
        const excalidrawAPI = excalidrawAPIRef.current;

        if (!excalidrawAPI || !sceneMap) {
            return false;
        }

        const elements = sceneMap.get("elements");

        if (!Array.isArray(elements)) {
            return false;
        }

        applyingRemoteRef.current = true;

        excalidrawAPI.updateScene({
            elements,
        });

        if (remoteApplyTimerRef.current) {
            clearTimeout(remoteApplyTimerRef.current);
        }

        remoteApplyTimerRef.current = setTimeout(() => {
            applyingRemoteRef.current = false;
        }, 80);

        return true;
    }, [sceneMap]);

    useEffect(() => {
        if (
            !synced ||
            !apiReady ||
            !sceneMap ||
            initialSceneAppliedRef.current
        ) {
            return;
        }

        applySceneFromYjs();

        initialSceneAppliedRef.current = true;
    }, [synced, apiReady, sceneMap, applySceneFromYjs]);

    useEffect(() => {
        if (!sceneMap) {
            return;
        }

        const handleRemoteSceneChange = (event, transaction) => {
            if (transaction.origin === LOCAL_ORIGIN) {
                return;
            }

            if (applyingRemoteRef.current) {
                return;
            }

            applySceneFromYjs();
        };

        sceneMap.observe(handleRemoteSceneChange);

        return () => {
            sceneMap.unobserve(handleRemoteSceneChange);
        };
    }, [sceneMap, applySceneFromYjs]);

    const flushLatestElements = useCallback(() => {
        if (!ydoc || !sceneMap || !latestElementsRef.current) {
            pendingSyncTimerRef.current = null;
            return;
        }

        const latestElements = latestElementsRef.current;

        ydoc.transact(() => {
            sceneMap.set("elements", latestElements);
            sceneMap.set("updatedAt", Date.now());
        }, LOCAL_ORIGIN);

        lastSyncAtRef.current = Date.now();
        pendingSyncTimerRef.current = null;
    }, [ydoc, sceneMap]);

    const handleChange = useCallback(
        (elements) => {
            if (!ydoc || !sceneMap) {
                return;
            }

            if (!synced || !apiReady) {
                return;
            }

            if (!initialSceneAppliedRef.current) {
                return;
            }

            if (applyingRemoteRef.current) {
                return;
            }

            latestElementsRef.current = elements.map((element) => ({
                ...element,
            }));

            const now = Date.now();
            const elapsed = now - lastSyncAtRef.current;

            if (elapsed >= SYNC_INTERVAL_MS) {
                flushLatestElements();
                return;
            }

            if (!pendingSyncTimerRef.current) {
                pendingSyncTimerRef.current = setTimeout(() => {
                    flushLatestElements();
                }, SYNC_INTERVAL_MS - elapsed);
            }
        },
        [ydoc, sceneMap, synced, apiReady, flushLatestElements],
    );

    useEffect(() => {
        initialSceneAppliedRef.current = false;
        latestElementsRef.current = null;
        lastSyncAtRef.current = 0;
        applyingRemoteRef.current = false;
        setApiReady(false);

        if (pendingSyncTimerRef.current) {
            clearTimeout(pendingSyncTimerRef.current);
            pendingSyncTimerRef.current = null;
        }

        if (remoteApplyTimerRef.current) {
            clearTimeout(remoteApplyTimerRef.current);
            remoteApplyTimerRef.current = null;
        }
    }, [tab?.id, tab?.ydoc_document_name]);

    useEffect(() => {
        return () => {
            if (pendingSyncTimerRef.current) {
                clearTimeout(pendingSyncTimerRef.current);
            }

            if (remoteApplyTimerRef.current) {
                clearTimeout(remoteApplyTimerRef.current);
            }
        };
    }, []);

    if (syncError) {
        return <div className="card">⚠️ {syncError}. Try reconnecting.</div>;
    }

    if (!provider || !synced) {
        return <div className="card">🔄 Loading board state...</div>;
    }

    return (
        <section className="editor-shell editor-shell--board">
            <div className="editor-shell__meta">
                <span
                    className={`status-chip ${
                        connected
                            ? "status-chip--success"
                            : "status-chip--danger"
                    }`}
                >
                    <span className="status-chip__dot" aria-hidden="true" />
                    {connected ? "Connected" : "Disconnected"}
                </span>
            </div>

            <div className="editor-shell__body editor-shell__body--board">
                <Excalidraw
                    theme="dark"
                    excalidrawAPI={(api) => {
                        excalidrawAPIRef.current = api;
                        setApiReady(Boolean(api));
                    }}
                    onChange={handleChange}
                />
            </div>
        </section>
    );
};

export default BoardEditor;
