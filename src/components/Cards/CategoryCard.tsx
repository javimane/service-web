import { 
  Palette, 
  Wrench, 
  Cpu, 
  Leaf, 
  Map, 
  Lightbulb,
  Heart,
  Coffee,
  Home,
  Shirt,
  GraduationCap,
  PawPrint,
  HelpCircle 
} from "lucide-react";
import "./CategoryCard.css";

type CategoryCardProps = {
  category: any;
  onClick?: () => void;
};

// Icon Mapping based on Name or Label
const ICON_MAP: Record<string, { icon: any, color: string }> = {
  'Interior Design': { icon: Palette, color: "#9c27b0" },
  'Engineering': { icon: Wrench, color: "#1976d2" },
  'Smart Systems': { icon: Cpu, color: "#00bcd4" },
  'Paisajismo': { icon: Leaf, color: "#22c55e" },
  'Urbanismo': { icon: Map, color: "#f97316" },
  'Iluminación': { icon: Lightbulb, color: "#eab308" },
  'Salud': { icon: Heart, color: "#10b981" },
  'Alimentos': { icon: Coffee, color: "#92400e" },
  'Hogar': { icon: Home, color: "#3b82f6" },
  'Moda': { icon: Shirt, color: "#ec4899" },
  'Educación': { icon: GraduationCap, color: "#6366f1" },
  'Mascotas': { icon: PawPrint, color: "#f59e0b" },
};

export default function CategoryCard({
  category,
  onClick,
}: CategoryCardProps) {
  const { label } = category;
  
  const mapping = ICON_MAP[label] || { icon: HelpCircle, color: "#666" };
  const IconComponent = mapping.icon;

  return (
    <article className="cat-minimal-card" onClick={onClick}>
      <div className="cat-minimal-card__icon-box">
        <IconComponent size={32} color={mapping.color} strokeWidth={2.5} />
      </div>
      <h3 className="cat-minimal-card__label">{label}</h3>
    </article>
  );
}
