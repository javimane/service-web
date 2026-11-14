import { Utensils } from "lucide-react";
import "./GastronomicCheckbox.css";

export default function GastronomicCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="gastronomic-checkbox">
      <input
        className="gastronomic-checkbox__input"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <Utensils className="gastronomic-checkbox__icon" size={20} aria-hidden="true" />
      <span>Soy un comercio gastronómico</span>
    </label>
  );
}
