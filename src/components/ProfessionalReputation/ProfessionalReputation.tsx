"use client";

import { useQuery } from "@tanstack/react-query";
import { Award, ShoppingBag } from "lucide-react";
import { commerceService } from "@/services/commerceService";
import "./ProfessionalReputation.css";

export function formatProfessionalSales(count: number): string {
  if (count > 10000) return "Más de 10000 ventas";
  if (count > 1000) return "Más de 1000 ventas";
  return `${count.toLocaleString("es-AR")} ${count === 1 ? "venta" : "ventas"}`;
}

export default function ProfessionalReputation({ professionalId }: { professionalId?: number | string | null }) {
  const id = Number(professionalId);
  const { data } = useQuery({
    queryKey: ["professional-public-reputation", id],
    queryFn: () => commerceService.getProfessionalReputation(id),
    enabled: Number.isSafeInteger(id) && id > 0,
    staleTime: 60_000,
  });
  if (!data) return null;
  return (
    <div className="professional-reputation" aria-label="Nivel y ventas del profesional">
      <span className="professional-reputation__item">
        <Award size={16} aria-hidden="true" />
        Nivel {data.medal || "Novato"}
      </span>
      <span className="professional-reputation__item">
        <ShoppingBag size={16} aria-hidden="true" />
        {formatProfessionalSales(data.sales_count)}
      </span>
    </div>
  );
}
