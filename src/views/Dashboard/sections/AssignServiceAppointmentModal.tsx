"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import Modal from "@/components/Modal/Modal";
import { commerceService, OrderSummary } from "@/services/commerceService";
import { useAlert } from "@/context/AlertContext";
import "./AssignServiceAppointmentModal.css";

interface AssignServiceAppointmentModalProps {
  order: OrderSummary;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignServiceAppointmentModal({
  order,
  isOpen,
  onClose,
  onSuccess,
}: AssignServiceAppointmentModalProps) {
  const { showSuccess, showError } = useAlert();

  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [todayString, setTodayString] = useState("");

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const formatted = `${year}-${month}-${day}`;
    setTodayString(formatted);
    setDate(formatted);
  }, []);

  const serviceName = order.service?.name || "Servicio contratado";
  const clientName =
    order.buyer?.full_name ||
    order.user?.full_name ||
    "Cliente";

  const timeSlots: string[] = [];
  for (let h = 8; h <= 20; h++) {
    const hourStr = String(h).padStart(2, "0");
    timeSlots.push(`${hourStr}:00`);
    timeSlots.push(`${hourStr}:30`);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      showError("Por favor selecciona una fecha válida.");
      return;
    }
    if (!time) {
      showError("Por favor selecciona un horario para el turno.");
      return;
    }

    try {
      setIsSubmitting(true);
      await commerceService.assignServiceAppointment(order.id, {
        appointment_date: date,
        appointment_time: time,
        notes: notes.trim() || undefined,
      });
      showSuccess("¡Turno asignado exitosamente y notificado al cliente!");
      onSuccess();
      onClose();
    } catch (err: any) {
      showError(err?.message || "No se pudo programar el turno.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Programar Turno de Servicio">
      <div className="assign-appointment-modal">
        <p className="assign-appointment-modal__desc">
          Este pedido corresponde a la compra de un servicio. Es obligatorio
          coordinar y asignar el turno para que el cliente pueda presentarse.
        </p>

        <div className="assign-appointment-modal__highlight">
          <span className="assign-appointment-modal__service-name">
            {serviceName}
          </span>
          <span className="assign-appointment-modal__client-name">
            Cliente: {clientName}
          </span>
        </div>

        <form className="assign-appointment-modal__form" onSubmit={handleSubmit}>
          <div className="assign-appointment-modal__grid">
            <div className="assign-appointment-modal__field">
              <label className="assign-appointment-modal__label">
                <Calendar size={14} /> Fecha del Turno*
              </label>
              <input
                type="date"
                required
                min={todayString}
                className="assign-appointment-modal__input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="assign-appointment-modal__field">
              <label className="assign-appointment-modal__label">
                <Clock size={14} /> Horario del Turno*
              </label>
              <select
                required
                className="assign-appointment-modal__select"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              >
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot} hs
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="assign-appointment-modal__field">
            <label className="assign-appointment-modal__label">
              Indicaciones o Notas para el Cliente (Opcional)
            </label>
            <textarea
              className="assign-appointment-modal__textarea"
              placeholder="Ej: Presentarse 10 minutos antes con documento de identidad o comprobante."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="assign-appointment-modal__actions">
            <button data-action-tone="cancel"
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Programando turno..."
                : "Confirmar y Notificar al Cliente"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
