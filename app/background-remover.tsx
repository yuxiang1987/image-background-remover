"use client";
/* eslint-disable @next/next/no-img-element -- previews are user-generated Blob URLs */

import { ChangeEvent, DragEvent, useCallback, useEffect, useRef, useState } from "react";

type Stage = "idle" | "selected" | "verifying" | "uploading" | "processing" | "completed" | "error";
type Background = "transparent" | "white" | "black" | "custom";

const MAX_BYTES = 12 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

function cleanName(name: string) {
  return (name.replace(/\.[^.]+$/, "") || "image").replace(/[^a-zA-Z0-9-_]+/g, "-");
}

export default function BackgroundRemover() {
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLImageElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState("");
  const [background, setBackground] = useState<Background>("transparent");
  const [customColor, setCustomColor] = useState("#ffcf4a");
  const [dragging, setDragging] = useState(false);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!turnstileSiteKey || document.querySelector('script[data-backgroundly-turnstile]')) return;
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true; script.defer = true; script.dataset.backgroundlyTurnstile = "true";
    document.head.appendChild(script);
  }, [turnstileSiteKey]);

  useEffect(() => () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
  }, [originalUrl, resultUrl]);

  const reset = useCallback(() => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null); setOriginalUrl(""); setResultUrl(""); setStage("idle"); setError(""); setBackground("transparent");
    if (inputRef.current) inputRef.current.value = "";
  }, [originalUrl, resultUrl]);

  const chooseFile = useCallback((next: File | undefined) => {
    if (!next) return;
    setError("");
    if (!ALLOWED.includes(next.type)) { setStage("error"); setError("Please upload a JPG, PNG, or WebP image."); return; }
    if (next.size > MAX_BYTES) { setStage("error"); setError("Please choose an image smaller than 12 MB."); return; }
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(next); setOriginalUrl(URL.createObjectURL(next)); setResultUrl(""); setStage("selected"); setBackground("transparent");
  }, [originalUrl, resultUrl]);

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const image = [...(event.clipboardData?.files || [])].find((item) => item.type.startsWith("image/"));
      if (image) chooseFile(image);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [chooseFile]);

  const processImage = async () => {
    if (!file || stage === "uploading" || stage === "processing" || stage === "verifying") return;
    setStage("verifying"); setError("");
    const turnstileToken = (document.querySelector<HTMLInputElement>('[name="cf-turnstile-response"]')?.value || "development");
    const body = new FormData();
    body.append("image_file", file);
    body.append("turnstile_token", turnstileToken);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 45000);
    try {
      setStage("uploading");
      // The upload and remove.bg processing happen in one request, so switch to
      // the processing state as soon as the request has been dispatched.
      window.setTimeout(() => setStage((current) => current === "uploading" ? "processing" : current), 300);
      const response = await fetch("/api/remove-background", { method: "POST", body, signal: controller.signal });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
        throw new Error(payload?.error?.message || "We couldn't process this image. Please try again.");
      }
      const blob = await response.blob();
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob)); setStage("completed");
    } catch (reason) {
      setStage("error");
      setError(reason instanceof DOMException && reason.name === "AbortError" ? "Processing took too long. Please check your connection and try again." : reason instanceof Error ? reason.message : "Something went wrong. Please try again.");
    } finally {
      window.clearTimeout(timer);
    }
  };

  const download = async () => {
    if (!resultUrl || !file) return;
    if (background === "transparent") {
      const link = document.createElement("a"); link.href = resultUrl; link.download = `${cleanName(file.name)}-no-bg.png`; link.click(); return;
    }
    const image = resultRef.current;
    if (!image) return;
    const canvas = document.createElement("canvas"); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d"); if (!context) return;
    context.fillStyle = background === "white" ? "#ffffff" : background === "black" ? "#111111" : customColor;
    context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0);
    canvas.toBlob((blob) => { if (!blob) return; const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${cleanName(file.name)}-no-bg.png`; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }, "image/png");
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files[0]); };
  const onInput = (event: ChangeEvent<HTMLInputElement>) => chooseFile(event.target.files?.[0]);
  const previewBg = background === "white" ? "#fff" : background === "black" ? "#111" : background === "custom" ? customColor : undefined;

  return (
    <section className="tool-wrap" aria-label="Background remover tool">
      <div className="tool-card">
        {stage === "idle" || (stage === "error" && !file) ? (
          <div className={`dropzone ${dragging ? "is-dragging" : ""}`} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop} onClick={() => inputRef.current?.click()} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }} role="button" tabIndex={0}>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onInput} hidden />
            <div className="upload-icon" aria-hidden="true"><span>↑</span></div>
            <h2>Drop your image here</h2><p>or click to browse · you can also paste</p>
            <button type="button" className="primary-button">Choose an image</button>
            <small>JPG, PNG or WebP · Max 12 MB</small>
          </div>
        ) : (
          <div className="workspace">
            <div className="workspace-top"><div><span className="status-dot" />{stage === "completed" ? "Background removed" : stage === "error" ? "Needs attention" : "Ready to remove"}</div><button onClick={reset}>New image</button></div>
            <div className="preview-grid">
              <figure><figcaption>Original</figcaption><div className="image-stage original-stage">{/* User-generated Blob URLs cannot use the Next image optimizer. */}<img src={originalUrl} alt="Original upload preview" /></div></figure>
              <figure><figcaption>Result</figcaption><div className={`image-stage result-stage ${background === "transparent" ? "checkerboard" : ""}`} style={{ backgroundColor: previewBg }}>
                {resultUrl ? <>{/* User-generated Blob URLs cannot use the Next image optimizer. */}<img ref={resultRef} src={resultUrl} alt="Image with its background removed" /></> : <div className="processing" role="status" aria-live="polite">{stage !== "selected" && stage !== "error" && <span className="spinner" />}<strong>{stage === "error" ? "Processing paused" : stage === "selected" ? "Ready when you are" : stage === "verifying" ? "Checking request…" : stage === "uploading" ? "Uploading securely…" : "Removing background…"}</strong><small>{stage === "selected" ? "Click Remove background to start." : stage === "error" ? "Review the message below and try again." : "This usually takes a few seconds."}</small></div>}
              </div></figure>
            </div>
            {stage === "completed" && <div className="editor-bar"><div className="background-options" role="group" aria-label="Background color">
              <button className={background === "transparent" ? "active checkerboard" : "checkerboard"} onClick={() => setBackground("transparent")} aria-label="Transparent background" />
              <button className={background === "white" ? "active white" : "white"} onClick={() => setBackground("white")} aria-label="White background" />
              <button className={background === "black" ? "active black" : "black"} onClick={() => setBackground("black")} aria-label="Black background" />
              <label className={background === "custom" ? "color-input active" : "color-input"} style={{ background: customColor }} aria-label="Custom background color"><input type="color" value={customColor} onChange={(e) => { setCustomColor(e.target.value); setBackground("custom"); }} /></label>
            </div><button className="download-button" onClick={download}>Download PNG <span>↓</span></button></div>}
            {(stage === "selected" || stage === "error") && <div className="action-row-column">{turnstileSiteKey && <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="light" data-size="flexible" />}<div className="action-row"><button className="primary-button" onClick={processImage}>Remove background <span>→</span></button></div></div>}
          </div>
        )}
        {error && <div className="error-message" role="alert">{error}</div>}
        <div className="privacy-note"><span aria-hidden="true">◇</span> Images are processed securely and never stored by our website.</div>
      </div>
    </section>
  );
}
