const TEXT_BLOCK_TYPES = new Set(["paragraph", "heading"]);

export function getCurrentTextBlock(editor) {
    if (!editor) {
        return null;
    }

    const { state } = editor;
    const { selection } = state;
    const { $from } = selection;

    for (let depth = $from.depth; depth > 0; depth -= 1) {
        const node = $from.node(depth);

        if (!TEXT_BLOCK_TYPES.has(node.type.name)) {
            continue;
        }

        const pos = $from.before(depth);

        return {
            node,
            pos,
            type: node.type.name,
            blockId: node.attrs.blockId,
            text: node.textContent,
        };
    }

    return null;
}
