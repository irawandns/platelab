import { lazy, Suspense, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { readPhotoCamera, type PhotoCamera } from "../lib/photo";
import { usePlate, type Snapshot } from "../lib/store";
const PhotoStudio = lazy(() => import("./PhotoStudio"));
export function TakePhotoButton() {
  const empty = usePlate((s) => !s.items.length);
  const dialog = useRef<HTMLDialogElement>(null);
  const [photo, setPhoto] = useState<{
    plate: Snapshot;
    camera: PhotoCamera | null;
  } | null>(null);
  return (
    <>
      <button
        className="take-photo-button"
        disabled={empty}
        aria-haspopup="dialog"
        onClick={() => {
          setPhoto({
            plate: usePlate.getState().capturePlate(),
            camera: readPhotoCamera(),
          });
          dialog.current?.showModal();
        }}
      >
        <Camera size={17} /> Take photo
      </button>
      <dialog
        ref={dialog}
        className="photo-dialog"
        aria-label="Take a photo"
        onClose={() => setPhoto(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        {photo && (
          <Suspense
            fallback={
              <p className="photo-loading" role="status">
                Opening photo mode…
              </p>
            }
          >
            <PhotoStudio
              plate={photo.plate}
              currentCamera={photo.camera}
              onClose={() => dialog.current?.close()}
            />
          </Suspense>
        )}
      </dialog>
    </>
  );
}
