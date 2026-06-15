const { Server } = require("@hocuspocus/server");
const { Database } = require("@hocuspocus/extension-database");
const Y = require("yjs");

const pool = require("../db");
const logger = require("../utils/logger");
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
        logger.warn({ err: error }, "Invalid Yjs document state");
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
                    logger.info({ documentName }, "Creating Yjs document");
                    return null;
                }

                const buffer = Buffer.from(row.ydoc_data);

                if (!isValidYjsState(buffer)) {
                    logger.warn(
                        { documentName, byteLength: buffer.length },
                        "Removing corrupted Yjs document",
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

                logger.info(
                    { documentName, byteLength: buffer.length },
                    "Loaded Yjs document",
                );
                return buffer;
            },

            store: async ({ documentName, state }) => {
                const buffer = Buffer.from(state || []);

                if (!isValidYjsState(buffer)) {
                    logger.warn(
                        { documentName, byteLength: buffer.length },
                        "Skipped invalid Yjs state",
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

                logger.info(
                    {
                        documentName,
                        version: saved.version,
                        byteLength: saved.byte_length,
                    },
                    "Stored Yjs document",
                );
            },
        }),
    ],

    async onAuthenticate(data) {
        const access = await getCollabAccess({
            token: data.token,
            documentName: data.documentName,
        });

        logger.info(
            {
                documentName: data.documentName,
                userId: access.user.id,
                role: access.role,
                canWrite: access.canWrite,
            },
            "Realtime access granted",
        );

        data.connection.readOnly = !access.canWrite;

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
