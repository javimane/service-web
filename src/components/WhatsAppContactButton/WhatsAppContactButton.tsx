"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAlert } from "@/context/AlertContext";
import { getProfessionalDetailAction } from "@/app/actions/professionals";
import "./WhatsAppContactButton.css";

export function extractPhoneNumber(data: any): string | null {
  if (!data) return null;

  const phone =
    data.phone ||
    data.phone_number ||
    data.Profile?.phone ||
    data.Profile?.phone_number ||
    data.profile?.phone ||
    data.profile?.phone_number ||
    data.Professional?.phone ||
    data.Professional?.phone_number ||
    data.Professional?.Profile?.phone ||
    data.Professional?.Profile?.phone_number ||
    data.Professional?.profile?.phone ||
    data.Professional?.profile?.phone_number ||
    data.professional?.phone ||
    data.professional?.phone_number ||
    data.professional?.profile?.phone ||
    data.professional?.profile?.phone_number ||
    data.Company?.phone ||
    data.Company?.phone_number ||
    data.company?.phone ||
    data.company?.phone_number ||
    (Array.isArray(data.companies) &&
      (data.companies[0]?.phone || data.companies[0]?.phone_number)) ||
    (Array.isArray(data.Companies) &&
      (data.Companies[0]?.phone || data.Companies[0]?.phone_number)) ||
    null;

  return phone ? String(phone).trim() : null;
}

export function buildWhatsAppUrl(phone: string, message?: string): string {
  let clean = phone.replace(/\D/g, "");

  // Si comienza con 0 (código interurbano en Argentina sin discar el 0 internacional)
  if (clean.startsWith("0")) {
    clean = clean.substring(1);
  }

  // Si es un número argentino de 10 dígitos (ej. 11xxxxxxxx o 261xxxxxxx) sin código 54
  if (clean.length === 10) {
    clean = `549${clean}`;
  } else if (
    clean.length === 11 &&
    clean.startsWith("54") &&
    !clean.startsWith("549")
  ) {
    clean = `549${clean.slice(2)}`;
  } else if (!clean.startsWith("54") && clean.length > 6 && clean.length <= 11) {
    clean = `549${clean}`;
  }

  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${clean}${query}`;
}

export interface WhatsAppContactButtonProps {
  phone?: string | null;
  phoneNumber?: string | null;
  professionalId?: string | number | null;
  professional?: any;
  profile?: any;
  message?: string;
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function WhatsAppContactButton({
  phone,
  phoneNumber,
  professionalId,
  professional,
  profile,
  message,
  label = "Contactar por WhatsApp",
  className = "",
  size = "md",
}: WhatsAppContactButtonProps) {
  const { showError } = useAlert();

  const directPhone =
    phone ||
    phoneNumber ||
    extractPhoneNumber(profile) ||
    extractPhoneNumber(professional);

  const { data: fetchedProfessional, isLoading } = useQuery({
    queryKey: ["professional-whatsapp-phone", professionalId],
    queryFn: async () => {
      if (!professionalId) return null;
      const res = await getProfessionalDetailAction({ id: professionalId });
      return res?.data ?? null;
    },
    enabled: !directPhone && !!professionalId,
    staleTime: 1000 * 60 * 10,
  });

  const resolvedPhone = directPhone || extractPhoneNumber(fetchedProfessional);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (resolvedPhone) {
      const url = buildWhatsAppUrl(resolvedPhone, message);
      window.open(url, "_blank", "noopener,noreferrer");
    } else if (isLoading) {
      // Cargando datos
    } else {
      showError(
        "El comercio o profesional no tiene registrado un número de WhatsApp disponible.",
      );
    }
  };

  const sizeClass =
    size === "sm"
      ? "whatsapp-contact-btn--sm"
      : size === "lg"
        ? "whatsapp-contact-btn--lg"
        : "";

  return (
    <button
      type="button"
      className={`whatsapp-contact-btn ${sizeClass} ${className}`.trim()}
      onClick={handleClick}
      disabled={isLoading}
      title="Contactar directamente por WhatsApp"
    >
      {isLoading ? (
        <Loader2 className="animate-spin whatsapp-contact-btn__spinner" size={18} />
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
          className="whatsapp-contact-btn__icon"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
      )}
      <span>{label}</span>
    </button>
  );
}
