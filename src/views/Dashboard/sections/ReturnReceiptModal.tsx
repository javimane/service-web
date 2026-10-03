"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, QrCode } from "lucide-react";
import Modal from "@/components/Modal/Modal";
import "./ReturnReceiptModal.css";

type Props = { onClose: () => void; onReceive: (code: string) => Promise<void> };
type QrDetector = { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> };

export default function ReturnReceiptModal({ onClose, onReceive }: Props) {
  const [code, setCode] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [saving, setSaving] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!cameraActive) return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = async () => {
      try {
        const Detector = (window as Window & { BarcodeDetector?: new (options: object) => QrDetector }).BarcodeDetector;
        if (!Detector) throw new Error("Este navegador no permite leer QR con la cámara. Podés ingresar el código manualmente o usar un lector QR.");
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("No se puede acceder a la cámara. Ingresá el código manualmente.");
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (cancelled) { stream.getTracks().forEach((track) => track.stop()); return; }
        streamRef.current = stream;
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const detector = new Detector({ formats: ["qr_code"] });
        timer = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const found = await detector.detect(videoRef.current);
            if (found[0]?.rawValue) {
              setCode(found[0].rawValue.trim());
              setCameraActive(false);
            }
          } catch { /* siguiente cuadro */ }
        }, 600);
      } catch (error) {
        setCameraError((error as Error).message || "No se pudo iniciar la cámara.");
        setCameraActive(false);
      }
    };
    void start();
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [cameraActive]);

  const submit = async () => {
    const match = code.trim().match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (!match) { setCameraError("Ingresá un código QR de devolución válido."); return; }
    try { setSaving(true); await onReceive(match[0]); onClose(); }
    catch (error) { setCameraError((error as Error).message || "No se pudo registrar la recepción."); }
    finally { setSaving(false); }
  };

  return <Modal isOpen onClose={onClose} title="Registrar devolución recibida">
    <div className="return-receipt-modal">
      <p>Escaneá el QR del comprobante cuando el producto llegue a la sucursal. También podés ingresar el código que figura debajo del QR.</p>
      <label htmlFor="return-receipt-code">Código de devolución</label>
      <input id="return-receipt-code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="UUID del comprobante" autoFocus />
      <button type="button" className="return-receipt-modal__camera-button" onClick={() => { setCameraError(""); setCameraActive((active) => !active); }}><Camera size={16} />{cameraActive ? "Cerrar cámara" : "Escanear con cámara"}</button>
      {cameraActive && <video ref={videoRef} className="return-receipt-modal__video" muted playsInline aria-label="Vista de cámara para escanear QR" />}
      {cameraError && <p className="return-receipt-modal__error" role="alert">{cameraError}</p>}
      <div className="return-receipt-modal__actions">
        <button type="button" className="btn-secondary" data-action-tone="cancel" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn-primary" disabled={!code.trim() || saving} onClick={submit}><QrCode size={16} />{saving ? "Registrando..." : "Registrar recepción"}</button>
      </div>
    </div>
  </Modal>;
}
