import React from "react";
// Importamos de manera dinámica la bolsa completa de iconos de lucide-react
import * as LucideIcons from "lucide-react";

type CategoryCardProps = {
  category: any;
  onClick?: () => void;
};

const COLORS = [
  "#EF4444",
  "#F97316",
  "#F59E0B",
  "#EAB308",
  "#84CC16",
  "#10B981",
  "#06B6D4",
  "#0891B2",
  "#3B82F6",
  "#6366F1",
  "#A78BFA",
  "#EC4899",
  "#F472B6",
  "#FB7185",
  "#EF9A9A",
  "#A3E635",
  "#34D399",
  "#60A5FA",
  "#4ADE80",
  "#FCD34D",
  "#FCA5A5",
  "#C084FC",
  "#FDE68A",
  "#9CA3AF",
  "#6EE7B7",
];

// 1. Mapeamos de manera explícita cada ID con el string del icono de Lucide
const ICON_MAPPING: Record<number, keyof typeof LucideIcons> = {
  38: "DoorOpen", // Aberturas
  1: "BrickWall", // Albañil
  2: "DraftingCompass", // Arquitectura
  3: "Scale", // Asesoramiento Contable y Legal
  4: "Sparkles", // Belleza y Cuidado Personal
  37: "AirVent", // Climatización
  5: "Palette", // Comunicación y Diseño
  6: "Construction", // Construcción
  7: "GraduationCap", // Cursos y Clases
  8: "Bike", // Delivery
  33: "Dumbbell", // Educación Física
  9: "Zap", // Electricista
  10: "PartyPopper", // Fiestas y Eventos
  11: "Film", // Fotografía, Música y Cine
  32: "LifeBuoy", // Guardavidas
  12: "Printer", // Imprenta
  13: "Factory", // Industrial
  14: "HardHat", // Ingeniería Civil
  16: "SprayCan", // Limpieza
  34: "Waves", // Mantenimiento de Piscinas
  17: "CarFront", // Mantenimiento de Vehículos
  31: "Wrench", // Mecánicos
  18: "HeartPulse", // Medicina y Salud
  35: "Armchair", // Muebles y Maderas
  19: "Pipette", // Plomería
  20: "Shirt", // Ropa y Moda
  21: "ShieldCheck", // Seguridad
  22: "Baby", // Servicio de Niñera
  23: "Pickaxe", // Servicio Minero
  24: "Droplet", // Servicio Petrolero
  39: "Nut", // Servicio Técnico
  25: "FileCheck2", // Servicios de Aduana
  36: "Paintbrush", // Servicios de Pintura
  26: "Footprints", // Servicios para Mascota
  27: "Briefcase", // Servicios para Oficinas
  28: "Cpu", // Tecnología
  29: "Truck", // Transporte
  30: "Compass", // Viajes y Turismo
};

function IconById({ id, size = 32 }: { id: number; size?: number }) {
  // Buscamos el nombre del string asignado a ese ID
  const iconName = ICON_MAPPING[id];

  // Obtenemos el componente real desde el objeto importado de Lucide
  // Si por alguna razón el ID no existe, usamos "HelpCircle" como fallback de emergencia
  const IconComponent = (
    iconName ? LucideIcons[iconName] : LucideIcons.HelpCircle
  ) as React.ComponentType<any>;

  // Para los colores, calculamos el color del icono; el fondo del cuadro será gris vía CSS
  const color = COLORS[id % COLORS.length] ?? "#666";

  return <IconComponent size={size} color={color} strokeWidth={2.5} />;
}

export default function CategoryCard({ category, onClick }: CategoryCardProps) {
  const id = category?.id ?? 0;
  const label = category?.name ?? category?.label ?? `Cat ${id}`;

  const words = String(label).trim().split(/\s+/);
  const first = words[0] ?? "";
  const rest = words.slice(1).join(" ");

  return (
    <article className="cat-minimal-card" onClick={onClick}>
      <div className="cat-minimal-card__icon-box">
        <IconById id={id} size={36} />
      </div>
      <h3 className="cat-minimal-card__label">
        {rest ? (
          <>
            <span className="cat-label-line">{first}</span>
            <br />
            <span className="cat-label-line">{rest}</span>
          </>
        ) : (
          <span className="cat-label-line">{first}</span>
        )}
      </h3>
    </article>
  );
}
