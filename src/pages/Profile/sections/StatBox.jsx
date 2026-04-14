export default function StatBox({ icon, label, sub, color }) {
  return (
    <div
      className={`${color} p-4 rounded-2xl flex flex-col items-center justify-center border border-white/5`}
    >
      <div className="mb-1">{icon}</div>
      <span className="text-xl font-bold">{label}</span>
      <span className="text-[8px] mt-1 font-bold tracking-tighter opacity-70">
        {sub}
      </span>
    </div>
  );
}
