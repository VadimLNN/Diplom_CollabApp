import * as React from "react";
import * as Toolbar from "@radix-ui/react-toolbar";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Tooltip from "@radix-ui/react-tooltip";

const Separator = () => (
    <Toolbar.Separator className="editor-toolbar__separator" />
);

const Icon = ({ children }) => (
    <span className="editor-toolbar__icon" aria-hidden="true">
        {children}
    </span>
);

function ToolbarButton({
    label,
    disabled = false,
    pressed = false,
    onClick,
    children,
}) {
    return (
        <Tooltip.Root delayDuration={250}>
            <Tooltip.Trigger asChild>
                <Toolbar.Button
                    className={`editor-toolbar__button ${pressed ? "editor-toolbar__button--active" : ""}`}
                    aria-label={label}
                    aria-pressed={pressed}
                    disabled={disabled}
                    onClick={onClick}
                    type="button"
                >
                    {children}
                </Toolbar.Button>
            </Tooltip.Trigger>

            <Tooltip.Portal>
                <Tooltip.Content
                    className="editor-toolbar__tooltip"
                    side="bottom"
                    sideOffset={6}
                >
                    {label}
                </Tooltip.Content>
            </Tooltip.Portal>
        </Tooltip.Root>
    );
}

function ToolbarDropdown({ label, disabled = false, trigger, children }) {
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <Toolbar.Button
                    className="editor-toolbar__button"
                    aria-label={label}
                    disabled={disabled}
                    type="button"
                >
                    {trigger}
                </Toolbar.Button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="editor-toolbar__dropdown"
                    side="bottom"
                    sideOffset={6}
                >
                    {children}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}

function DropdownItem({
    onSelect,
    disabled = false,
    active = false,
    children,
}) {
    return (
        <DropdownMenu.Item
            className={`editor-toolbar__dropdown-item ${
                active ? "editor-toolbar__dropdown-item--active" : ""
            }`}
            onSelect={(event) => {
                event.preventDefault();
                onSelect?.();
            }}
            disabled={disabled}
        >
            {children}
        </DropdownMenu.Item>
    );
}

