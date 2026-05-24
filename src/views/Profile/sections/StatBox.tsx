import "./StatBox.css";

export default function StatBox({ icon, label, sub, color }) {
  return (
    <div
      className={`stat-box stat-box--${color}`}
    >
      <div className="stat-box__icon">{icon}</div>
      <span className="stat-box__label">{label}</span>
      <span className="stat-box__sub">
        {sub}
      </span>
    </div>
  );
}
