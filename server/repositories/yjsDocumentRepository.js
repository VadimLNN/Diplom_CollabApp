const pool = require("../db");
const logger = require("../utils/logger");

class YjsDocumentRepository {
    async findSnapshot(documentName) {
        const { rows } = await pool.query(
            `
            SELECT ydoc_data, version, byte_length, updated_at, last_persisted_at
            FROM yjs_documents
            WHERE ydoc_document_name = $1
            `,
            [documentName],
        );

        return rows[0] || null;
    }

    async upsertSnapshot({ documentName, data }) {
        const byteLength = data.length;

        const { rows } = await pool.query(
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
            VALUES ($1, $2, 1, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (ydoc_document_name)
            DO UPDATE SET
                ydoc_data = EXCLUDED.ydoc_data,
                version = yjs_documents.version + 1,
                byte_length = EXCLUDED.byte_length,
                last_persisted_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            RETURNING version, byte_length, updated_at
            `,
            [documentName, data, byteLength],
        );

        return rows[0];
    }

    async logEvent({
        documentName,
        eventType,
        version = null,
        byteLength = null,
        error = null,
    }) {
        try {
            await pool.query(
                `
                INSERT INTO yjs_document_save_events (
                    ydoc_document_name,
                    event_type,
                    version,
                    byte_length,
                    error_message
                )
                VALUES ($1, $2, $3, $4, $5)
                `,
                [
                    documentName,
                    eventType,
                    version,
                    byteLength,
                    error ? String(error.message || error) : null,
                ],
            );
        } catch (err) {
            logger.error(
                { err, documentName, eventType },
                "Failed to write Yjs save event",
            );
        }
    }
}

module.exports = new YjsDocumentRepository();
