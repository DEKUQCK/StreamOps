import Link from "next/link";

export function ErrorScreen({
  reset,
  homeHref,
  homeLabel,
}: {
  reset: () => void;
  homeHref: string;
  homeLabel: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="card w-full max-w-sm p-6 text-center">
        <h1 className="text-xl font-semibold">Etwas ist schiefgelaufen</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Es gab ein unerwartetes Problem. Du kannst es nochmal versuchen oder
          zurückgehen.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button onClick={reset} className="btn-primary">
            Erneut versuchen
          </button>
          <Link href={homeHref} className="btn-secondary">
            {homeLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
