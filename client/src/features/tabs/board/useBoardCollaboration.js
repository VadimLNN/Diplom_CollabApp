import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    buildElementsFromYjs,
    cloneElement,
    getChangedElements,
    getElementOrder,
    mergeElements,
    syncOrderArray,
} from "./boardSyncUtils";

const LOCAL_ORIGIN = "local-excalidraw-element-change";
const LOCAL_EDIT_GRACE_MS = 300;
const SYNC_DEBOUNCE_MS = 150;

export const useBoardCollaboration = ({
    provider,
    synced,
    canEdit,
    onSelectionChange,
}) => {
    const [apiReady, setApiReady] = useState(false);

    const excalidrawAPIRef = useRef(null);

    const initialSceneAppliedRef = useRef(false);
    const applyingRemoteRef = useRef(false);

    const lastSyncedElementsMapRef = useRef(new Map());
    const localEditTimesRef = useRef(new Map());

    const pendingElementsRef = useRef(null);
    const pendingSyncTimerRef = useRef(null);
    const remoteApplyTimerRef = useRef(null);

    const ydoc = provider?.document;

    const elementsMap = useMemo(() => {
        if (!ydoc) {
            return null;
        }

        return ydoc.getMap("excalidraw_elements");
    }, [ydoc]);

    const orderArray = useMemo(() => {
        if (!ydoc) {
            return null;
        }

        return ydoc.getArray("excalidraw_order");
    }, [ydoc]);

    const handleApiReady = useCallback((api) => {
        excalidrawAPIRef.current = api;
        setApiReady(Boolean(api));
    }, []);

    const applyElementsFromYjs = useCallback(() => {
        const excalidrawAPI = excalidrawAPIRef.current;

        if (!excalidrawAPI || !elementsMap || !orderArray) {
            return false;
        }

        const remoteElements = buildElementsFromYjs(elementsMap, orderArray);

        const localElements = excalidrawAPI.getSceneElements();

        const mergedElements = mergeElements({
            localElements,
            remoteElements,
            localEditTimes: localEditTimesRef.current,
            localEditGraceMs: LOCAL_EDIT_GRACE_MS,
        });

        applyingRemoteRef.current = true;

        excalidrawAPI.updateScene({
            elements: mergedElements,
            commitToHistory: false,
        });

        lastSyncedElementsMapRef.current = new Map(
            remoteElements.map((element) => [
                element.id,
                cloneElement(element),
            ]),
        );

        if (remoteApplyTimerRef.current) {
            clearTimeout(remoteApplyTimerRef.current);
        }

        remoteApplyTimerRef.current = setTimeout(() => {
            applyingRemoteRef.current = false;
        }, 80);

        return true;
    }, [elementsMap, orderArray]);

    useEffect(() => {
        if (
            !synced ||
            !apiReady ||
            !elementsMap ||
            !orderArray ||
            initialSceneAppliedRef.current
        ) {
            return;
        }

        applyElementsFromYjs();
        initialSceneAppliedRef.current = true;
    }, [synced, apiReady, elementsMap, orderArray, applyElementsFromYjs]);

    useEffect(() => {
        if (!elementsMap || !orderArray) {
            return;
        }

        const handleRemoteChange = (event, transaction) => {
            if (transaction.origin === LOCAL_ORIGIN) {
                return;
            }

            if (applyingRemoteRef.current) {
                return;
            }

            applyElementsFromYjs();
        };

        elementsMap.observe(handleRemoteChange);
        orderArray.observe(handleRemoteChange);

        return () => {
            elementsMap.unobserve(handleRemoteChange);
            orderArray.unobserve(handleRemoteChange);
        };
    }, [elementsMap, orderArray, applyElementsFromYjs]);

    const flushPendingElements = useCallback(() => {
        if (
            !ydoc ||
            !elementsMap ||
            !orderArray ||
            !pendingElementsRef.current
        ) {
            pendingSyncTimerRef.current = null;
            return;
        }

        const nextElements = pendingElementsRef.current;
        const changedElements = getChangedElements(
            lastSyncedElementsMapRef.current,
            nextElements,
        );

        if (changedElements.length === 0) {
            pendingElementsRef.current = null;
            pendingSyncTimerRef.current = null;
            return;
        }

        const now = Date.now();

        ydoc.transact(() => {
            for (const element of changedElements) {
                elementsMap.set(element.id, cloneElement(element));
                localEditTimesRef.current.set(element.id, now);
            }

            syncOrderArray(orderArray, getElementOrder(nextElements));
        }, LOCAL_ORIGIN);

        lastSyncedElementsMapRef.current = new Map(
            nextElements.map((element) => [element.id, cloneElement(element)]),
        );

        pendingElementsRef.current = null;
        pendingSyncTimerRef.current = null;
    }, [ydoc, elementsMap, orderArray]);

    const scheduleFlush = useCallback(() => {
        if (pendingSyncTimerRef.current) {
            clearTimeout(pendingSyncTimerRef.current);
        }

        pendingSyncTimerRef.current = setTimeout(() => {
            flushPendingElements();
        }, SYNC_DEBOUNCE_MS);
    }, [flushPendingElements]);

    const handleChange = useCallback(
        (elements, appState) => {
            onSelectionChange?.(appState?.selectedElementIds || {});

            if (!canEdit) {
                return;
            }

            if (!ydoc || !elementsMap || !orderArray) {
                return;
            }

            if (!synced || !apiReady) {
                return;
            }

            if (!initialSceneAppliedRef.current) {
                return;
            }

            if (applyingRemoteRef.current) {
                return;
            }

            pendingElementsRef.current = elements.map(cloneElement);
            scheduleFlush();
        },
        [
            canEdit,
            ydoc,
            elementsMap,
            orderArray,
            synced,
            apiReady,
            scheduleFlush,
            onSelectionChange,
        ],
    );

    const updateBoardElement = useCallback(
        (updatedElement) => {
            const excalidrawAPI = excalidrawAPIRef.current;

            if (!excalidrawAPI || !ydoc || !elementsMap) {
                return;
            }

            const elements = excalidrawAPI.getSceneElements();

            const updatedElements = elements.map((element) => {
                if (element.id !== updatedElement.id) {
                    return element;
                }

                return updatedElement;
            });

            excalidrawAPI.updateScene({
                elements: updatedElements,
            });

            ydoc.transact(() => {
                elementsMap.set(
                    updatedElement.id,
                    cloneElement(updatedElement),
                );
            }, LOCAL_ORIGIN);

            lastSyncedElementsMapRef.current = new Map(
                updatedElements.map((element) => [
                    element.id,
                    cloneElement(element),
                ]),
            );
        },
        [ydoc, elementsMap],
    );

    const getSceneElements = useCallback(() => {
        return excalidrawAPIRef.current?.getSceneElements() || [];
    }, []);

    const selectElement = useCallback((elementId) => {
        const api = excalidrawAPIRef.current;

        if (!api || !elementId) {
            return;
        }

        api.updateScene({
            appState: {
                selectedElementIds: {
                    [elementId]: true,
                },
            },
            commitToHistory: false,
        });
    }, []);

    const scrollToElement = useCallback((element) => {
        const api = excalidrawAPIRef.current;

        if (!api || !element) {
            return;
        }

        api.scrollToContent([element], {
            fitToContent: true,
            animate: true,
        });
    }, []);

    useEffect(() => {
        initialSceneAppliedRef.current = false;
        applyingRemoteRef.current = false;
        pendingElementsRef.current = null;
        lastSyncedElementsMapRef.current = new Map();
        localEditTimesRef.current = new Map();
        setApiReady(false);

        if (pendingSyncTimerRef.current) {
            clearTimeout(pendingSyncTimerRef.current);
            pendingSyncTimerRef.current = null;
        }

        if (remoteApplyTimerRef.current) {
            clearTimeout(remoteApplyTimerRef.current);
            remoteApplyTimerRef.current = null;
        }
    }, [provider]);

    useEffect(() => {
        return () => {
            if (pendingSyncTimerRef.current) {
                clearTimeout(pendingSyncTimerRef.current);
            }

            if (remoteApplyTimerRef.current) {
                clearTimeout(remoteApplyTimerRef.current);
            }
        };
    }, []);

    return {
        excalidrawAPIRef,
        apiReady,
        handleApiReady,
        handleChange,
        updateBoardElement,
        getSceneElements,
        selectElement,
        scrollToElement,
    };
};
