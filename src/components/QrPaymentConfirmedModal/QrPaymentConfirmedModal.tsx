"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Modal from "@/components/Modal/Modal";
import "./QrPaymentConfirmedModal.css";

type Props = {
  isOpen: boolean;
  onContinue: () => void;
};

export default function QrPaymentConfirmedModal({ isOpen, onContinue }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    if (!isOpen) return;
    setSecondsLeft(5);
    const interval = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && secondsLeft === 0) onContinue();
  }, [isOpen, onContinue, secondsLeft]);

  return (
    <Modal isOpen={isOpen} onClose={onContinue} title="Pago recibido">
      <div className="qr-payment-confirmed">
        <CheckCircle2 className="qr-payment-confirmed__icon" size={48} aria-hidden="true" />
        <p>¡Recibimos tu pago! Tu compra ya figura en Mis Compras.</p>
        <p className="qr-payment-confirmed__countdown">
          Te llevaremos allí en {secondsLeft} segundos.
        </p>
        <div className="qr-payment-confirmed__actions">
          <button type="button" className="btn-primary" onClick={onContinue}>
            Ir a Mis Compras <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </Modal>
  );
}
