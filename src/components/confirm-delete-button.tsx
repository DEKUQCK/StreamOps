"use client";

export function ConfirmDeleteButton({
  action,
  confirmMessage,
  children,
  className,
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <button type="submit" className={className ?? "btn-danger px-3 py-1 text-xs"}>
        {children}
      </button>
    </form>
  );
}
