import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import "./BarcodeScanner.css";

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string>("");
  
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0,
        supportedScanTypes: [0] // Camera scan only, no file upload
      },
      false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear();
        onScan(decodedText);
      },
      (errorMessage) => {
        // Ignoramos errores de escaneo temporal (pasa todo el tiempo mientras busca)
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [onScan]);

  return (
    <div className="barcode-scanner-overlay">
      <div className="barcode-scanner-modal">
        <div className="barcode-scanner-header">
          <h3>Escanear Código EAN</h3>
          <button onClick={onClose} className="barcode-scanner-close">✕</button>
        </div>
        {error && <div className="barcode-scanner-error">{error}</div>}
        <div id="reader" className="barcode-scanner-reader"></div>
        <p className="barcode-scanner-hint">
          Apunta la cámara al código de barras del producto.
        </p>
      </div>
    </div>
  );
}
