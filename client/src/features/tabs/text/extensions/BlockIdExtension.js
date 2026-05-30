import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export function createBlockId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return `block_${crypto.randomUUID()}`;
    }

    return `block_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

const BLOCK_TYPES = new Set(["paragraph", "heading"]);

const BlockIdExtension = Extension.create({
    name: "blockIdExtension",

    addGlobalAttributes() {
        return [
            {
                types: ["paragraph", "heading"],
                attributes: {
                    blockId: {
                        default: null,

                        parseHTML: (element) =>
                            element.getAttribute("data-block-id"),

                        renderHTML: (attributes) => {
                            if (!attributes.blockId) {
                                return {};
                            }

                            return {
                                "data-block-id": attributes.blockId,
                            };
                        },
                    },
                },
            },
        ];
    },

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey("blockIdPlugin"),

                appendTransaction: (transactions, oldState, newState) => {
                    const shouldCheck = transactions.some(
                        (transaction) => transaction.docChanged,
                    );

                    if (!shouldCheck) {
                        return null;
                    }

                    let transaction = null;

                    newState.doc.descendants((node, pos) => {
                        if (!BLOCK_TYPES.has(node.type.name)) {
                            return;
                        }

                        if (node.attrs.blockId) {
                            return;
                        }

                        if (!transaction) {
                            transaction = newState.tr;
                        }

                        transaction.setNodeMarkup(pos, undefined, {
                            ...node.attrs,
                            blockId: createBlockId(),
                        });
                    });

                    return transaction;
                },
            }),
        ];
    },
});

export default BlockIdExtension;
