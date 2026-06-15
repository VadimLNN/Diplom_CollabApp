import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";

import { useAuth } from "../../../../app/providers/authContext";
import { getCollaborationUser } from "../../../../shared/realtime/collaborationUser";
import { useHocusProvider } from "../../../../shared/realtime/getHocusProvider";
import EditorToolbar from "./EditorToolbar";

import {
    addInlineTabLink,
    addTextBlockToBoardElementLink,
    addTextBlockToTextBlockLink,
} from "../../../../shared/realtime/linkIndex";

import {
    clearBoardElementAnchor,
    getBoardElementAnchor,
} from "../../../../shared/links/boardElementClipboard";

import {
    clearTextBlockAnchor,
    getTextBlockAnchor,
    saveTextBlockAnchor,
} from "../../../../shared/links/textBlockClipboard";

import BlockIdExtension from "../extensions/BlockIdExtension";
import InternalLinkNode from "../extensions/InternalLinkNode";
import { getCurrentTextBlock } from "../utils/getCurrentTextBlock";

import LinkActionsMenu from "../../link-actions/LinkActionsMenu";

const TextEditorReady = ({
    provider,
    connected,
    canEdit,
    tab,
    projectTabs = [],
}) => {
    const location = useLocation();
    const { user } = useAuth();
    const collaborationUser = useMemo(
        () => getCollaborationUser(user),
        [user],
    );

    const editor = useEditor(
        {
            immediatelyRender: false,
            editable: canEdit,

            extensions: [
                StarterKit.configure({
                    history: false,
                }),

                Underline,

                TextAlign.configure({
                    types: ["heading", "paragraph"],
                }),

                Image.configure({
                    inline: false,
                    allowBase64: true,
                }),

                Placeholder.configure({
                    placeholder: "Начните писать вместе...",
                }),

                BlockIdExtension,

                InternalLinkNode,

                Collaboration.configure({
                    document: provider.document,
                }),

                CollaborationCaret.configure({
                    provider,
                    user: collaborationUser,
                    selectionRender: (remoteUser) => ({
                        nodeName: "span",
                        class: "collaboration-carets__selection",
                        style: `background-color: ${remoteUser.color}38`,
                    }),
                }),
            ],

            editorProps: {
                attributes: {
                    class: "editor-shell__content",
                },
            },
        },
        [provider, collaborationUser],
    );

    useEffect(() => {
        if (!editor) {
            return;
        }

        editor.setEditable(canEdit);
    }, [editor, canEdit]);

    useEffect(() => {
        if (!editor) {
            return;
        }

        if (location.state?.targetAnchorType !== "text-block") {
            return;
        }

        const targetBlockId = location.state.targetAnchorId;

        if (!targetBlockId) {
            return;
        }

        const frameId = requestAnimationFrame(() => {
            const element = editor.view.dom.querySelector(
                `[data-block-id="${targetBlockId}"]`,
            );

            if (!element) {
                return;
            }

            element.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });

            element.classList.add("text-block--highlighted");

            window.setTimeout(() => {
                element.classList.remove("text-block--highlighted");
            }, 1600);
        });

        return () => {
            cancelAnimationFrame(frameId);
        };
    }, [editor, location.state]);

    const handleInsertTabLink = (targetTab) => {
        if (!editor || !canEdit || !targetTab) {
            return;
        }

        const link = addInlineTabLink({
            ydoc: provider.document,
            sourceTab: tab,
            targetTab,
            sourceType: "text",
        });

        if (!link) {
            return;
        }

        editor
            .chain()
            .focus()
            .insertInternalLink({
                linkId: link.id,

                targetTabId: link.target.tabId,
                targetTabType: link.target.tabType,

                targetAnchorType: link.target.anchorType,
                targetAnchorId: link.target.anchorId,

                targetLabel: link.target.label,
            })
            .run();
    };

    const handleInsertBoardElementLink = () => {
        if (!editor || !canEdit) {
            return;
        }

        const copiedAnchor = getBoardElementAnchor();

        if (!copiedAnchor || copiedAnchor.anchorType !== "board-element") {
            alert(
                "Сначала выделите элемент на доске и нажмите «Копировать ссылку на элемент».",
            );
            return;
        }

        const currentBlock = getCurrentTextBlock(editor);

        if (!currentBlock?.blockId) {
            alert("Поставь курсор внутрь абзаца или заголовка.");
            return;
        }

        const targetBoardTab = {
            id: copiedAnchor.tabId,
            title: copiedAnchor.tabTitle,
            type: "board",
        };

        const targetElement = {
            id: copiedAnchor.anchorId,
            type: copiedAnchor.elementType,
            text: copiedAnchor.label,
            customData: {
                label: copiedAnchor.label,
            },
        };

        const link = addTextBlockToBoardElementLink({
            ydoc: provider.document,
            sourceTab: tab,
            sourceBlock: currentBlock,
            targetBoardTab,
            targetElement,
        });

        if (!link) {
            return;
        }

        editor
            .chain()
            .focus()
            .insertInternalLink({
                linkId: link.id,

                targetTabId: link.target.tabId,
                targetTabType: link.target.tabType,

                targetAnchorType: link.target.anchorType,
                targetAnchorId: link.target.anchorId,

                targetLabel: link.target.label,
            })
            .run();

        clearBoardElementAnchor();
    };

    const handleCopyCurrentParagraphLink = () => {
        if (!editor || !canEdit) {
            return;
        }

        const currentBlock = getCurrentTextBlock(editor);

        if (!currentBlock?.blockId) {
            alert("Поставь курсор внутрь абзаца или заголовка.");
            return;
        }

        const label =
            currentBlock.text?.trim().slice(0, 100) ||
            tab.title ||
            "Текстовый абзац";

        const anchor = {
            tabId: tab.id,
            tabTitle: tab.title,
            tabType: "text",

            anchorType: "text-block",
            anchorId: currentBlock.blockId,

            label,
            blockType: currentBlock.type,
            copiedAt: Date.now(),
        };

        saveTextBlockAnchor(anchor);

        alert("Ссылка на абзац скопирована.");
    };

    const handleInsertTextBlockLink = () => {
        if (!editor || !canEdit) {
            return;
        }

        const copiedAnchor = getTextBlockAnchor();

        if (!copiedAnchor || copiedAnchor.anchorType !== "text-block") {
            alert(
                "Сначала скопируйте абзац через «Копировать ссылку на абзац».",
            );
            return;
        }

        const currentBlock = getCurrentTextBlock(editor);

        if (!currentBlock?.blockId) {
            alert("Поставь курсор внутрь абзаца или заголовка.");
            return;
        }

        if (
            String(copiedAnchor.tabId) === String(tab.id) &&
            String(copiedAnchor.anchorId) === String(currentBlock.blockId)
        ) {
            alert("Нельзя сослаться на тот же самый абзац.");
            return;
        }

        const targetTextTab = {
            id: copiedAnchor.tabId,
            title: copiedAnchor.tabTitle,
            type: "text",
        };

        const targetBlock = {
            blockId: copiedAnchor.anchorId,
            label: copiedAnchor.label,
            text: copiedAnchor.label,
            type: copiedAnchor.blockType,
        };

        const link = addTextBlockToTextBlockLink({
            ydoc: provider.document,
            sourceTab: tab,
            sourceBlock: currentBlock,
            targetTextTab,
            targetBlock,
        });

        if (!link) {
            return;
        }

        editor
            .chain()
            .focus()
            .insertInternalLink({
                linkId: link.id,

                targetTabId: link.target.tabId,
                targetTabType: link.target.tabType,

                targetAnchorType: link.target.anchorType,
                targetAnchorId: link.target.anchorId,

                targetLabel: link.target.label,
            })
            .run();

        clearTextBlockAnchor();
    };

    if (!editor) {
        return <div className="card">🔄 Инициализация редактора...</div>;
    }

    return (
        <section className="editor-shell editor-shell--text">
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
                    <div className="editor-link-actions">
                        <LinkActionsMenu
                            currentTab={tab}
                            projectTabs={projectTabs}
                            onSelectTab={handleInsertTabLink}
                            actions={[
                                {
                                    id: "insert-board-element",
                                    label: "Вставить ссылку на элемент доски",
                                    onSelect: handleInsertBoardElementLink,
                                },
                                {
                                    id: "insert-text-block",
                                    label: "Вставить ссылку на абзац",
                                    onSelect: handleInsertTextBlockLink,
                                },
                                {
                                    id: "copy-text-block",
                                    label: "Копировать ссылку на абзац",
                                    onSelect: handleCopyCurrentParagraphLink,
                                },
                            ]}
                        />
                    </div>
                )}
            </div>

            {canEdit && (
                <div className="editor-shell__toolbar">
                    <EditorToolbar editor={editor} />
                </div>
            )}

            <div className="editor-shell__body">
                <EditorContent editor={editor} />
            </div>
        </section>
    );
};

const TextEditor = ({ tab, canEdit, projectTabs = [] }) => {
    const { provider, connected, synced, error } = useHocusProvider(tab);

    if (error) {
        return (
            <div className="card">
                ⚠️ {error}. Попробуйте подключиться повторно.
            </div>
        );
    }

    if (!provider || !synced) {
        return <div className="card">🔄 Загрузка документа...</div>;
    }

    return (
        <TextEditorReady
            provider={provider}
            connected={connected}
            canEdit={canEdit}
            tab={tab}
            projectTabs={projectTabs}
        />
    );
};

export default TextEditor;
