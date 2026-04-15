export default function MultiChoiceChips({ values, onToggle, options }) {
  return (
    <div className="multi-chip-group">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`multi-chip ${values.includes(option) ? "active" : ""}`}
          onClick={() => onToggle(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
