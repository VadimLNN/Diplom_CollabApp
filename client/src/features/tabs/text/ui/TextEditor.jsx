import Collaboration from "@tiptap/extension-collaboration";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { useHocusProvider } from "../../../../shared/realtime/getHocusProvider";
import EditorToolbar from "./EditorToolbar";

const TextEditorReady = ({ provider, connected }) => {
    const editor = useEditor(
        {
            immediatelyRender: false,

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

    if (!editor) {
        return <div className="card">🔄 Initializing editor...</div>;
    }

    return (
        <section className="editor-shell editor-shell--text">
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

            <div className="editor-shell__toolbar">
                <EditorToolbar editor={editor} />
            </div>

            <div className="editor-shell__body">
                <EditorContent editor={editor} />
            </div>
        </section>
    );
};

const TextEditor = ({ tab }) => {
    const { provider, connected, synced, error } = useHocusProvider(tab);

    if (error) {
        return <div className="card">⚠️ {error}. Try reconnecting.</div>;
    }

    if (!provider || !synced) {
        return <div className="card">🔄 Loading document state...</div>;
    }

    return <TextEditorReady provider={provider} connected={connected} />;
};

export default TextEditor;
