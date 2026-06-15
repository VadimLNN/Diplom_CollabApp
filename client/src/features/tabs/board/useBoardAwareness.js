import { useCallback, useEffect, useRef } from "react";

export function useBoardAwareness(
    provider,
    excalidrawAPIRef,
    collaborationUser,
    apiReady,
) {
    const handlePointerUpdateRef = useRef(null);

    useEffect(() => {
        if (!provider || !apiReady || !excalidrawAPIRef?.current) return;

        const api = excalidrawAPIRef.current;
        const awareness = provider.awareness;

        awareness.setLocalStateField("user", collaborationUser);

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
        updateCollaborators();

        return () => {
            awareness.off("change", updateCollaborators);
            handlePointerUpdateRef.current = null;
        };
    }, [provider, excalidrawAPIRef, collaborationUser, apiReady]);

    const handlePointerUpdate = useCallback((payload) => {
        handlePointerUpdateRef.current?.(payload);
    }, []);

    return { handlePointerUpdate };
}
