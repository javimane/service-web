export default function ChoicePills({ value, onChange, options }) {
  return (
    <div className="choice-pills">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`choice-pill ${value === option.value ? "active" : ""}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
