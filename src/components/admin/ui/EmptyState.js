// Substitui os blocos "card ... p-10 text-center italic" duplicados entre
// CustomersManager.js, ReviewsModerator.js e outros componentes de listagem.
export default function EmptyState({ icon = 'fa-inbox', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-base-200 flex items-center justify-center text-base-content/40 text-2xl">
        <i className={`fa-solid ${icon}`} aria-hidden="true"></i>
      </div>
      <p className="font-semibold text-base-content/70">{title}</p>
      {description && <p className="text-sm text-base-content/50 max-w-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
