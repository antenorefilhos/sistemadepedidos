// Card de estatística único — antes cada tela reimplementava o próprio (com/sem ícone,
// <h2>/<h4>/<h3>/<div> trocados, opacidades e tamanhos diferentes): Orçamentos, Clientes
// e Telemetria tinham 3 variantes visuais distintas para o mesmo tipo de informação.
const TONE_CLASSES = {
  primary: 'bg-primary/15 text-primary',
  success: 'bg-success/15 text-success',
  info: 'bg-info/15 text-info',
  warning: 'bg-warning/15 text-warning',
  error: 'bg-error/15 text-error',
  wine: 'bg-[var(--color-wine)]/15 text-[var(--color-wine)]',
};

const CAPTION_TONE_CLASSES = {
  default: 'text-base-content/50',
  warning: 'text-warning font-semibold',
};

export default function StatCard({ icon, iconStyle = 'fa-solid', tone = 'primary', label, value, caption, captionTone = 'default' }) {
  return (
    <div className="card bg-base-100 shadow-md border border-base-200 hover:shadow-lg transition-all duration-200">
      <div className="card-body p-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-base-content/70">{label}</span>
          {icon && (
            <div className={`p-2 rounded-lg ${TONE_CLASSES[tone] || TONE_CLASSES.primary}`}>
              <i className={`${iconStyle} ${icon} text-lg`} aria-hidden="true"></i>
            </div>
          )}
        </div>
        <div className="text-2xl font-black text-base-content tracking-tight tabular-nums">{value}</div>
        {caption && <div className={`text-xs mt-2 ${CAPTION_TONE_CLASSES[captionTone] || CAPTION_TONE_CLASSES.default}`}>{caption}</div>}
      </div>
    </div>
  );
}
