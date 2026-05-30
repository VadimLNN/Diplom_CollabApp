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

export function addTextBlockToBoardElementLink({
    ydoc,
    sourceTab,
    sourceBlock,
    targetBoardTab,
    targetElement,
}) {
    const linksMap = getLinksMap(ydoc);

    if (
        !linksMap ||
        !sourceTab ||
        !sourceBlock ||
        !targetBoardTab ||
        !targetElement
    ) {
        return null;
    }

    const linkId = createLinkId();

    const elementLabel =
        targetElement.customData?.label ||
        targetElement.text ||
        targetElement.type ||
        "Board element";

    const blockLabel =
        sourceBlock.text?.trim().slice(0, 80) ||
        sourceTab.title ||
        "Text block";

    const link = {
        id: linkId,

        source: {
            tabId: sourceTab.id,
            tabTitle: sourceTab.title,
            tabType: "text",
            anchorType: "text-block",
            anchorId: sourceBlock.blockId,
            label: blockLabel,
        },

        target: {
            tabId: targetBoardTab.id,
            tabTitle: targetBoardTab.title,
            tabType: "board",
            anchorType: "board-element",
            anchorId: targetElement.id,
            label: elementLabel,
        },

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

export function addTextBlockToTextBlockLink({
    ydoc,
    sourceTab,
    sourceBlock,
    targetTextTab,
    targetBlock,
}) {
    const linksMap = getLinksMap(ydoc);

    if (
        !linksMap ||
        !sourceTab ||
        !sourceBlock ||
        !targetTextTab ||
        !targetBlock
    ) {
        return null;
    }

    const linkId = createLinkId();

    const sourceLabel =
        sourceBlock.text?.trim().slice(0, 80) ||
        sourceTab.title ||
        "Text block";

    const targetLabel =
        targetBlock.label?.trim().slice(0, 80) ||
        targetBlock.text?.trim().slice(0, 80) ||
        targetTextTab.title ||
        "Text block";

    const link = {
        id: linkId,

        source: {
            tabId: sourceTab.id,
            tabTitle: sourceTab.title,
            tabType: "text",
            anchorType: "text-block",
            anchorId: sourceBlock.blockId,
            label: sourceLabel,
        },

        target: {
            tabId: targetTextTab.id,
            tabTitle: targetTextTab.title,
            tabType: "text",
            anchorType: "text-block",
            anchorId: targetBlock.blockId,
            label: targetLabel,
        },

        createdAt: Date.now(),
    };

    ydoc.transact(() => {
        linksMap.set(linkId, link);
    }, LINK_ORIGIN);

    return link;
}
