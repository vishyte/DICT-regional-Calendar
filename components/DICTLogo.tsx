const LOGO_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%231e40af'/%3E%3Ctext x='50' y='60' font-family='Arial' font-size='32' fill='white' text-anchor='middle'%3EDICT%3C/text%3E%3C/svg%3E";

// The public folder is accessible as "/dict-logo.png" from root
export function DICTLogo({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}assets/DICT-Logo-Final-2-300x153.png`}
      alt="DICT Logo"
      className={className}
      onError={e => {
        e.currentTarget.src = LOGO_FALLBACK;
      }}
    />
  );
}