const EditorToolbar = ({ editor }) => {
    if (!editor) return null;

    const run = (callback) => callback(editor.chain().focus()).run();

    return (
        <Tooltip.Provider>
            <Toolbar.Root
                className="editor-toolbar"
                aria-label="Editor toolbar"
            >
                <ToolbarButton
                    label="Undo"
                    disabled={!editor.can().undo()}
                    onClick={() => run((chain) => chain.undo())}
                >
                    <Icon>↶</Icon>
                </ToolbarButton>

                <ToolbarButton
                    label="Redo"
                    disabled={!editor.can().redo()}
                    onClick={() => run((chain) => chain.redo())}
                >
                    <Icon>↷</Icon>
                </ToolbarButton>

                <Separator />

                <ToolbarDropdown
                    label="Heading"
                    trigger={
                        <>
                            <Icon>H</Icon>
                            <span className="editor-toolbar__arrow">▾</span>
                        </>
                    }
                >
                    <DropdownItem
                        active={editor.isActive("heading", { level: 1 })}
                        onSelect={() =>
                            run((chain) => chain.setHeading({ level: 1 }))
                        }
                    >
                        Heading 1
                    </DropdownItem>

                    <DropdownItem
                        active={editor.isActive("heading", { level: 2 })}
                        onSelect={() =>
                            run((chain) => chain.setHeading({ level: 2 }))
                        }
                    >
                        Heading 2
                    </DropdownItem>

                    <DropdownItem
                        active={editor.isActive("heading", { level: 3 })}
                        onSelect={() =>
                            run((chain) => chain.setHeading({ level: 3 }))
                        }
                    >
                        Heading 3
                    </DropdownItem>

                    <DropdownItem
                        active={editor.isActive("paragraph")}
                        onSelect={() => run((chain) => chain.setParagraph())}
                    >
                        Paragraph
                    </DropdownItem>
                </ToolbarDropdown>

                <ToolbarDropdown
                    label="List options"
                    trigger={
                        <>
                            <Icon>≡</Icon>
                            <span className="editor-toolbar__arrow">▾</span>
                        </>
                    }
                >
                    <DropdownItem
                        active={editor.isActive("bulletList")}
                        onSelect={() =>
                            run((chain) => chain.toggleBulletList())
                        }
                    >
                        Bullet list
                    </DropdownItem>

                    <DropdownItem
                        active={editor.isActive("orderedList")}
                        onSelect={() =>
                            run((chain) => chain.toggleOrderedList())
                        }
                    >
                        Ordered list
                    </DropdownItem>
                </ToolbarDropdown>

                <Separator />

                <ToolbarButton
                    label="Blockquote"
                    pressed={editor.isActive("blockquote")}
                    disabled={!editor.can().toggleBlockquote()}
                    onClick={() => run((chain) => chain.toggleBlockquote())}
                >
                    <Icon>❝</Icon>
                </ToolbarButton>

                <ToolbarButton
                    label="Code Block"
                    pressed={editor.isActive("codeBlock")}
                    disabled={!editor.can().toggleCodeBlock()}
                    onClick={() => run((chain) => chain.toggleCodeBlock())}
                >
                    <Icon>{"</>"}</Icon>
                </ToolbarButton>

                <Separator />

                <Toolbar.ToggleGroup
                    className="editor-toolbar__group"
                    type="multiple"
                    aria-label="Text formatting"
                >
                    <Toolbar.ToggleItem
                        className={`editor-toolbar__button ${
                            editor.isActive("bold")
                                ? "editor-toolbar__button--active"
                                : ""
                        }`}
                        value="bold"
                        aria-label="Bold"
                        disabled={!editor.can().toggleBold()}
                        onClick={() => run((chain) => chain.toggleBold())}
                    >
                        <Icon>B</Icon>
                    </Toolbar.ToggleItem>

                    <Toolbar.ToggleItem
                        className={`editor-toolbar__button ${
                            editor.isActive("italic")
                                ? "editor-toolbar__button--active"
                                : ""
                        }`}
                        value="italic"
                        aria-label="Italic"
                        disabled={!editor.can().toggleItalic()}
                        onClick={() => run((chain) => chain.toggleItalic())}
                    >
                        <Icon>I</Icon>
                    </Toolbar.ToggleItem>

                    <Toolbar.ToggleItem
                        className={`editor-toolbar__button ${
                            editor.isActive("strike")
                                ? "editor-toolbar__button--active"
                                : ""
                        }`}
                        value="strike"
                        aria-label="Strike"
                        disabled={!editor.can().toggleStrike()}
                        onClick={() => run((chain) => chain.toggleStrike())}
                    >
                        <Icon>S</Icon>
                    </Toolbar.ToggleItem>

                    <Toolbar.ToggleItem
                        className={`editor-toolbar__button ${
                            editor.isActive("code")
                                ? "editor-toolbar__button--active"
                                : ""
                        }`}
                        value="code"
                        aria-label="Code"
                        disabled={!editor.can().toggleCode()}
                        onClick={() => run((chain) => chain.toggleCode())}
                    >
                        <Icon>{"<>"}</Icon>
                    </Toolbar.ToggleItem>

                    <Toolbar.ToggleItem
                        className={`editor-toolbar__button ${
                            editor.isActive("underline")
                                ? "editor-toolbar__button--active"
                                : ""
                        }`}
                        value="underline"
                        aria-label="Underline"
                        disabled={!(editor.can().toggleUnderline?.() ?? false)}
                        onClick={() => {
                            editor.chain().focus().toggleUnderline?.().run();
                        }}
                    >
                        <Icon>U</Icon>
                    </Toolbar.ToggleItem>
                </Toolbar.ToggleGroup>

                <Separator />

                <Toolbar.ToggleGroup
                    className="editor-toolbar__group"
                    type="single"
                    aria-label="Text alignment"
                >
                    <Toolbar.ToggleItem
                        className={`editor-toolbar__button ${
                            editor.isActive({ textAlign: "left" })
                                ? "editor-toolbar__button--active"
                                : ""
                        }`}
                        value="left"
                        aria-label="Align left"
                        onClick={() =>
                            editor.chain().focus().setTextAlign?.("left").run()
                        }
                    >
                        <Icon>L</Icon>
                    </Toolbar.ToggleItem>

                    <Toolbar.ToggleItem
                        className={`editor-toolbar__button ${
                            editor.isActive({ textAlign: "center" })
                                ? "editor-toolbar__button--active"
                                : ""
                        }`}
                        value="center"
                        aria-label="Align center"
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .setTextAlign?.("center")
                                .run()
                        }
                    >
                        <Icon>C</Icon>
                    </Toolbar.ToggleItem>

                    <Toolbar.ToggleItem
                        className={`editor-toolbar__button ${
                            editor.isActive({ textAlign: "right" })
                                ? "editor-toolbar__button--active"
                                : ""
                        }`}
                        value="right"
                        aria-label="Align right"
                        onClick={() =>
                            editor.chain().focus().setTextAlign?.("right").run()
                        }
                    >
                        <Icon>R</Icon>
                    </Toolbar.ToggleItem>

                    <Toolbar.ToggleItem
                        className={`editor-toolbar__button ${
                            editor.isActive({ textAlign: "justify" })
                                ? "editor-toolbar__button--active"
                                : ""
                        }`}
                        value="justify"
                        aria-label="Align justify"
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .setTextAlign?.("justify")
                                .run()
                        }
                    >
                        <Icon>J</Icon>
                    </Toolbar.ToggleItem>
                </Toolbar.ToggleGroup>

                <Separator />

                <ToolbarButton
                    label="Add image"
                    onClick={() => {
                        const url = window.prompt("Image URL");

                        if (!url) return;

                        editor.chain().focus().setImage?.({ src: url }).run();
                    }}
                >
                    <Icon>🖼</Icon>
                    <span className="editor-toolbar__text">Add</span>
                </ToolbarButton>
            </Toolbar.Root>
        </Tooltip.Provider>
    );
};

export default EditorToolbar;
