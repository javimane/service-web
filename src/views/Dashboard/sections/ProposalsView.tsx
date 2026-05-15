"use client";
import { useState, useEffect } from "react";
import {
  FileText,
  CheckCircle,
  Clock,
  ExternalLink,
  Download,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import {
  acceptProposalAction,
  getReceivedProposalsAction,
  getSentProposalsAction,
} from "../../../app/actions/proposals";
import type { ProfessionalProposalRow } from "../../../types/database.types";
import "./ProposalsView.css";

type TabType = "received" | "sent";

export default function ProposalsView() {
  const { hasProfessionalSubscription } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>("received");
  const [receivedProposals, setReceivedProposals] = useState<
    ProfessionalProposalRow[]
  >([]);
  const [sentProposals, setSentProposals] = useState<ProfessionalProposalRow[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProposals();
  }, [hasProfessionalSubscription]);

  const fetchProposals = async () => {
    setIsLoading(true);
    try {
      // Always fetch received proposals
      const receivedResult = await getReceivedProposalsAction();
      setReceivedProposals(receivedResult?.data ?? []);

      // Only fetch sent proposals if they are a professional
      if (hasProfessionalSubscription) {
        try {
          const sentResult = await getSentProposalsAction();
          setSentProposals(sentResult?.data ?? []);
        } catch (error) {
          console.error("Error fetching sent proposals:", error);
          // Don't break the whole page if sent fails
        }
      }
    } catch (error) {
      console.error("Error fetching proposals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      setAcceptingId(id);
      const result = await acceptProposalAction({ id });
      if (result?.serverError) throw new Error(result.serverError);

      // Update local state to reflect accepted status
      setReceivedProposals((prev) =>
        prev.map((p) => (p.id === id ? { ...p, accepted: true } : p)),
      );
    } catch (error) {
      console.error("Error accepting proposal:", error);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleViewFile = (url: string) => {
    window.open(url, "_blank");
  };

  const renderProposalCard = (
    proposal: ProfessionalProposalRow,
    isReceived: boolean,
  ) => {
    const isAccepted = proposal.accepted;
    const date = new Date(proposal.created_at).toLocaleDateString();

    return (
      <div key={proposal.id} className="proposal-card">
        <div className="proposal-card__header">
          <div className="proposal-card__info">
            <h3 className="proposal-card__name">
              {isReceived ? proposal.professional_name : "Presupuesto Enviado"}
            </h3>
            <span className="proposal-card__date">Emitido el {date}</span>
          </div>
          <div
            className={`proposal-status ${isAccepted ? "proposal-status--accepted" : "proposal-status--pending"}`}
          >
            {isAccepted ? (
              <>
                <CheckCircle size={12} />
                Aceptado
              </>
            ) : (
              <>
                <Clock size={12} />
                Pendiente
              </>
            )}
          </div>
        </div>

        <div className="proposal-card__actions">
          <button
            type="button"
            className="btn-proposal btn-proposal-view"
            onClick={() => handleViewFile(proposal.file_url)}
          >
            <FileText size={16} />
            Ver Archivo
          </button>

          {isReceived && !isAccepted && (
            <button
              type="button"
              className="btn-proposal btn-proposal-accept"
              onClick={() => handleAccept(proposal.id)}
              disabled={acceptingId === proposal.id}
            >
              <CheckCircle size={16} />
              {acceptingId === proposal.id ? "Aceptando..." : "Aceptar"}
            </button>
          )}
        </div>
      </div>
    );
  };

  const currentProposals =
    activeTab === "received" ? receivedProposals : sentProposals;

  return (
    <div className="proposals-view">
      <header className="proposals-view__header">
        <span className="proposals-view__label">GESTIÓN DOCUMENTAL</span>
        <h1 className="proposals-view__title">Presupuestos</h1>
      </header>

      {hasProfessionalSubscription && (
        <div className="proposals-view__tabs">
          <button
            type="button"
            className={`proposals-tab ${activeTab === "received" ? "active" : ""}`}
            onClick={() => setActiveTab("received")}
          >
            Recibidos
            <span className="proposals-tab-count">
              {receivedProposals.length}
            </span>
          </button>
          <button
            type="button"
            className={`proposals-tab ${activeTab === "sent" ? "active" : ""}`}
            onClick={() => setActiveTab("sent")}
          >
            Enviados
            <span className="proposals-tab-count">{sentProposals.length}</span>
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="loading-container">Cargando presupuestos...</div>
      ) : currentProposals.length === 0 ? (
        <div className="proposals-empty">
          <FileText size={48} opacity={0.5} />
          <p>
            No hay presupuestos{" "}
            {activeTab === "received" ? "recibidos" : "enviados"} aún.
          </p>
        </div>
      ) : (
        <div className="proposals-grid">
          {currentProposals.map((p) =>
            renderProposalCard(p, activeTab === "received"),
          )}
        </div>
      )}
    </div>
  );
}
