"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Landmark,
  Plus,
  Mail,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  CreditCard,
} from "lucide-react";
import { referralService } from "../../../services/referralService";
import { userDataBankService } from "../../../services/userDataBankService";
import "./DashboardReferrals.css";

export default function DashboardReferrals() {
  const queryClient = useQueryClient();
  
  // Bank Data States
  const [bankData, setBankData] = useState({
    cbu: "",
    alias: "",
  });
  const [bankError, setBankError] = useState<string | null>(null);
  const [bankSuccess, setBankSuccess] = useState(false);

  // Referral States
  const [referralEmail, setReferralEmail] = useState("");
  const [referralError, setReferralError] = useState<string | null>(null);

  // Queries
  const { data: bankDataFetched, isLoading: loadingBank } = useQuery({
    queryKey: ["user-bank-data"],
    queryFn: () => userDataBankService.getMy(),
    retry: (failureCount, error: any) => {
      if (error.message.includes("404")) return false;
      return failureCount < 3;
    }
  });

  const { data: referrals = [], isLoading: loadingReferrals } = useQuery({
    queryKey: ["user-referrals"],
    queryFn: () => referralService.listMy(),
    retry: (failureCount, error: any) => {
      if (error.message.includes("404")) return false;
      return failureCount < 3;
    }
  });

  // Sync bank data when fetched
  useEffect(() => {
    if (bankDataFetched) {
      setBankData({
        cbu: bankDataFetched.cbu || "",
        alias: bankDataFetched.alias || "",
      });
    }
  }, [bankDataFetched]);

  // Mutations
  const bankMutation = useMutation({
    mutationFn: userDataBankService.upsert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-bank-data"] });
      setBankSuccess(true);
      setTimeout(() => setBankSuccess(false), 3000);
      setBankError(null);
    },
    onError: (error: any) => {
      if (error.message.includes("404")) {
        setBankError("El servicio de datos bancarios no está disponible (404)");
      } else {
        setBankError("Error al guardar los datos bancarios. Reintentá.");
      }
    },
  });

  const referralMutation = useMutation({
    mutationFn: referralService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-referrals"] });
      setReferralEmail("");
      setReferralError(null);
    },
    onError: (error: any) => {
      if (error.message.includes("404")) {
        setReferralError("El servicio de referidos no está disponible (404)");
      } else {
        setReferralError("Error al agregar referido. Verificá el email.");
      }
    },
  });

  const handleBankSave = (e: React.FormEvent) => {
    e.preventDefault();
    setBankError(null);

    // Validation
    if (!/^\d{22}$/.test(bankData.cbu)) {
      setBankError("El CBU debe tener exactamente 22 números.");
      return;
    }

    if (!bankData.alias.trim()) {
      setBankError("El Alias es obligatorio.");
      return;
    }

    bankMutation.mutate(bankData);
  };

  const handleReferralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReferralError(null);

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(referralEmail)) {
      setReferralError("Ingresá un email válido.");
      return;
    }

    referralMutation.mutate(referralEmail);
  };

  return (
    <div className="dash-referrals">
      <header className="dash-referrals__header">
        <span className="dash-referrals__label">PROGRAMA</span>
        <h1 className="dash-referrals__title">Referidos</h1>
      </header>

      <div className="dash-referrals__grid">
        {/* Bank Data Section */}
        <section className="dash-referrals__section">
          <h2 className="dash-referrals__section-title">
            <Landmark size={20} />
            Datos de Cobro
          </h2>
          <p className="dash-referrals__field-desc" style={{ fontSize: '13px', color: 'rgba(0,0,0,0.5)', marginTop: '-12px' }}>
            Ingresá tu CBU o Alias para recibir los beneficios de tus referidos.
          </p>

          <form className="dash-referrals__form" onSubmit={handleBankSave}>
            <div className="dash-referrals__field">
              <label>CBU (22 dígitos)</label>
              <input
                type="text"
                placeholder="0000000000000000000000"
                maxLength={22}
                value={bankData.cbu}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setBankData({ ...bankData, cbu: val });
                }}
              />
            </div>

            <div className="dash-referrals__field">
              <label>Alias</label>
              <input
                type="text"
                placeholder="Ej: mi.alias.bancario"
                value={bankData.alias}
                onChange={(e) => setBankData({ ...bankData, alias: e.target.value })}
              />
            </div>

            {bankError && (
              <div className="dash-referrals__error">
                <AlertTriangle size={16} />
                <span>{bankError}</span>
              </div>
            )}

            {bankSuccess && (
              <div className="dash-referrals__success" style={{ color: '#00e676', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} />
                <span>Datos guardados correctamente</span>
              </div>
            )}

            <button
              type="submit"
              className="dash-referrals__btn"
              disabled={bankMutation.isPending || loadingBank}
            >
              {bankMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : "Guardar Datos"}
            </button>
          </form>
        </section>

        {/* Referrals Section */}
        <section className="dash-referrals__section">
          <h2 className="dash-referrals__section-title">
            <Users size={20} />
            Mis Referidos
          </h2>
          
          <form className="dash-referrals__form" onSubmit={handleReferralSubmit}>
            <div className="dash-referrals__field">
              <label>Email del referido</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={16} style={{ position: 'absolute', left: '16px', color: 'rgba(0,0,0,0.3)' }} />
                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  style={{ paddingLeft: '44px', width: '100%' }}
                  value={referralEmail}
                  onChange={(e) => setReferralEmail(e.target.value)}
                />
              </div>
            </div>

            {referralError && (
              <div className="dash-referrals__error">
                <AlertTriangle size={16} />
                <span>{referralError}</span>
              </div>
            )}

            <button
              type="submit"
              className="dash-referrals__btn"
              disabled={referralMutation.isPending}
            >
              {referralMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                  <Plus size={18} />
                  <span>Agregar Referido</span>
                </>
              )}
            </button>
          </form>

          <div className="dash-referrals__list-container">
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Historial</h3>
            {loadingReferrals ? (
              <div style={{ textAlign: 'center', padding: '20px' }}><Loader2 className="animate-spin" /></div>
            ) : referrals.length === 0 ? (
              <div className="dash-referrals__empty">
                Aún no tenés referidos agregados.
              </div>
            ) : (
              <div className="dash-referrals__referrals-list">
                {referrals.map((ref) => (
                  <div key={ref.id} className="dash-referrals__referral-item">
                    <div className="dash-referrals__referral-email">{ref.referred_email}</div>
                    <div className="dash-referrals__referral-date">
                      {new Date(ref.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
