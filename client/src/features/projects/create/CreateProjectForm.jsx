import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import api from "../../../shared/api/axios";

const CreateProjectForm = ({ onSuccess, isOpen }) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const nameInputRef = useRef(null);

    useEffect(() => {
        if (isOpen && nameInputRef.current) {
            setTimeout(() => {
                nameInputRef.current?.focus();
            }, 100);
        }
        if (!isOpen) {
            setName("");
            setDescription("");
            setIsLoading(false);
        }
    }, [isOpen]);

    const handleSubmit = useCallback(
        async (e) => {
            e.preventDefault();

            if (!name.trim()) {
                toast.error("Project name is required");
                return;
            }

            try {
                setIsLoading(true);
                const response = await api.post("/projects", {
                    name: name.trim(),
                    description: description.trim(),
                });

                toast.success("Project created successfully!");
                onSuccess(response.data);

                setName("");
                setDescription("");
            } catch (err) {
                const errorMessage =
                    err.response?.data?.errors?.[0]?.msg ||
                    err.response?.data?.error ||
                    "Failed to create project";
                toast.error(errorMessage);
            } finally {
                setIsLoading(false);
            }
        },
        [name, description, onSuccess],
    );

    return (
        <form onSubmit={handleSubmit} className="form">
            <div className="field">
                <label className="field__label" htmlFor="project-name">
                    Project name
                </label>
                <input
                    id="project-name"
                    ref={nameInputRef}
                    className="field__control"
                    type="text"
                    placeholder="Enter project name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    required
                />
            </div>

            <div className="field field--textarea">
                <label className="field__label" htmlFor="project-description">
                    Description
                </label>
                <textarea
                    id="project-description"
                    className="field__control"
                    placeholder="Description optional"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="4"
                    disabled={isLoading}
                />
            </div>

            <div className="form__actions">
                <button
                    type="submit"
                    className={`button button--primary ${isLoading ? "is-loading" : ""}`}
                    disabled={isLoading || !name.trim()}
                >
                    <span className="button__label">
                        {isLoading ? "Creating..." : "Create"}
                    </span>
                </button>
            </div>
        </form>
    );
};

export default CreateProjectForm;
