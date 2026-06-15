import { NodeViewWrapper } from "@tiptap/react";
import { useNavigate, useParams } from "react-router-dom";

const InternalLinkView = ({ node }) => {
    const navigate = useNavigate();
    const { projectId } = useParams();

    const {
        targetTabId,
        targetTabType,
        targetAnchorType,
        targetAnchorId,
        targetLabel,
    } = node.attrs;

    const handleClick = (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!projectId || !targetTabId) {
            return;
        }

        navigate(`/projects/${projectId}/tabs/${targetTabId}`, {
            state: {
                targetTabType,
                targetAnchorType,
                targetAnchorId,
            },
        });
    };

    return (
        <NodeViewWrapper
            as="span"
            className="internal-link"
            data-target-tab-id={targetTabId}
            data-target-tab-type={targetTabType}
            data-target-anchor-type={targetAnchorType}
            data-target-anchor-id={targetAnchorId}
            onClick={handleClick}
            title={`Открыть ${targetLabel || "связанный элемент"}`}
        >
            <span className="internal-link__icon">
                {targetAnchorType === "board-element" ? "⬚" : "↗"}
            </span>

            <span className="internal-link__label">
                {targetLabel || "Без названия"}
            </span>
        </NodeViewWrapper>
    );
};

export default InternalLinkView;
