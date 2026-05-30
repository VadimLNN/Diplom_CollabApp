import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useLocation, useNavigate, useParams } from "react-router-dom";
import { saveBoardElementAnchor } from "../../../shared/links/boardElementClipboard";
import {
    clearTextBlockAnchor,
    getTextBlockAnchor,
} from "../../../shared/links/textBlockClipboard";
import { useHocusProvider } from "../../../shared/realtime/getHocusProvider";

const LOCAL_ORIGIN = "local-excalidraw-change";

const SYNC_INTERVAL_MS = 33;

const BoardEditor = ({ tab, canEdit }) => {
    const {
        provider,
        connected,
        synced,
        error: syncError,
    } = useHocusProvider(tab);

    const location = useLocation();
    const navigate = useNavigate();
    const { projectId } = useParams();

    const [selectedElementIds, setSelectedElementIds] = useState({});
    const [copiedElementNotice, setCopiedElementNotice] = useState("");

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
        (elements, appState) => {
            setSelectedElementIds(appState?.selectedElementIds || {});

            if (!canEdit) {
                return;
            }

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
        [canEdit, ydoc, sceneMap, synced, apiReady, flushLatestElements],
    );

    const getSelectedBoardElement = useCallback(() => {
        const excalidrawAPI = excalidrawAPIRef.current;

        if (!excalidrawAPI) {
            return null;
        }

        const selectedIds = Object.keys(selectedElementIds || {});

        if (selectedIds.length !== 1) {
            return null;
        }

        const selectedId = selectedIds[0];

        const elements = excalidrawAPI.getSceneElements();

        return elements.find((element) => element.id === selectedId) || null;
    }, [selectedElementIds]);

    const selectedBoardElement = useMemo(() => {
        return getSelectedBoardElement();
    }, [getSelectedBoardElement]);

    const selectedInternalLink = selectedBoardElement?.customData?.internalLink;

    const handleCopySelectedElementAnchor = useCallback(() => {
        const selectedElement = getSelectedBoardElement();

        if (!selectedElement) {
            setCopiedElementNotice("Select exactly one board element first.");
            return;
        }

        const anchor = {
            tabId: tab.id,
            tabTitle: tab.title,
            tabType: "board",

            anchorType: "board-element",
            anchorId: selectedElement.id,

            label:
                selectedElement.customData?.label ||
                selectedElement.text ||
                selectedElement.type ||
                "Board element",

            elementType: selectedElement.type,
            copiedAt: Date.now(),
        };

        saveBoardElementAnchor(anchor);
        setCopiedElementNotice("Board element link copied.");
    }, [getSelectedBoardElement, tab]);

    const handleAttachTextBlockLinkToSelectedElement = useCallback(() => {
        const selectedElement = getSelectedBoardElement();

        if (!selectedElement) {
            setCopiedElementNotice("Select exactly one board element first.");
            return;
        }

        const textAnchor = getTextBlockAnchor();

        if (!textAnchor || textAnchor.anchorType !== "text-block") {
            setCopiedElementNotice(
                "Copy paragraph anchor from text editor first.",
            );
            return;
        }

        const excalidrawAPI = excalidrawAPIRef.current;

        if (!excalidrawAPI) {
            return;
        }

        const elements = excalidrawAPI.getSceneElements();

        const updatedElements = elements.map((element) => {
            if (element.id !== selectedElement.id) {
                return element;
            }

            return {
                ...element,
                customData: {
                    ...(element.customData || {}),
                    internalLink: {
                        tabId: textAnchor.tabId,
                        tabTitle: textAnchor.tabTitle,
                        tabType: textAnchor.tabType,

                        anchorType: textAnchor.anchorType,
                        anchorId: textAnchor.anchorId,

                        label: textAnchor.label,
                        linkedAt: Date.now(),
                    },
                },
            };
        });

        excalidrawAPI.updateScene({
            elements: updatedElements,
        });

        latestElementsRef.current = updatedElements.map((element) => ({
            ...element,
        }));

        flushLatestElements();

        clearTextBlockAnchor();
        setCopiedElementNotice("Paragraph anchor attached to board element.");
    }, [getSelectedBoardElement, flushLatestElements]);

    const handleOpenLinkedParagraph = useCallback(() => {
        if (!selectedInternalLink || !projectId) {
            return;
        }

        navigate(`/projects/${projectId}/tabs/${selectedInternalLink.tabId}`, {
            state: {
                targetTabType: selectedInternalLink.tabType,
                targetAnchorType: selectedInternalLink.anchorType,
                targetAnchorId: selectedInternalLink.anchorId,
            },
        });
    }, [navigate, projectId, selectedInternalLink]);

    useEffect(() => {
        if (!copiedElementNotice) {
            return;
        }

        const timer = setTimeout(() => {
            setCopiedElementNotice("");
        }, 2200);

        return () => clearTimeout(timer);
    }, [copiedElementNotice]);

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

    useEffect(() => {
        if (!apiReady || !synced || !location.state) {
            return;
        }

        if (location.state.targetAnchorType !== "board-element") {
            return;
        }

        const targetAnchorId = location.state.targetAnchorId;

        if (!targetAnchorId || !excalidrawAPIRef.current) {
            return;
        }

        const api = excalidrawAPIRef.current;
        const elements = api.getSceneElements();
        const targetElement = elements.find(
            (element) => element.id === targetAnchorId,
        );

        if (!targetElement) {
            return;
        }

        api.updateScene({
            appState: {
                selectedElementIds: {
                    [targetElement.id]: true,
                },
            },
        });

        api.scrollToContent([targetElement], {
            fitToContent: true,
            animate: true,
        });
    }, [apiReady, synced, location.state]);

    if (syncError) {
        return <div className="card">⚠️ {syncError}. Try reconnecting.</div>;
    }

    if (!provider || !synced) {
        return <div className="card">🔄 Loading board state...</div>;
    }

    return (
        <section className="editor-shell editor-shell--board">
            <div className="editor-shell__meta editor-shell__meta--with-actions">
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

                {canEdit && (
                    <div className="board-link-tools">
                        {copiedElementNotice && (
                            <span className="board-link-tools__notice">
                                {copiedElementNotice}
                            </span>
                        )}

                        <button
                            type="button"
                            className="button button--secondary board-link-tools__button"
                            onClick={handleCopySelectedElementAnchor}
                        >
                            Copy selected element link
                        </button>

                        <button
                            type="button"
                            className="button button--secondary board-link-tools__button"
                            onClick={handleAttachTextBlockLinkToSelectedElement}
                        >
                            Attach paragraph anchor
                        </button>

                        {selectedInternalLink && (
                            <button
                                type="button"
                                className="button button--secondary board-link-tools__button"
                                onClick={handleOpenLinkedParagraph}
                            >
                                Open linked paragraph
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="editor-shell__body editor-shell__body--board">
                <Excalidraw
                    theme="dark"
                    viewModeEnabled={!canEdit}
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
