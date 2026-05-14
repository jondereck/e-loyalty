"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Camera, Loader2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function QRScanner({
  branchId,
  recentScans,
}: {
  branchId?: string;
  recentScans?: Array<{
    id: string;
    initials: string;
    title: string;
    detail: string;
    status: string;
    tone: "approved" | "pending" | "rejected";
  }>;
}) {
  const id = useId().replaceAll(":", "");
  const scannerRef = useRef<{ clear: () => Promise<void> } | null>(null);
  const [manualToken, setManualToken] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submitToken = useCallback(async (token: string) => {
    if (!token.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/visits/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanCode: token.trim(), branchId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Scan failed.");
      window.location.href = `/cashier/scan/result/${result.id}`;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Scan failed.");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        const { Html5QrcodeScanner } = await import("html5-qrcode");
        if (!mounted) return;
        const scanner = new Html5QrcodeScanner(
          id,
          { fps: 8, qrbox: { width: 240, height: 240 } },
          false,
        );
        scanner.render(
          (decodedText) => {
            void submitToken(decodedText);
          },
          () => undefined,
        );
        scannerRef.current = scanner;
      } catch {
        setMessage("Camera scanner is unavailable in this browser. Use manual QR token or card number entry.");
      }
    }

    void boot();
    return () => {
      mounted = false;
      void scannerRef.current?.clear();
    };
  }, [id, submitToken]);

  return (
    <div className="lp-scan-workspace">
      <section className="lp-scan-panel lp-scan-panel-primary">
        <div className="lp-scan-panel-head">
          <div>
            <h2>Scan customer QR</h2>
            <p>Place the QR code inside the frame or enter the customer card number below.</p>
          </div>
          <span className="lp-scan-live-badge">Camera ready</span>
        </div>
        <div className="lp-scanner-box">
          <div className="scanner">
            <div id={id} style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 320 }} />
          </div>
        </div>
        {message ? <p className="error-text" style={{ marginTop: 14 }}>{message}</p> : null}
        <div className="field lp-scan-manual-field">
          <label htmlFor="manual-qr">Manual QR token or card number</label>
          <div className="lp-scan-input-row">
            <input
              id="manual-qr"
              value={manualToken}
              onChange={(event) => setManualToken(formatManualScanCode(event.target.value))}
              placeholder="LP-2026-ABCD-1234"
              autoCapitalize="characters"
              autoComplete="off"
            />
            <Button variant="primary" disabled={loading} onClick={() => submitToken(manualToken)}>
              {loading ? <Loader2 size={18} /> : <ScanLine size={18} />}
              Resolve Scan
            </Button>
          </div>
        </div>
      </section>
      <section className="lp-scan-panel lp-scan-recent-panel">
        <div className="lp-scan-panel-head">
          <div>
            <h2><Camera size={18} /> Recent scans</h2>
            <p>Latest cashier activity from this branch.</p>
          </div>
        </div>
        <div className="lp-scan-list">
          {(recentScans ?? []).map((scan) => (
            <div className="lp-scan-item" key={scan.id}>
              <span className="lp-scan-avatar">{scan.initials}</span>
              <div>
                <b>{scan.title}</b>
                <small>{scan.detail}</small>
              </div>
              <strong className={scan.tone}>{scan.status}</strong>
            </div>
          ))}
          {!recentScans?.length ? <p className="muted">Recent scans will appear after cashier activity.</p> : null}
        </div>
      </section>
    </div>
  );
}

function formatManualScanCode(value: string) {
  const input = value.trimStart();
  if (!input) return "";

  // Long/mixed secure QR tokens must pass through unchanged.
  if (!input.toUpperCase().startsWith("LP") && input.length > 19) {
    return input;
  }

  const compact = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = compact.startsWith("LP") ? compact.slice(2) : compact;
  const groups = [body.slice(0, 4), body.slice(4, 8), body.slice(8, 12)].filter(Boolean);

  return groups.length ? `LP-${groups.join("-")}` : "LP";
}
