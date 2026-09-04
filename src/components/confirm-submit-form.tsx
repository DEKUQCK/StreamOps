"use client";

export function ConfirmSubmitForm({
  action,
  confirmMessage,
  confirmFieldName,
  className,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  confirmMessage: string;
  /** Optional form field whose value is quoted onto confirmMessage at submit time. */
  confirmFieldName?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const detail = confirmFieldName
          ? new FormData(event.currentTarget).get(confirmFieldName)
          : null;
        const message = detail ? `${confirmMessage}\n\n„${detail}"` : confirmMessage;
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
      className={className}
    >
      {children}
    </form>
  );
}
