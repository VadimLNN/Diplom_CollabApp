import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../app/providers/authContext";
import { saveBoardElementAnchor } from "../../../shared/links/boardElementClipboard";
import {
    clearTextBlockAnchor,
    getTextBlockAnchor,
} from "../../../shared/links/textBlockClipboard";
import { getCollaborationUser } from "../../../shared/realtime/collaborationUser";
import { useHocusProvider } from "../../../shared/realtime/getHocusProvider";
import { addInlineTabLink } from "../../../shared/realtime/linkIndex";
import LinkActionsMenu from "../link-actions/LinkActionsMenu";
import { useBoardAwareness } from "./useBoardAwareness";
import { useBoardCollaboration } from "./useBoardCollaboration";

const BoardEditor = ({ tab, canEdit, projectTabs = [] }) => {
    const {
        provider,
        connected,
        synced,
        error: syncError,
    } = useHocusProvider(tab);

    const location = useLocation();
    const navigate = useNavigate();
    const { projectId } = useParams();
    const { user } = useAuth();
    const collaborationUser = useMemo(
        () => getCollaborationUser(user),
        [user],
    );

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

    const { handlePointerUpdate: onPointerUpdate } = useBoardAwareness(
        provider,
        excalidrawAPIRef,
        collaborationUser,
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

    const handleAttachTabLinkToSelectedElement = useCallback(
        (targetTab) => {
            const selectedElement = getSelectedBoardElement();

            if (!provider || !selectedElement || !targetTab) {
                return;
            }

            const link = addInlineTabLink({
                ydoc: provider.document,
                sourceTab: tab,
                targetTab,
                sourceType: "board",
            });

            if (!link) {
                return;
            }

            updateBoardElement({
                ...selectedElement,
                customData: {
                    ...(selectedElement.customData || {}),
                    internalLink: {
                        ...link.target,
                        linkId: link.id,
                        linkedAt: Date.now(),
                    },
                },
            });

            setCopiedElementNotice(
                `Ссылка на вкладку «${targetTab.title}» прикреплена.`,
            );
        },
        [getSelectedBoardElement, provider, tab, updateBoardElement],
    );

    const handleOpenInternalLink = useCallback(() => {
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

                {canEdit && selectedBoardElement && (
                    <div className="board-link-tools">
                        {copiedElementNotice && (
                            <span className="board-link-tools__notice">
                                {copiedElementNotice}
                            </span>
                        )}

                        <LinkActionsMenu
                            currentTab={tab}
                            projectTabs={projectTabs}
                            onSelectTab={handleAttachTabLinkToSelectedElement}
                            tabActionLabel="Прикрепить ссылку на вкладку"
                            actions={[
                                {
                                    id: "copy-board-element",
                                    label: "Копировать ссылку на элемент",
                                    onSelect: handleCopySelectedElementAnchor,
                                },
                                {
                                    id: "attach-text-block",
                                    label: "Прикрепить ссылку на абзац",
                                    onSelect:
                                        handleAttachTextBlockLinkToSelectedElement,
                                },
                                ...(selectedInternalLink
                                    ? [
                                          {
                                              id: "open-internal-link",
                                              label:
                                                  selectedInternalLink.anchorType ===
                                                  "tab"
                                                      ? "Открыть связанную вкладку"
                                                      : "Открыть связанный абзац",
                                              onSelect:
                                                  handleOpenInternalLink,
                                          },
                                      ]
                                    : []),
                            ]}
                        />
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
