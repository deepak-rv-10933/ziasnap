"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraSlash } from "@phosphor-icons/react";
import { CameraCapture } from "./CameraCapture";

type CameraState = "idle" | "starting" | "live" | "unavailable";

interface LiveViewfinderProps {
  onCapture: (dataUrl: string) => void;
}

/**
 * Camera-first capture: a live viewfinder with a plate-framing guide and a
 * shutter. Starts by itself when camera permission was already granted,
 * otherwise on one tap. Falls back to the phone's own camera app (file input)
 * when the browser can't stream or permission is denied.
 */
export function LiveViewfinder({ onCapture }: LiveViewfinderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>("idle");

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("unavailable");
      return;
    }
    setState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1440 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setState("live");
    } catch {
      setState("unavailable");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const permissions = navigator.permissions as Permissions | undefined;
    permissions
      ?.query({ name: "camera" as PermissionName })
      .then((status) => {
        if (!cancelled && status.state === "granted") void start();
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      stop();
    };
  }, [start, stop]);

  const shoot = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    stop();
    onCapture(dataUrl);
  };

  if (state === "unavailable") {
    return (
      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CameraSlash className="size-4" aria-hidden="true" />
          The in-app camera isn&apos;t available here, so this opens your phone&apos;s camera instead.
        </p>
        <CameraCapture onCapture={onCapture} />
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-[#0a1016]">
      <video
        ref={videoRef}
        playsInline
        muted
        className={state === "live" ? "size-full object-cover" : "hidden"}
        aria-label="Camera viewfinder"
      />

      {state === "live" ? (
        <>
          {/* Framing guide: corner brackets around where the plate should sit. */}
          <div className="pointer-events-none absolute inset-[9%] rounded-[2rem]" aria-hidden="true">
            {["left-0 top-0 border-l-4 border-t-4 rounded-tl-[2rem]", "right-0 top-0 border-r-4 border-t-4 rounded-tr-[2rem]", "left-0 bottom-0 border-l-4 border-b-4 rounded-bl-[2rem]", "right-0 bottom-0 border-r-4 border-b-4 rounded-br-[2rem]"].map((corner) => (
              <span key={corner} className={`absolute size-12 border-brand-turmeric ${corner}`} />
            ))}
          </div>
          <p className="pointer-events-none absolute inset-x-0 top-4 text-center text-xs font-semibold text-white drop-shadow">
            Fit the whole plate inside the frame
          </p>
          <div className="absolute inset-x-0 bottom-5 flex justify-center">
            <button
              type="button"
              onClick={shoot}
              aria-label="Take photo"
              className="flex size-[4.5rem] items-center justify-center rounded-full border-4 border-white/90 bg-white/20 backdrop-blur transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-turmeric/60"
            >
              <span className="size-14 rounded-full bg-white" />
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={start}
          disabled={state === "starting"}
          className="flex size-full flex-col items-center justify-center gap-4 text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-brand-turmeric/50"
        >
          <span className="flex size-20 items-center justify-center rounded-full bg-brand-turmeric text-[#1a1206] motion-safe:animate-[breathe_3.2s_ease-in-out_infinite]">
            <Camera weight="fill" className="size-9" />
          </span>
          <span className="text-sm font-semibold">{state === "starting" ? "Starting camera…" : "Start camera"}</span>
          <span className="max-w-[70%] text-center text-xs text-white/70">Point it at your plate. Zia reads the photo, never a video.</span>
        </button>
      )}
    </div>
  );
}
