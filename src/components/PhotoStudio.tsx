import { useCallback, useRef, useState } from "react";
import { ArrowDownToLine, Camera, X } from "lucide-react";
import PhotoScene, { type PhotoExporter } from "./PhotoScene";
import {
  PHOTO_SIZE,
  photoLooks,
  type PhotoAngle,
  type PhotoCamera,
  type PhotoLook,
} from "../lib/photo";
import type { Snapshot } from "../lib/store";
export default function PhotoStudio({
  plate,
  currentCamera,
  onClose,
}: {
  plate: Snapshot;
  currentCamera: PhotoCamera | null;
  onClose: () => void;
}) {
  const [look, setLook] = useState<PhotoLook>("warm-table");
  const [angle, setAngle] = useState<PhotoAngle>("angled");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const exporter = useRef<PhotoExporter | null>(null);
  const onFailure = useCallback(() => {
    setFailed(true);
    setReady(false);
  }, []);
  const download = async () => {
    if (!exporter.current || !ready || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const blob = await exporter.current.download();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `platelab-${look}-${angle}.png`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("Your photo is ready.");
    } catch {
      setError("The photo couldn’t be downloaded. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <header className="photo-header">
        <div>
          <span className="eyebrow">
            <Camera size={13} /> A LITTLE CLOSE-UP
          </span>
          <h2>Take a photo</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Close photo mode"
          onClick={onClose}
        >
          <X size={21} />
        </button>
      </header>
      <div className="photo-layout">
        <div
          className="photo-preview"
          role="img"
          aria-label={`Your plate in ${photoLooks[look].label.toLowerCase()} lighting, ${angle === "top" ? "top view" : angle === "current" ? "current view" : "angled view"}`}
          aria-busy={!ready && !failed}
        >
          <PhotoScene
            plate={plate}
            look={look}
            angle={angle}
            currentCamera={currentCamera}
            exporter={exporter}
            onReady={setReady}
            onFailure={onFailure}
          />
          {!ready && !failed && (
            <span className="photo-preparing" role="status">
              Setting up the light…
            </span>
          )}
        </div>
        <div className="photo-options">
          <fieldset disabled={busy || failed}>
            <legend>Choose a look</legend>
            <div className="photo-looks">
              {(
                Object.entries(photoLooks) as [
                  PhotoLook,
                  (typeof photoLooks)[PhotoLook],
                ][]
              ).map(([key, preset]) => (
                <label key={key} className="photo-look">
                  <input
                    type="radio"
                    name="photo-look"
                    value={key}
                    checked={look === key}
                    onChange={() => {
                      setReady(false);
                      setLook(key);
                      setMessage("");
                    }}
                  />
                  <span
                    className="photo-look-swatch"
                    style={{ background: preset.background }}
                    aria-hidden="true"
                  />
                  <span>
                    <strong>{preset.label}</strong>
                    <small>{preset.description}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset disabled={busy || failed}>
            <legend>Camera angle</legend>
            <div className="photo-angles">
              {(
                [
                  ["angled", "Angled"],
                  ["top", "Top view"],
                  ["current", "Current view"],
                ] as const
              ).map(([key, label]) => (
                <label key={key}>
                  <input
                    type="radio"
                    name="photo-angle"
                    value={key}
                    checked={angle === key}
                    disabled={key === "current" && !currentCamera}
                    onChange={() => {
                      setReady(false);
                      setAngle(key);
                      setMessage("");
                    }}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="photo-download-area">
            <p className="saved-plates-note">
              {PHOTO_SIZE} × {PHOTO_SIZE} PNG · just your plate
            </p>
            <button
              className="photo-download"
              disabled={!ready || failed || busy}
              onClick={download}
            >
              <ArrowDownToLine size={18} />
              {busy ? "Creating photo…" : "Download PNG"}
            </button>
            <p className="photo-result" role="status">
              {message}
            </p>
            {error && (
              <p className="photo-error" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
