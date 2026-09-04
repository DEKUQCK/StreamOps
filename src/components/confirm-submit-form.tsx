"use client";

export function ConfirmSubmitForm({
  action,
  confirmMessage,
  className,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  confirmMessage: string | ((formData: FormData) => string);
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const message =
          typeof confirmMessage === "function"
            ? confirmMessage(new FormData(event.currentTarget))
            : confirmMessage;
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
