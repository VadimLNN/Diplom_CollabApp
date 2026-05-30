const STORAGE_KEY = "collabapp:selected-text-block-anchor";

export function saveTextBlockAnchor(anchor) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(anchor));
}

export function getTextBlockAnchor() {
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

export function clearTextBlockAnchor() {
    localStorage.removeItem(STORAGE_KEY);
}
