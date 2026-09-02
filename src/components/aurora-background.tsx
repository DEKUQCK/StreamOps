export function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute left-1/2 top-[-15%] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/12 blur-[120px] dark:bg-primary/20" />
      <div className="absolute right-[-10%] top-[20%] h-[350px] w-[350px] rounded-full bg-primary/8 blur-[100px] dark:bg-primary/12" />
    </div>
  );
}
