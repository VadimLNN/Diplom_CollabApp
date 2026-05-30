const STORAGE_KEY = "collabapp:selected-board-element-anchor";

export function saveBoardElementAnchor(anchor) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(anchor));
}

export function getBoardElementAnchor() {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch {
        localStorage.removeItem(STORAGE_KEY);
        return null;
    }
}

export function clearBoardElementAnchor() {
    localStorage.removeItem(STORAGE_KEY);
}
