import { useEffect, useState } from "react";
import { localDateNextDayUtc, localDateStartUtc } from "@/utils/localDateRange";
import "./DateRangeFilter.css";

export type DateRangeValue = { field: string; from: string; to: string };

interface DateRangeFilterProps {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}

export const toUtcDateRange = (value: DateRangeValue) => ({
  from: value.from ? localDateStartUtc(value.from) : undefined,
  to: value.to ? localDateNextDayUtc(value.to) : undefined,
});

export default function DateRangeFilter({ label, options, value, onChange }: DateRangeFilterProps) {
  const invalid = Boolean(value.from && value.to && value.from > value.to);
  const [timeZone, setTimeZone] = useState("");
  useEffect(() => setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone), []);

  return (
    <div className="date-range-filter" role="group" aria-label={label}>
      <label className="date-range-filter__field">
        <span>Fecha de</span>
        <select value={value.field} onChange={(event) => onChange({ ...value, field: event.target.value })}>
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <label className="date-range-filter__field">
        <span>Desde</span>
        <input type="date" value={value.from} onChange={(event) => onChange({ ...value, from: event.target.value })} />
      </label>
      <label className="date-range-filter__field">
        <span>Hasta</span>
        <input type="date" value={value.to} min={value.from || undefined} onChange={(event) => onChange({ ...value, to: event.target.value })} aria-invalid={invalid} />
      </label>
      {(value.from || value.to) && (
        <button type="button" className="date-range-filter__clear" onClick={() => onChange({ ...value, from: "", to: "" })}>
          Limpiar fechas
        </button>
      )}
      {timeZone && <span className="date-range-filter__zone">Zona horaria: {timeZone}</span>}
      {invalid && <span className="date-range-filter__error" role="alert">La fecha final debe ser igual o posterior a la inicial.</span>}
    </div>
  );
}
