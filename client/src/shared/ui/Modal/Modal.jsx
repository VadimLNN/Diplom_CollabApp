import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE = [
    "a[href]",
    "button:not([disabled])",
    'input:not([type="hidden"]):not([disabled])',
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
].join(",");

export function Modal({
    isOpen,
    title,
    description,
    onClose,
    children,
    wide = false,
}) {
    const titleId = useId();
    const descId = useId();
    const dialogRef = useRef(null);
    const lastActiveRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        lastActiveRef.current = document.activeElement;
        document.body.classList.add("u-lock-scroll");

        const appContent = document.getElementById("app-content");
        appContent?.setAttribute("inert", "");

        const dialog = dialogRef.current;
        const focusables = dialog?.querySelectorAll(FOCUSABLE);
        focusables?.[0]?.focus();

        function handleKeyDown(event) {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose();
                return;
            }

            if (event.key !== "Tab" || !focusables?.length) return;

            const first = focusables[0];
            const last = focusables[focusables.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        dialog?.addEventListener("keydown", handleKeyDown);

        return () => {
            dialog?.removeEventListener("keydown", handleKeyDown);
            appContent?.removeAttribute("inert");
            document.body.classList.remove("u-lock-scroll");
            lastActiveRef.current?.focus?.();
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="modal" role="presentation">
            <div className="modal__overlay" onClick={onClose} />
            <div
                ref={dialogRef}
                className={`modal__dialog ${wide ? "modal__dialog--wide" : ""}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={description ? descId : undefined}
            >
                <header className="modal__header">
                    <div className="modal__head">
                        <h2 className="modal__title" id={titleId}>
                            {title}
                        </h2>
                        {description && (
                            <p className="modal__description" id={descId}>
                                {description}
                            </p>
                        )}
                    </div>

                    <button
                        className="button button--icon button--ghost"
                        type="button"
                        aria-label="Закрыть модальное окно"
                        onClick={onClose}
                    >
                        <span className="button__icon" aria-hidden="true">
                            ×
                        </span>
                    </button>
                </header>

                <div className="modal__body">{children}</div>
            </div>
        </div>,
        document.body,
    );
}

export default Modal;
