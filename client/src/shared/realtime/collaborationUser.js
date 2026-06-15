const COLLABORATION_COLORS = [
    "#f97316",
    "#84cc16",
    "#8b5cf6",
    "#ec4899",
    "#3b82f6",
    "#14b8a6",
    "#d946ef",
    "#06b6d4",
];

function hashValue(value) {
    const input = String(value ?? "");
    let hash = 0;

    for (let index = 0; index < input.length; index += 1) {
        hash = (hash * 31 + input.charCodeAt(index)) | 0;
    }

    return Math.abs(hash);
}

export function getCollaborationUser(user) {
    const identity = user?.id ?? user?.username ?? "anonymous";
    const color =
        COLLABORATION_COLORS[
            hashValue(identity) % COLLABORATION_COLORS.length
        ];

    return {
        id: user?.id ?? null,
        name: user?.username || "Пользователь",
        color,
    };
}
