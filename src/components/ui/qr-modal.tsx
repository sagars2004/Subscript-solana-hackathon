"use client";

import { useEffect, useState } from "react";

// Dynamically use qrcode to render data URL
export function QrModal({
  url,
  title,
  isOpen,
  onClose,
}: {
  url: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !url) return;
    let isCancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const QRCode = require("qrcode");
    QRCode.toDataURL(url, { margin: 2, width: 260, color: { dark: "#111318", light: "#ffffff" } })
      .then((data: string) => {
        if (!isCancelled) setDataUrl(data);
      })
      .catch((err: unknown) => {
        console.error("QR Code generation error:", err);
      });
    return () => {
      isCancelled = true;
    };
  }, [isOpen, url]);

  if (!isOpen) return null;

  async function copyUrl() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="wallet-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="qr-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="wallet-close" type="button" onClick={onClose} aria-label="Close QR Code">
          ×
        </button>
        <p className="eyebrow">Scan to subscribe</p>
        <h2>{title}</h2>
        <p className="qr-modal-subtitle">Scan with your mobile wallet camera to open checkout.</p>
        <div className="qr-image-container">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt={`QR code for ${title}`} width={220} height={220} className="qr-image" />
          ) : (
            <div className="qr-placeholder">Generating QR code…</div>
          )}
        </div>
        <div className="link-row" style={{ marginTop: "18px" }}>
          <code>{url}</code>
          <button type="button" onClick={copyUrl}>
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}

