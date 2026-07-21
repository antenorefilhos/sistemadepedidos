const SIZE_CLASSES = {
  xs: 'loading-xs',
  sm: 'loading-sm',
  md: 'loading-md',
  lg: 'loading-lg',
};

// Padroniza as 4 variações de tamanho/cor de spinner hoje espalhadas pelo admin.
export default function LoadingSpinner({ size = 'md', label, fullscreen = false, className = '' }) {
  const spinner = (
    <span
      className={`loading loading-spinner text-primary ${SIZE_CLASSES[size] || SIZE_CLASSES.md} ${className}`}
      role="status"
      aria-label={label || 'Carregando'}
    ></span>
  );

  if (!fullscreen) return spinner;

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-base-content/60">
      {spinner}
      {label && <span className="font-medium">{label}</span>}
    </div>
  );
}
