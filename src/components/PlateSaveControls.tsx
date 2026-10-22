import { useCallback, useEffect, useRef, useState } from "react";
import { FolderOpen, Save, X } from "lucide-react";
import {
  deleteExperiment,
  loadNotebook,
  MAX_TITLE_LENGTH,
  NOTEBOOK_KEY,
  savePlate,
  type NotebookEntry,
} from "../lib/notebook";
import { foodById, format, summarize } from "../lib/nutrition";
import { usePlate } from "../lib/store";
import { TakePhotoButton } from "./TakePhotoButton";

export function PlateSaveControls() {
  const items = usePlate((s) => s.items);
  const capture = usePlate((s) => s.capturePlate);
  const load = usePlate((s) => s.openPlate);
  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [mode, setMode] = useState<"save" | "list">("save");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const refresh = useCallback(() => {
    try {
      setEntries(loadNotebook());
      setError("");
    } catch (failure) {
      setError((failure as Error).message);
    }
  }, []);
  useEffect(() => {
    refresh();
    const changed = (event: StorageEvent) => {
      if (event.key === NOTEBOOK_KEY || event.key === null) {
        setPendingDelete(null);
        refresh();
      }
    };
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, [refresh]);
  useEffect(() => {
    if (dialog.current?.open) {
      if (mode === "save") nameInput.current?.select();
      else heading.current?.focus();
    }
  }, [mode]);
  const show = (next: "save" | "list") => {
    setMode(next);
    setPendingDelete(null);
    setMessage("");
    refresh();
    if (next === "save") {
      const names = [
        ...new Set(items.map((item) => foodById[item.foodId].name)),
      ];
      setTitle(
        names.slice(0, 2).join(" & ").slice(0, MAX_TITLE_LENGTH) || "My plate",
      );
    }
    dialog.current?.showModal();
    // A frame lets React render the selected view before focus moves into it.
    requestAnimationFrame(() => {
      if (next === "save") nameInput.current?.select();
      else heading.current?.focus();
    });
  };
  return (
    <div className="plate-save-toolbar">
      <button
        className="save-plate-button"
        disabled={!items.length}
        onClick={() => show("save")}
        aria-haspopup="dialog"
      >
        <Save size={17} /> Save plate
      </button>
      <button
        className="saved-plates-button"
        onClick={() => show("list")}
        aria-haspopup="dialog"
      >
        <FolderOpen size={17} /> Saved plates{" "}
        <span className="saved-plates-count">{entries.length}</span>
      </button>
      <TakePhotoButton />
      <span className="plate-save-feedback" role="status">
        {message}
      </span>
      <dialog
        ref={dialog}
        className="saved-plates-dialog"
        aria-labelledby="saved-plates-heading"
        onClose={() => setPendingDelete(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <div className="saved-plates-dialog-heading">
          <h2 id="saved-plates-heading" ref={heading} tabIndex={-1}>
            {mode === "save" ? "Save your plate" : "Saved plates"}
          </h2>
          <button
            className="icon-button"
            aria-label="Close saved plates"
            onClick={() => dialog.current?.close()}
          >
            <X size={20} />
          </button>
        </div>
        {mode === "save" ? (
          <form
            className="plate-save-form"
            onSubmit={(event) => {
              event.preventDefault();
              try {
                setEntries(savePlate(title, capture()));
                setError("");
                setMessage(`Saved “${title.trim()}”.`);
                dialog.current?.close();
              } catch (failure) {
                setError((failure as Error).message);
              }
            }}
          >
            <p>Keep this plate for later.</p>
            <label htmlFor="saved-plate-name">Plate name</label>
            <input
              id="saved-plate-name"
              ref={nameInput}
              value={title}
              maxLength={MAX_TITLE_LENGTH}
              required
              onChange={(event) => setTitle(event.target.value)}
            />
            <p className="saved-plates-note">Saved in this browser.</p>
            <div className="saved-plate-actions">
              <button type="button" onClick={() => dialog.current?.close()}>
                Cancel
              </button>
              <button
                type="submit"
                className="save-plate-button"
                disabled={!items.length}
              >
                <Save size={16} /> Save
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className="saved-plates-note">
              Your plates, ready to load again.
            </p>
            {!entries.length && !error && (
              <p className="saved-plates-empty">
                No saved plates yet. Add some food, then choose Save plate.
              </p>
            )}
            {!!entries.length && (
              <ul className="saved-plates-list" aria-label="Saved plates">
                {entries.map((entry) => (
                  <li key={entry.id}>
                    <strong>{entry.title}</strong>
                    <p className="saved-plates-note">
                      {entry.plates
                        ? `${entry.plates.current.items.length} ${entry.plates.current.items.length === 1 ? "food" : "foods"} · ${format(summarize(entry.plates.current.items).totals.calories, 0)} kcal`
                        : "This plate can’t be loaded. A food or saved detail is no longer supported."}
                    </p>
                    <div className="saved-plate-actions">
                      <button
                        aria-label={`Delete plate: ${entry.title}`}
                        aria-expanded={pendingDelete === entry.id}
                        onClick={() => setPendingDelete(entry.id)}
                      >
                        Delete
                      </button>
                      <button
                        className="load-plate-button"
                        disabled={!entry.plates}
                        aria-label={`Load plate: ${entry.title}`}
                        onClick={() => {
                          try {
                            const latest = loadNotebook();
                            setEntries(latest);
                            const saved = latest.find(
                              (row) => row.id === entry.id,
                            );
                            if (!saved?.plates)
                              throw new Error(
                                "This saved plate is no longer available. Your current plate is safe.",
                              );
                            load(saved.plates.current);
                            setError("");
                            dialog.current?.close();
                          } catch (failure) {
                            setError((failure as Error).message);
                          }
                        }}
                      >
                        Load plate
                      </button>
                    </div>
                    {pendingDelete === entry.id && (
                      <div className="saved-plate-delete">
                        <p>Delete “{entry.title}”?</p>
                        <div className="saved-plate-actions">
                          <button
                            autoFocus
                            onClick={() => {
                              setPendingDelete(null);
                              heading.current?.focus();
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              try {
                                setEntries(deleteExperiment(entry.id));
                                setError("");
                                setPendingDelete(null);
                                heading.current?.focus();
                              } catch (failure) {
                                setError((failure as Error).message);
                              }
                            }}
                          >
                            Confirm delete
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <p className="saved-plates-note">
              Saved in this browser. Clearing site data removes saved plates.
            </p>
          </>
        )}
        {error && (
          <div className="saved-plates-error">
            <p role="alert">{error}</p>
            <button onClick={refresh}>Try again</button>
          </div>
        )}
      </dialog>
    </div>
  );
}
