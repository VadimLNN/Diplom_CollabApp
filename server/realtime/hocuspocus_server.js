const { Server } = require("@hocuspocus/server");
const { Database } = require("@hocuspocus/extension-database");
const Y = require("yjs");

const pool = require("../db");
const { getCollabAccess } = require("../services/collabAccessService");

function isValidYjsState(state) {
    if (!state) {
        return false;
    }

    const buffer = Buffer.from(state);

    if (buffer.length < 2) {
        return false;
    }

    try {
        const doc = new Y.Doc();
        Y.applyUpdate(doc, buffer);
        doc.destroy();
        return true;
    } catch (error) {
        console.warn("[Yjs] Invalid document state:", error.message);
        return false;
    }
}

const hocuspocusServer = new Server({
    port: null,
    path: "/api/collab",

    extensions: [
        new Database({
            fetch: async ({ documentName }) => {
                const result = await pool.query(
                    `
                    SELECT ydoc_data
                    FROM yjs_documents
                    WHERE ydoc_document_name = $1
                    `,
                    [documentName],
                );

                const row = result.rows[0];

                if (!row || !row.ydoc_data) {
                    console.log("📄 Creating new Yjs doc:", documentName);
                    return null;
                }

                const buffer = Buffer.from(row.ydoc_data);

                if (!isValidYjsState(buffer)) {
                    console.warn(
                        "⚠️ Found corrupted Yjs doc, deleting and creating new:",
                        documentName,
                        buffer.length,
                    );

                    await pool.query(
                        `
                        DELETE FROM yjs_documents
                        WHERE ydoc_document_name = $1
                        `,
                        [documentName],
                    );

                    return null;
                }

                console.log("📄 Loaded Yjs doc:", documentName, buffer.length);
                return buffer;
            },

            store: async ({ documentName, state }) => {
                const buffer = Buffer.from(state || []);

                if (!isValidYjsState(buffer)) {
                    console.warn(
                        "⚠️ Skip storing invalid Yjs state:",
                        documentName,
                        buffer.length,
                    );
                    return;
                }

                const result = await pool.query(
                    `
                    INSERT INTO yjs_documents (
                        ydoc_document_name,
                        ydoc_data,
                        version,
                        byte_length,
                        last_persisted_at,
                        created_at,
                        updated_at
                    )
                    VALUES ($1, $2, 1, $3, NOW(), NOW(), NOW())
                    ON CONFLICT (ydoc_document_name)
                    DO UPDATE SET
                        ydoc_data = EXCLUDED.ydoc_data,
                        version = yjs_documents.version + 1,
                        byte_length = EXCLUDED.byte_length,
                        last_persisted_at = NOW(),
                        updated_at = NOW()
                    RETURNING version, byte_length
                    `,
                    [documentName, buffer, buffer.length],
                );

                const saved = result.rows[0];

                console.log(
                    "💾 Stored Yjs doc:",
                    documentName,
                    "version:",
                    saved.version,
                    "bytes:",
                    saved.byte_length,
                );
            },
        }),
    ],

    async onAuthenticate(data) {
        const access = await getCollabAccess({
            token: data.token,
            documentName: data.documentName,
        });

        console.log(
            "🔐 REALTIME AUTH",
            data.documentName,
            "user:",
            access.user.id,
            "role:",
            access.role,
            "canWrite:",
            access.canWrite,
        );

        return {
            user: access.user,
            role: access.role,
            projectId: access.projectId,
            tabId: access.tabId,
            canWrite: access.canWrite,
        };
    },
});

module.exports = hocuspocusServer;
