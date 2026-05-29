// src/features/tabs/editor/ui/TabEditor.jsx
import { HocuspocusProvider } from "@hocuspocus/provider";
import Collaboration from "@tiptap/extension-collaboration";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useMemo, useState } from "react";
import EditorToolbar from "./EditorToolbar";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";

const providerCache = new Map();

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

const TextEditor = ({ tab }) => {
    const [connected, setConnected] = useState(false);

    const provider = useMemo(() => {
        if (!tab?.ydoc_document_name) return null;
        return getProvider(tab.id, tab.ydoc_document_name);
    }, [tab?.id, tab?.ydoc_document_name]);

    useEffect(() => {
        if (!provider) return;

        const handleStatus = ({ status }) => {
            setConnected(status === "connected");
            console.log("Hocuspocus status:", status);
        };

        provider.on("status", handleStatus);

        return () => {
            provider.off("status", handleStatus);
        };
    }, [provider]);

    const editor = useEditor(
        provider
            ? {
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
              }
            : null,
    );

    if (!editor) {
        return <div className="card">🔄 Initializing editor...</div>;
    }

    return (
        <section className="editor-shell editor-shell--text">
            <div className="editor-shell__meta">
                <span
                    className={`status-chip ${connected ? "status-chip--success" : "status-chip--danger"}`}
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

export default TextEditor;
