import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import InternalLinkView from "./InternalLinkView";

const InternalLinkNode = Node.create({
    name: "internalLink",

    group: "inline",

    inline: true,

    atom: true,

    selectable: false,

    draggable: false,

    addAttributes() {
        return {
            linkId: {
                default: null,
            },

            targetTabId: {
                default: null,
            },

            targetTabType: {
                default: "text",
            },

            targetAnchorType: {
                default: "tab",
            },

            targetAnchorId: {
                default: null,
            },

            targetLabel: {
                default: "",
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-type="internal-link"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            "span",
            mergeAttributes(HTMLAttributes, {
                "data-type": "internal-link",
                "data-link-id": HTMLAttributes.linkId,
                "data-target-tab-id": HTMLAttributes.targetTabId,
                "data-target-tab-type": HTMLAttributes.targetTabType,
                "data-target-anchor-type": HTMLAttributes.targetAnchorType,
                "data-target-anchor-id": HTMLAttributes.targetAnchorId,
                class: "internal-link",
            }),
            `@${HTMLAttributes.targetLabel || "Untitled"}`,
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(InternalLinkView);
    },

    addCommands() {
        return {
            insertInternalLink:
                (attrs) =>
                ({ chain }) => {
                    return chain()
                        .insertContent({
                            type: this.name,
                            attrs,
                        })
                        .insertContent(" ")
                        .run();
                },
        };
    },
});

export default InternalLinkNode;
