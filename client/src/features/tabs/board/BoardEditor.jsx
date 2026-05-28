// src/features/tabs/board/BoardEditor.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import { HocuspocusProvider } from "@hocuspocus/provider";
import styles from "./BoardEditor.module.css";
import "@excalidraw/excalidraw/index.css";

const providerCache = new Map();

const LOCAL_ORIGIN = "local-excalidraw-change";

function getProvider(tabId, docName) {
    if (!providerCache.has(tabId)) {
        const provider = new HocuspocusProvider({
            url: import.meta.env.VITE_WS_URL,
            name: docName,
        });

        providerCache.set(tabId, provider);
    }

    return providerCache.get(tabId);
}

function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
}

function getCleanAppState(appState) {
    return {
        viewBackgroundColor: appState.viewBackgroundColor,

        currentItemStrokeColor: appState.currentItemStrokeColor,
        currentItemBackgroundColor: appState.currentItemBackgroundColor,
        currentItemFillStyle: appState.currentItemFillStyle,
        currentItemStrokeWidth: appState.currentItemStrokeWidth,
        currentItemStrokeStyle: appState.currentItemStrokeStyle,
        currentItemRoughness: appState.currentItemRoughness,
        currentItemOpacity: appState.currentItemOpacity,

        currentItemFontFamily: appState.currentItemFontFamily,
        currentItemFontSize: appState.currentItemFontSize,
        currentItemTextAlign: appState.currentItemTextAlign,

        currentItemStartArrowhead: appState.currentItemStartArrowhead,
        currentItemEndArrowhead: appState.currentItemEndArrowhead,
    };
}

export default function BoardEditor({ tab }) {
    const [connected, setConnected] = useState(false);
    const [apiReady, setApiReady] = useState(false);
    const [synced, setSynced] = useState(false);

    const excalidrawAPIRef = useRef(null);
    const applyingRemoteRef = useRef(false);
    const initialSceneAppliedRef = useRef(false);

    const provider = useMemo(() => {
        if (!tab?.ydoc_document_name) return null;
        return getProvider(tab.id, tab.ydoc_document_name);
    }, [tab?.id, tab?.ydoc_document_name]);

    const ydoc = provider?.document ?? null;

    const sceneMap = useMemo(() => {
        if (!ydoc) return null;
        return ydoc.getMap("excalidraw_scene");
    }, [ydoc]);

    const applySceneFromYjs = useCallback(() => {
        const excalidrawAPI = excalidrawAPIRef.current;

        if (!excalidrawAPI || !sceneMap) return;

        // ВАЖНО:
        // если сцены ещё нет, ничего не применяем.
        // Иначе мы сами стираем свежесозданную фигуру пустым массивом.
        if (!sceneMap.has("elements")) return;

        const elements = sceneMap.get("elements") || [];
        const appState = sceneMap.get("appState") || {};

        applyingRemoteRef.current = true;

        excalidrawAPI.updateScene({
            elements,
            appState: {
                ...appState,
                collaborators: new Map(),
            },
        });

        // Excalidraw может вызвать onChange после updateScene.
        // Поэтому флаг снимаем не сразу, а на следующем тике.
        setTimeout(() => {
            applyingRemoteRef.current = false;
        }, 0);
    }, [sceneMap]);

    useEffect(() => {
        if (!provider) return;

        const onStatus = ({ status }) => {
            const isConnected = status === "connected";
            setConnected(isConnected);
            console.log("[Board] Hocuspocus:", status);
        };

        const onSynced = () => {
            console.log("[Board] Hocuspocus synced");
            setSynced(true);
        };

        provider.on("status", onStatus);
        provider.on("synced", onSynced);

        return () => {
            provider.off("status", onStatus);
            provider.off("synced", onSynced);
        };
    }, [provider]);

    // Первичная загрузка сохранённой сцены.
    useEffect(() => {
        if (!apiReady || !sceneMap || initialSceneAppliedRef.current) return;

        // Если provider уже успел синхронизироваться — применяем.
        // Если synced event не пришёл, connected тоже подходит как fallback.
        if (!synced && !connected) return;

        applySceneFromYjs();
        initialSceneAppliedRef.current = true;
    }, [apiReady, synced, connected, sceneMap, applySceneFromYjs]);

    // REMOTE → LOCAL
    useEffect(() => {
        if (!apiReady || !sceneMap) return;

        const onRemoteChange = (event, transaction) => {
            // Ключевой фикс:
            // не применяем изменения, которые сами же только что записали.
            if (transaction.origin === LOCAL_ORIGIN) return;

            if (applyingRemoteRef.current) return;

            applySceneFromYjs();
        };

        sceneMap.observe(onRemoteChange);

        return () => {
            sceneMap.unobserve(onRemoteChange);
        };
    }, [apiReady, sceneMap, applySceneFromYjs]);

    // LOCAL → REMOTE
    const handleChange = useCallback(
        (elements, appState) => {
            if (!ydoc || !sceneMap) return;
            if (applyingRemoteRef.current) return;

            const cleanElements = cloneJson(elements);
            const cleanAppState = getCleanAppState(appState);

            ydoc.transact(() => {
                sceneMap.set("elements", cleanElements);
                sceneMap.set("appState", cleanAppState);
                sceneMap.set("updatedAt", Date.now());
            }, LOCAL_ORIGIN);
        },
        [ydoc, sceneMap]
    );

    if (!provider) {
        return <div className={styles.loading}>🔄 Initializing board…</div>;
    }

    return (
        <div className={styles.container}>
            <span className={connected ? styles.connected : styles.disconnected}>
                {connected ? "🟢 Connected" : "🔴 Disconnected"}
            </span>

            <div className={styles.board}>
                <Excalidraw
                    excalidrawAPI={(api) => {
                        if (!excalidrawAPIRef.current) {
                            excalidrawAPIRef.current = api;
                            setApiReady(true);
                        }
                    }}
                    onChange={handleChange}
                    theme="dark"
                />
            </div>
        </div>
    );
}