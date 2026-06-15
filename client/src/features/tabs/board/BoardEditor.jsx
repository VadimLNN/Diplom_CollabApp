import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useLocation, useNavigate, useParams } from "react-router-dom";
import { saveBoardElementAnchor } from "../../../shared/links/boardElementClipboard";
import {
    clearTextBlockAnchor,
    getTextBlockAnchor,
} from "../../../shared/links/textBlockClipboard";
import { useHocusProvider } from "../../../shared/realtime/getHocusProvider";
import { useBoardAwareness } from "./useBoardAwareness";
import { useBoardCollaboration } from "./useBoardCollaboration";

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

    const {
        excalidrawAPIRef,
        apiReady,
        handleApiReady,
        handleChange,
        updateBoardElement,
        getSceneElements,
        selectElement,
        scrollToElement,
    } = useBoardCollaboration({
        provider,
        synced,
        canEdit,
        onSelectionChange: setSelectedElementIds,
    });

    const username = (() => {
        try {
            const token = localStorage.getItem("token");
            if (token) {
                const payload = JSON.parse(atob(token.split(".")[1]));
                return payload?.username || payload?.sub || null;
            }
        } catch {
            return null;
        }
        return null;
    })();

    const { handlePointerUpdate: onPointerUpdate } = useBoardAwareness(
        provider,
        excalidrawAPIRef,
        username,
        apiReady,
    );

    const getSelectedBoardElement = useCallback(() => {
        const selectedIds = Object.keys(selectedElementIds || {});

        if (selectedIds.length !== 1) {
            return null;
        }

        const selectedId = selectedIds[0];
        const elements = getSceneElements();

        return elements.find((element) => element.id === selectedId) || null;
    }, [selectedElementIds, getSceneElements]);

    const selectedBoardElement = useMemo(() => {
        return getSelectedBoardElement();
    }, [getSelectedBoardElement]);

    const selectedInternalLink = selectedBoardElement?.customData?.internalLink;

    const handleCopySelectedElementAnchor = useCallback(() => {
        const selectedElement = getSelectedBoardElement();

        if (!selectedElement) {
            setCopiedElementNotice("Сначала выберите один элемент на доске.");
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
                "Элемент доски",

            elementType: selectedElement.type,
            copiedAt: Date.now(),
        };

        saveBoardElementAnchor(anchor);
        setCopiedElementNotice("Ссылка на элемент доски скопирована.");
    }, [getSelectedBoardElement, tab]);

    const handleAttachTextBlockLinkToSelectedElement = useCallback(() => {
        const selectedElement = getSelectedBoardElement();

        if (!selectedElement) {
            setCopiedElementNotice("Сначала выберите один элемент на доске.");
            return;
        }

        const textAnchor = getTextBlockAnchor();

        if (!textAnchor || textAnchor.anchorType !== "text-block") {
            setCopiedElementNotice(
                "Сначала скопируйте ссылку на абзац в текстовом редакторе.",
            );
            return;
        }

        const updatedElement = {
            ...selectedElement,
            customData: {
                ...(selectedElement.customData || {}),
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

        updateBoardElement(updatedElement);

        clearTextBlockAnchor();
        setCopiedElementNotice("Ссылка на абзац прикреплена к элементу доски.");
    }, [getSelectedBoardElement, updateBoardElement]);

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
        if (!apiReady || !synced || !location.state) {
            return;
        }

        if (location.state.targetAnchorType !== "board-element") {
            return;
        }

        const targetAnchorId = location.state.targetAnchorId;

        if (!targetAnchorId) {
            return;
        }

        const elements = getSceneElements();

        const targetElement = elements.find(
            (element) => element.id === targetAnchorId,
        );

        if (!targetElement) {
            return;
        }

        selectElement(targetElement.id);
        scrollToElement(targetElement);
    }, [
        apiReady,
        synced,
        location.state,
        getSceneElements,
        selectElement,
        scrollToElement,
    ]);

    if (syncError) {
        return (
            <div className="card">
                ⚠️ {syncError}. Попробуйте подключиться повторно.
            </div>
        );
    }

    if (!provider || !synced) {
        return <div className="card">🔄 Загрузка состояния доски...</div>;
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
                    {connected ? "Подключено" : "Нет подключения"}
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
                            Копировать ссылку на элемент
                        </button>

                        <button
                            type="button"
                            className="button button--secondary board-link-tools__button"
                            onClick={handleAttachTextBlockLinkToSelectedElement}
                        >
                            Прикрепить ссылку на абзац
                        </button>

                        {selectedInternalLink && (
                            <button
                                type="button"
                                className="button button--secondary board-link-tools__button"
                                onClick={handleOpenLinkedParagraph}
                            >
                                Открыть связанный абзац
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="editor-shell__body editor-shell__body--board">
                <Excalidraw
                    langCode="ru-RU"
                    theme="dark"
                    viewModeEnabled={!canEdit}
                    onPointerUpdate={onPointerUpdate}
                    excalidrawAPI={handleApiReady}
                    onChange={handleChange}
                />
            </div>
        </section>
    );
};

export default BoardEditor;
