// A large soft glow over a dark background can show visible banding
// (8-bit color has too few steps for such a gradual falloff). A faint
// noise layer on top dithers that away without being visible itself.
const NOISE_BACKGROUND =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute left-1/2 top-[-15%] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/12 blur-[120px] dark:bg-primary/20" />
      <div className="absolute right-[-10%] top-[20%] h-[350px] w-[350px] rounded-full bg-primary/8 blur-[100px] dark:bg-primary/12" />
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay dark:opacity-[0.08]"
        style={{ backgroundImage: NOISE_BACKGROUND }}
      />
    </div>
  );
}
