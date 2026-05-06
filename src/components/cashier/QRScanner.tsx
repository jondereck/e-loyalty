"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Camera, Loader2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function QRScanner({
  branchId,
  recentScans,
}: {
  branchId?: string;
  recentScans?: Array<{ id: string; label: string; status: string }>;
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
        body: JSON.stringify({ qrToken: token.trim(), branchId }),
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
        setMessage("Camera scanner is unavailable in this browser. Use manual QR token entry.");
      }
    }

    void boot();
    return () => {
      mounted = false;
      void scannerRef.current?.clear();
    };
  }, [id, submitToken]);

  return (
    <div className="grid two">
      <div className="card">
        <div className="scanner">
          <div id={id} style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 320 }} />
        </div>
        {message ? <p className="error-text" style={{ marginTop: 14 }}>{message}</p> : null}
        <div className="field" style={{ marginTop: 18 }}>
          <label htmlFor="manual-qr">Manual QR token</label>
          <input
            id="manual-qr"
            value={manualToken}
            onChange={(event) => setManualToken(event.target.value)}
            placeholder="Paste customer qrToken"
          />
        </div>
        <Button variant="primary" disabled={loading} onClick={() => submitToken(manualToken)}>
          {loading ? <Loader2 size={18} /> : <ScanLine size={18} />}
          Resolve QR
        </Button>
      </div>
      <div className="card">
        <h3><Camera size={20} /> Recent scans</h3>
        <div className="list">
          {(recentScans ?? []).map((scan) => (
            <div className="row" key={scan.id}>
              <span>{scan.label}</span>
              <strong>{scan.status}</strong>
            </div>
          ))}
          {!recentScans?.length ? <p className="muted">Recent scans will appear after cashier activity.</p> : null}
        </div>
      </div>
    </div>
  );
}
