const jwt = require("jsonwebtoken");
const pool = require("../db");

function verifyToken(token) {
    if (!token) {
        throw new Error("Missing realtime auth token");
    }

    return jwt.verify(token, process.env.JWT_SECRET);
}

async function getUserRoleForDocument(documentName, userId) {
    const { rows } = await pool.query(
        `
        SELECT
            t.id AS tab_id,
            t.project_id,
            p.owner_id,
            COALESCE(pp.role, NULL) AS permission_role
        FROM tabs t
        JOIN projects p ON p.id = t.project_id
        LEFT JOIN project_permissions pp
            ON pp.project_id = p.id
           AND pp.user_id = $2
        WHERE t.ydoc_document_name = $1
        LIMIT 1
        `,
        [documentName, userId],
    );

    const row = rows[0];

    if (!row) {
        throw new Error("Realtime document not found");
    }

    if (Number(row.owner_id) === Number(userId)) {
        return {
            role: "owner",
            tabId: row.tab_id,
            projectId: row.project_id,
            canRead: true,
            canWrite: true,
        };
    }

    if (row.permission_role === "editor") {
        return {
            role: "editor",
            tabId: row.tab_id,
            projectId: row.project_id,
            canRead: true,
            canWrite: true,
        };
    }

    if (row.permission_role === "viewer") {
        return {
            role: "viewer",
            tabId: row.tab_id,
            projectId: row.project_id,
            canRead: true,
            canWrite: false,
        };
    }

    throw new Error("No access to realtime document");
}

async function getCollabAccess({ token, documentName }) {
    const decoded = verifyToken(token);

    const userId = decoded.id;

    if (!userId) {
        throw new Error("Invalid realtime auth token");
    }

    const access = await getUserRoleForDocument(documentName, userId);

    return {
        user: {
            id: userId,
            username: decoded.username,
        },
        ...access,
    };
}

module.exports = {
    getCollabAccess,
};
