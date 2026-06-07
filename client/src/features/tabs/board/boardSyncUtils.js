export const cloneElement = (element) => ({
    ...element,
    customData: element.customData
        ? {
              ...element.customData,
          }
        : undefined,
});

export const getElementOrder = (elements) => {
    return elements.map((element) => element.id);
};

export const buildElementsFromYjs = (elementsMap, orderArray) => {
    const ids = orderArray.toArray();
    const orderedElements = [];

    const usedIds = new Set();

    for (const id of ids) {
        const element = elementsMap.get(id);

        if (element) {
            orderedElements.push(cloneElement(element));
            usedIds.add(id);
        }
    }

    elementsMap.forEach((element, id) => {
        if (!usedIds.has(id)) {
            orderedElements.push(cloneElement(element));
        }
    });

    return orderedElements;
};

export const getChangedElements = (previousMap, nextElements) => {
    const changed = [];

    for (const element of nextElements) {
        const previous = previousMap.get(element.id);

        if (!previous) {
            changed.push(element);
            continue;
        }

        if (previous.version !== element.version) {
            changed.push(element);
            continue;
        }

        if (previous.versionNonce !== element.versionNonce) {
            changed.push(element);
        }
    }

    return changed;
};

export const shouldUseRemoteElement = ({
    localElement,
    remoteElement,
    localEditTimes,
    localEditGraceMs,
}) => {
    if (!localElement) {
        return true;
    }

    const lastLocalEditAt = localEditTimes.get(remoteElement.id);

    if (lastLocalEditAt && Date.now() - lastLocalEditAt < localEditGraceMs) {
        return false;
    }

    if ((remoteElement.version || 0) > (localElement.version || 0)) {
        return true;
    }

    if (
        remoteElement.version === localElement.version &&
        remoteElement.versionNonce !== localElement.versionNonce
    ) {
        return true;
    }

    return false;
};

export const mergeElements = ({
    localElements,
    remoteElements,
    localEditTimes,
    localEditGraceMs,
}) => {
    const mergedMap = new Map();

    for (const element of localElements) {
        mergedMap.set(element.id, cloneElement(element));
    }

    for (const remoteElement of remoteElements) {
        const localElement = mergedMap.get(remoteElement.id);

        if (
            shouldUseRemoteElement({
                localElement,
                remoteElement,
                localEditTimes,
                localEditGraceMs,
            })
        ) {
            mergedMap.set(remoteElement.id, cloneElement(remoteElement));
        }
    }

    const remoteOrder = remoteElements.map((element) => element.id);
    const localOnly = localElements
        .filter((element) => !remoteOrder.includes(element.id))
        .map((element) => element.id);

    const finalOrder = [...remoteOrder, ...localOnly];

    return finalOrder.map((id) => mergedMap.get(id)).filter(Boolean);
};

export const syncOrderArray = (orderArray, nextOrder) => {
    const currentOrder = orderArray.toArray();

    if (
        currentOrder.length === nextOrder.length &&
        currentOrder.every((id, index) => id === nextOrder[index])
    ) {
        return;
    }

    orderArray.delete(0, orderArray.length);
    orderArray.push(nextOrder);
};
