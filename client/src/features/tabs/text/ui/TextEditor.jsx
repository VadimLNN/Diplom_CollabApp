import Collaboration from "@tiptap/extension-collaboration";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { useHocusProvider } from "../../../../shared/realtime/getHocusProvider";
import EditorToolbar from "./EditorToolbar";

import { addInlineTabLink } from "../../../../shared/realtime/linkIndex";
import InternalLinkNode from "../extensions/InternalLinkNode";
import InternalLinkPicker from "./InternalLinkPicker";

const TextEditorReady = ({
    provider,
    connected,
    canEdit,
    tab,
    projectTabs = [],
}) => {
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
                    placeholder: "Start writing together...",
                }),

                InternalLinkNode,

                Collaboration.configure({
                    document: provider.document,
                }),
            ],

            editorProps: {
                attributes: {
                    class: "editor-shell__content",
                },
            },
        },
        [provider],
    );

    const availableTargetTabs = projectTabs.filter(
        (projectTab) => projectTab.id !== tab.id,
    );

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

    if (!editor) {
        return <div className="card">🔄 Initializing editor...</div>;
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
                    {connected ? "Connected" : "Disconnected"}
                </span>

                {canEdit && (
                    <InternalLinkPicker
                        currentTab={tab}
                        projectTabs={projectTabs}
                        disabled={!editor}
                        onSelect={handleInsertTabLink}
                    />
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
        return <div className="card">⚠️ {error}. Try reconnecting.</div>;
    }

    if (!provider || !synced) {
        return <div className="card">🔄 Loading document state...</div>;
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
