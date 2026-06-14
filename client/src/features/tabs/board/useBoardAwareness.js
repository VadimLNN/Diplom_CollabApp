import { useCallback, useEffect, useRef } from "react";

const COLORS = [
    "#e44d26",
    "#4d7c0f",
    "#7c3aed",
    "#db2777",
    "#2563eb",
    "#65a30d",
    "#c026d3",
    "#0891b2",
];

function hashClientId(clientId) {
    let hash = 0;
    for (let i = 0; i < clientId.length; i++) {
        hash = (hash * 31 + clientId.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
}

export function useBoardAwareness(provider, excalidrawAPIRef, username, apiReady) {
    const handlePointerUpdateRef = useRef(null);

    useEffect(() => {
        if (!provider || !apiReady || !excalidrawAPIRef?.current) return;

        const api = excalidrawAPIRef.current;
        const awareness = provider.awareness;
        const clientId = awareness.clientID;
        const color = COLORS[hashClientId(clientId) % COLORS.length];

        awareness.setLocalStateField("user", {
            name: username || "Anonymous",
            color,
        });

        handlePointerUpdateRef.current = (payload) => {
            awareness.setLocalStateField("boardPointer", {
                x: payload.pointer.x,
                y: payload.pointer.y,
                button: payload.button,
                tool: payload.tool,
            });
        };

        const updateCollaborators = () => {
            const states = awareness.getStates();
            const collaborators = new Map();
            states.forEach((state, cid) => {
                if (cid === awareness.clientID) return;
                if (state.boardPointer || state.user) {
                    collaborators.set(cid, {
                        username: state.user?.name || "Anonymous",
                        color: state.user?.color || "#666",
                        pointer: state.boardPointer || null,
                    });
                }
            });
            api.updateScene({ collaborators });
        };

        awareness.on("change", updateCollaborators);
        // Запускаем сразу, чтобы локальный юзер зарегистрировался
        updateCollaborators();

        return () => {
            awareness.off("change", updateCollaborators);
            handlePointerUpdateRef.current = null;
        };
    }, [provider, excalidrawAPIRef, username, apiReady]);

    const handlePointerUpdate = useCallback((payload) => {
        handlePointerUpdateRef.current?.(payload);
    }, []);

    return { handlePointerUpdate };
}
