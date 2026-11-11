"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock3, MapPin, Store } from "lucide-react";
import Link from "next/link";
import Modal from "../../../components/Modal/Modal";
import { commerceService } from "../../../services/commerceService";
import "./ProfileBranches.css";

export default function ProfileBranches({ professionalId }: { professionalId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: branches = [], isLoading, isError } = useQuery({
    queryKey: ["professional-branches", professionalId],
    queryFn: () => commerceService.professionalLocations(professionalId),
    enabled: isOpen && professionalId > 0,
  });

  return (
    <>
      <button className="profile-branches__trigger" type="button" onClick={() => setIsOpen(true)}>
        <Store size={16} /> Ver sucursales
      </button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Sucursales del profesional">
        {isLoading && <p className="profile-branches__message">Cargando sucursales…</p>}
        {isError && <p className="profile-branches__message">No se pudieron cargar las sucursales.</p>}
        {!isLoading && !isError && branches.length === 0 &&
          <p className="profile-branches__message">Este profesional todavía no publicó sucursales.</p>}
        <div className="profile-branches__list">
          {branches.map((branch) => {
            const address = [branch.street_name, branch.street_number].filter(Boolean).join(" ");
            const hasCoordinates = Number.isFinite(Number(branch.latitude)) &&
              Number.isFinite(Number(branch.longitude)) && Boolean(branch.latitude && branch.longitude);
            return (
              <article className="profile-branches__item" key={branch.id}>
                <div className="profile-branches__heading">
                  <Store size={18} />
                  <h3>{branch.is_main ? "Sucursal Principal" : branch.name}</h3>
                </div>
                <p>{address || "Dirección no especificada"}</p>
                {branch.delivery_eta_minutes != null &&
                  <p className="profile-branches__detail"><Clock3 size={15} /> Entrega estimada: {branch.delivery_eta_minutes} min</p>}
                {branch.phone && <p className="profile-branches__detail">Teléfono: {branch.phone}</p>}
                {hasCoordinates &&
                  <Link className="profile-branches__map-link" href={`/mapa?lat=${branch.latitude}&lng=${branch.longitude}`}>
                    <MapPin size={15} /> Ver en el mapa
                  </Link>}
              </article>
            );
          })}
        </div>
      </Modal>
    </>
  );
}
