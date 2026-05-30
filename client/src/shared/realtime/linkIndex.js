export const LINK_ORIGIN = "local-link-change";

export function getLinksMap(ydoc) {
    if (!ydoc) {
        return null;
    }

    return ydoc.getMap("links");
}

export function createLinkId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return `link_${crypto.randomUUID()}`;
    }

    return `link_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function addInlineTabLink({
    ydoc,
    sourceTab,
    targetTab,
    sourceType = "text",
}) {
    const linksMap = getLinksMap(ydoc);

    if (!linksMap || !sourceTab || !targetTab) {
        return null;
    }

    const linkId = createLinkId();

    const link = {
        id: linkId,

        source: {
            tabId: sourceTab.id,
            tabTitle: sourceTab.title,
            tabType: sourceTab.type,
            anchorType: "tab",
            anchorId: sourceTab.id,
            label: sourceTab.title,
        },

        target: {
            tabId: targetTab.id,
            tabTitle: targetTab.title,
            tabType: targetTab.type,
            anchorType: "tab",
            anchorId: targetTab.id,
            label: targetTab.title,
        },

        sourceType,
        createdAt: Date.now(),
    };

    ydoc.transact(() => {
        linksMap.set(linkId, link);
    }, LINK_ORIGIN);

    return link;
}

export function getLinksArray(ydoc) {
    const linksMap = getLinksMap(ydoc);

    if (!linksMap) {
        return [];
    }

    return Array.from(linksMap.values());
}
