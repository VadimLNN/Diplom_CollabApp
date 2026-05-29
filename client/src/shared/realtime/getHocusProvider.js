import { HocuspocusProvider } from "@hocuspocus/provider";

const providerCache = new Map();

function getProviderKey(tabId, docName) {
    return `${tabId}:${docName}`;
}

export function getHocusProvider(tabId, docName) {
    if (!tabId || !docName) return null;

    const key = getProviderKey(tabId, docName);

    if (!providerCache.has(key)) {
        const provider = new HocuspocusProvider({
            url: import.meta.env.VITE_WS_URL,
            name: docName,
        });

        providerCache.set(key, provider);
    }

    return providerCache.get(key);
}

export function destroyHocusProvider(tabId, docName) {
    const key = getProviderKey(tabId, docName);
    const provider = providerCache.get(key);

    if (!provider) return;

    provider.destroy();
    providerCache.delete(key);
}
