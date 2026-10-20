"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useI18n } from "@/lib/i18n";

export interface ImageCropOverlayProps {
  imgRef: React.RefObject<HTMLImageElement | null>;
  targetWidth?: number;
  targetHeight?: number;
  initialObjectPosition?: string;
  onApply: (objectPosition: string) => void;
  onCancel: () => void;
}

type CropBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const ACCENT = "#a855f7";

export function ImageCropOverlay({
  imgRef,
  targetWidth = 300,
  targetHeight = 200,
  initialObjectPosition = "50% 50%",
  onApply,
  onCancel,
}: ImageCropOverlayProps) {
  const { t } = useI18n();
  const [imgSize, setImgSize] = useState<{ width: number; height: number } | null>(null);
  const [crop, setCrop] = useState<CropBox | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState<string | null>(null);

  const dragStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    cropX: number;
    cropY: number;
    cropW: number;
    cropH: number;
  } | null>(null);

  // Parse initial object position e.g. "50% 30%"
  const parsePos = useCallback((posStr: string) => {
    const parts = posStr.trim().split(/\s+/);
    const parsePart = (p?: string, def = 50) => {
      if (!p) return def;
      if (p === "center") return 50;
      if (p === "top" || p === "left") return 0;
      if (p === "bottom" || p === "right") return 100;
      const num = parseFloat(p);
      return isNaN(num) ? def : Math.max(0, Math.min(100, num));
    };
    return { x: parsePart(parts[0], 50), y: parsePart(parts[1], 50) };
  }, []);

  // Measure rendered image and initialize crop box
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const measure = () => {
      const w = img.clientWidth;
      const h = img.clientHeight;
      if (w <= 0 || h <= 0) return;

      setImgSize({ width: w, height: h });

      const targetAspect = targetWidth / Math.max(1, targetHeight);
      let cropW = w;
      let cropH = cropW / targetAspect;

      if (cropH > h) {
        cropH = h;
        cropW = cropH * targetAspect;
      }

      // Slightly inset if it spans 100% so users see the crop frame
      cropW = Math.max(40, Math.min(w, cropW));
      cropH = Math.max(40, Math.min(h, cropH));

      const { x: px, y: py } = parsePos(initialObjectPosition);
      const maxTravelX = Math.max(0, w - cropW);
      const maxTravelY = Math.max(0, h - cropH);
      const initX = maxTravelX > 0 ? (maxTravelX * px) / 100 : 0;
      const initY = maxTravelY > 0 ? (maxTravelY * py) / 100 : 0;

      setCrop({
        x: Math.round(initX),
        y: Math.round(initY),
        width: Math.round(cropW),
        height: Math.round(cropH),
      });
    };

    if (img.complete && img.naturalWidth > 0) {
      measure();
    } else {
      img.onload = measure;
    }
  }, [imgRef, targetWidth, targetHeight, initialObjectPosition, parsePos]);

  // Drag crop box (pan / reposition)
  const onMouseDownBox = (e: React.MouseEvent) => {
    if (!crop || !imgSize) return;
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      cropX: crop.x,
      cropY: crop.y,
      cropW: crop.width,
      cropH: crop.height,
    };
  };

  // Drag resize handle
  const onMouseDownHandle = (handle: string) => (e: React.MouseEvent) => {
    if (!crop || !imgSize) return;
    e.preventDefault();
    e.stopPropagation();

    setActiveHandle(handle);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      cropX: crop.x,
      cropY: crop.y,
      cropW: crop.width,
      cropH: crop.height,
    };
  };

  useEffect(() => {
    if (!isDragging && !activeHandle) return;

    const onMouseMove = (e: MouseEvent) => {
      const d = dragStartRef.current;
      if (!d || !imgSize || !crop) return;

      const dx = e.clientX - d.mouseX;
      const dy = e.clientY - d.mouseY;

      if (isDragging) {
        const maxX = Math.max(0, imgSize.width - d.cropW);
        const maxY = Math.max(0, imgSize.height - d.cropH);
        const nextX = Math.max(0, Math.min(maxX, d.cropX + dx));
        const nextY = Math.max(0, Math.min(maxY, d.cropY + dy));

        setCrop((prev) => (prev ? { ...prev, x: nextX, y: nextY } : prev));
      } else if (activeHandle) {
        // Resize keeping aspect ratio
        const aspect = targetWidth / Math.max(1, targetHeight);
        let nextW = d.cropW;
        let nextH = d.cropH;
        let nextX = d.cropX;
        let nextY = d.cropY;

        if (activeHandle.includes("e")) nextW = Math.max(40, d.cropW + dx);
        if (activeHandle.includes("s")) nextH = Math.max(40, d.cropH + dy);
        if (activeHandle.includes("w")) {
          const rawW = Math.max(40, d.cropW - dx);
          nextX = d.cropX + (d.cropW - rawW);
          nextW = rawW;
        }
        if (activeHandle.includes("n")) {
          const rawH = Math.max(40, d.cropH - dy);
          nextY = d.cropY + (d.cropH - rawH);
          nextH = rawH;
        }

        // Maintain aspect ratio for corner handles
        if (activeHandle.length === 2) {
          nextH = nextW / aspect;
        }

        // Clamp inside bounds
        nextW = Math.min(nextW, imgSize.width - Math.max(0, nextX));
        nextH = Math.min(nextH, imgSize.height - Math.max(0, nextY));
        nextX = Math.max(0, Math.min(imgSize.width - nextW, nextX));
        nextY = Math.max(0, Math.min(imgSize.height - nextH, nextY));

        setCrop({
          x: Math.round(nextX),
          y: Math.round(nextY),
          width: Math.round(nextW),
          height: Math.round(nextH),
        });
      }
    };

    const onMouseUp = () => {
      setIsDragging(false);
      setActiveHandle(null);
      dragStartRef.current = null;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, activeHandle, imgSize, crop, targetWidth, targetHeight]);

  if (!imgSize || !crop) return null;

  // Calculate normalized percentage (0% to 100%)
  const travelX = imgSize.width - crop.width;
  const travelY = imgSize.height - crop.height;
  const posX = travelX > 0 ? Math.round((crop.x / travelX) * 100) : 50;
  const posY = travelY > 0 ? Math.round((crop.y / travelY) * 100) : 50;

  const handleApply = () => {
    onApply(`${posX}% ${posY}%`);
  };

  const handleReset = () => {
    if (!imgSize) return;
    const midX = travelX > 0 ? Math.round(travelX / 2) : 0;
    const midY = travelY > 0 ? Math.round(travelY / 2) : 0;
    setCrop((prev) => (prev ? { ...prev, x: midX, y: midY } : prev));
  };

  return (
    <>
      {/* Crop Frame Box with backdrop shadow */}
      <div
        data-nova-crop-box=""
        onMouseDown={onMouseDownBox}
        style={{
          position: "absolute",
          left: crop.x,
          top: crop.y,
          width: crop.width,
          height: crop.height,
          border: `2px solid ${ACCENT}`,
          boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.62)",
          boxSizing: "border-box",
          cursor: isDragging ? "grabbing" : "grab",
          zIndex: 10,
          userSelect: "none",
        }}
      >
        {/* Rule of thirds grid lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gridTemplateRows: "1fr 1fr 1fr",
          }}
        >
          <div style={{ borderRight: "1px dashed rgba(255,255,255,0.3)", borderBottom: "1px dashed rgba(255,255,255,0.3)" }} />
          <div style={{ borderRight: "1px dashed rgba(255,255,255,0.3)", borderBottom: "1px dashed rgba(255,255,255,0.3)" }} />
          <div style={{ borderBottom: "1px dashed rgba(255,255,255,0.3)" }} />
          <div style={{ borderRight: "1px dashed rgba(255,255,255,0.3)", borderBottom: "1px dashed rgba(255,255,255,0.3)" }} />
          <div style={{ borderRight: "1px dashed rgba(255,255,255,0.3)", borderBottom: "1px dashed rgba(255,255,255,0.3)" }} />
          <div style={{ borderBottom: "1px dashed rgba(255,255,255,0.3)" }} />
        </div>

        {/* Top-left dimension badge */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: -24,
            background: ACCENT,
            color: "#ffffff",
            font: "600 11px system-ui, sans-serif",
            padding: "2px 6px",
            borderRadius: 3,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
          }}
        >
          {t.inspector.props.cropArea} ({crop.width} × {crop.height})
        </div>

        {/* Corner & edge resize handles */}
        {(["nw", "ne", "se", "sw", "n", "s", "e", "w"] as const).map((h) => {
          const isTop = h.includes("n");
          const isBottom = h.includes("s");
          const isLeft = h.includes("w");
          const isRight = h.includes("e");

          const top = isTop ? -5 : isBottom ? crop.height - 5 : crop.height / 2 - 5;
          const left = isLeft ? -5 : isRight ? crop.width - 5 : crop.width / 2 - 5;

          const cursor =
            h === "nw" || h === "se" ? "nwse-resize" :
            h === "ne" || h === "sw" ? "nesw-resize" :
            h === "n" || h === "s" ? "ns-resize" : "ew-resize";

          return (
            <div
              key={h}
              onMouseDown={onMouseDownHandle(h)}
              style={{
                position: "absolute",
                left,
                top,
                width: 10,
                height: 10,
                background: "#ffffff",
                border: `1.5px solid ${ACCENT}`,
                borderRadius: 2,
                cursor,
                pointerEvents: "auto",
                boxSizing: "border-box",
              }}
            />
          );
        })}
      </div>

      {/* Action Bar Floating Under Image */}
      <div
        data-nova-crop-controls=""
        style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 16px",
          background: "rgba(24, 24, 32, 0.94)",
          border: "1px solid rgba(255, 255, 255, 0.18)",
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          backdropFilter: "blur(16px)",
          zIndex: 100,
          pointerEvents: "auto",
        }}
      >
        <span
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 12,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {t.inspector.props.cropHint}
        </span>

        <span
          style={{
            color: "#c084fc",
            fontSize: 12,
            fontFamily: "monospace",
            fontWeight: 600,
            padding: "2px 6px",
            background: "rgba(168, 85, 247, 0.15)",
            borderRadius: 4,
          }}
        >
          Y: {posY}%
        </span>

        <button
          type="button"
          onClick={handleReset}
          title={t.inspector.props.resetCrop}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "#ffffff",
            padding: "5px 10px",
            borderRadius: 6,
            fontSize: 12,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span>↺</span>
          <span>{t.inspector.props.resetCrop}</span>
        </button>

        <button
          type="button"
          onClick={onCancel}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "rgba(255,255,255,0.8)",
            padding: "5px 12px",
            borderRadius: 6,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        <button
          type="button"
          data-testid="apply-crop-btn"
          onClick={handleApply}
          style={{
            background: "#7c3aed",
            border: "none",
            color: "#ffffff",
            fontWeight: 600,
            padding: "6px 16px",
            borderRadius: 6,
            fontSize: 12,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(124, 58, 237, 0.4)",
          }}
        >
          ✓ {t.inspector.props.applyCrop}
        </button>
      </div>
    </>
  );
}
