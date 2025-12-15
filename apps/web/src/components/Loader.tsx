interface LoaderProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { width: 'w-40', height: 'h-1' },
  md: { width: 'w-56', height: 'h-1.5' },
  lg: { width: 'w-72', height: 'h-2' },
};

export default function Loader({ label = 'Cargando...', size = 'md', className = '' }: LoaderProps) {
  const s = sizeMap[size] || sizeMap.md;
  return (
    <div className={`flex items-center justify-center ${className}`} aria-busy="true" aria-live="polite" aria-label={label}>
      <style>
        {`
          @keyframes fl-sweep {
            0% { transform: translateX(-60%); }
            50% { transform: translateX(15%); }
            100% { transform: translateX(120%); }
          }
        `}
      </style>
      <div className={`relative ${s.width} ${s.height} overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800/60`}> 
        <div
          className="absolute inset-y-0 left-[-40%] w-2/5 rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-500"
          style={{ animation: 'fl-sweep 1.1s ease-in-out infinite' }}
        />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
