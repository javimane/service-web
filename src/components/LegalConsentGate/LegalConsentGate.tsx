"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { legalConsentService } from "../../services/legalConsentService";
import "./LegalConsentGate.css";

function ConsentDialog({
  userId,
  logout,
}: {
  userId: string;
  logout: () => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const queryClient = useQueryClient();
  const key = ["legal-consent", userId];
  const status = useQuery({
    queryKey: key,
    queryFn: legalConsentService.get,
    retry: false,
    staleTime: 0,
  });
  const acceptance = useMutation({
    mutationFn: legalConsentService.accept,
    onSuccess: (data) => {
      queryClient.setQueryData(key, data);
    },
  });
  const visible =
    status.data?.requires_legal_consent === true ||
    (status.isError && !status.isFetching);
  useEffect(() => {
    if (visible && dialog.current && !dialog.current.open)
      dialog.current.showModal();
  }, [visible]);
  if (!visible) return null;
  return (
    <dialog
      ref={dialog}
      className="legal-consent"
      aria-labelledby="legal-consent-title"
      onCancel={(event) => event.preventDefault()}
    >
      <h2 id="legal-consent-title">Antes de continuar en Sercio</h2>
      <p>
        Leé y aceptá nuestros términos y condiciones y la política de privacidad
        para continuar con tu cuenta.
      </p>
      {status.isError ? (
        <>
          <p role="alert">
            No pudimos consultar tu aceptación. Revisá la conexión e intentá
            nuevamente.
          </p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => void status.refetch()}
          >
            Reintentar
          </button>
        </>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (terms && privacy && !acceptance.isPending) acceptance.mutate();
          }}
        >
          <label className="legal-consent__choice">
            <input
              type="checkbox"
              checked={terms}
              onChange={(event) => setTerms(event.target.checked)}
              disabled={acceptance.isPending}
            />
            <span>
              Acepto los{" "}
              <a href="/terminos" target="_blank" rel="noopener noreferrer">
                términos y condiciones
              </a>
              .
            </span>
          </label>
          <label className="legal-consent__choice">
            <input
              type="checkbox"
              checked={privacy}
              onChange={(event) => setPrivacy(event.target.checked)}
              disabled={acceptance.isPending}
            />
            <span>
              Acepto la{" "}
              <a href="/privacidad" target="_blank" rel="noopener noreferrer">
                política de privacidad
              </a>
              .
            </span>
          </label>
          {acceptance.isError && (
            <p role="alert">
              No se pudo guardar tu aceptación. Intentá nuevamente.
            </p>
          )}
          <button
            type="submit"
            className="btn-primary"
            disabled={!terms || !privacy || acceptance.isPending}
          >
            {acceptance.isPending && (
              <Loader2 className="legal-consent__spinner" aria-hidden="true" />
            )}
            {acceptance.isPending ? "Guardando…" : "Aceptar y continuar"}
          </button>
        </form>
      )}
      <div className="legal-consent__footer">
        <button
          type="button"
          className="btn-secondary"
          disabled={acceptance.isPending}
          onClick={() => void logout()}
        >
          Cerrar sesión
        </button>
      </div>
    </dialog>
  );
}
export default function LegalConsentGate() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  if (/^\/(?:terminos|privacidad)(?:\/|$)/.test(pathname || "")) return null;
  if (loading || !user?.id) return null;
  return <ConsentDialog key={user.id} userId={user.id} logout={logout} />;
}
