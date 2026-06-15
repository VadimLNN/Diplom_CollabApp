const { randomUUID } = require("crypto");
const pool = require("../db");

class TabRepository {
    async findByProjectId(projectId) {
        const { rows } = await pool.query(
            `SELECT id, title, description, type, ydoc_document_name, created_at, updated_at
             FROM tabs WHERE project_id = $1 ORDER BY created_at ASC`,
            [projectId],
        );
        return rows;
    }

    async findById(tabId) {
        const { rows } = await pool.query(
            `SELECT id, title, description, type, ydoc_document_name, project_id, created_at, updated_at
             FROM tabs WHERE id = $1`,
            [tabId],
        );
        return rows[0];
    }

    async create({ projectId, title, description, type }) {
        const tabId = randomUUID();
        const ydocDocumentName = `tab.${tabId}`;
        const { rows } = await pool.query(
            `INSERT INTO tabs (
                id,
                project_id,
                title,
                description,
                type,
                ydoc_document_name,
                created_at,
                updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            RETURNING *`,
            [tabId, projectId, title, description, type, ydocDocumentName],
        );

        return rows[0];
    }

    async update(tabId, { title, description, type }) {
        const { rows } = await pool.query(
            `UPDATE tabs
             SET title = $1,
                 description = $2,
                 type = $3,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4 RETURNING *`,
            [title, description, type, tabId],
        );
        return rows[0];
    }

    async delete(tabId) {
        const { rowCount } = await pool.query(
            "DELETE FROM tabs WHERE id = $1",
            [tabId],
        );

        return rowCount > 0;
    }
}

module.exports = new TabRepository();
