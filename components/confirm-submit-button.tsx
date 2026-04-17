"use client";

import { useId, useState, type ButtonHTMLAttributes, type MouseEvent } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type ConfirmSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  confirmMessage: string;
  confirmTitle?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function ConfirmSubmitButton({
  confirmMessage,
  confirmTitle = "Please confirm this action",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  type = "submit",
  variant = "primary",
  onClick,
  ...props
}: ConfirmSubmitButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const modalTitleId = useId();

  function handlePrimaryClick(event: MouseEvent<HTMLButtonElement>) {
    if (type === "submit") {
      event.preventDefault();
      setIsOpen(true);
      return;
    }

    onClick?.(event);
  }

  function handleConfirm(event: MouseEvent<HTMLButtonElement>) {
    const button = event.currentTarget;
    const form = button.closest("form");
    setIsOpen(false);

    if (form) {
      form.requestSubmit();
    }
  }

  return (
    <>
      <Button {...props} type={type} variant={variant} onClick={handlePrimaryClick}>
        {props.children}
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 px-4 py-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            className="w-full max-w-md rounded-4xl border border-line bg-white p-6 shadow-soft"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-800">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p
                  id={modalTitleId}
                  className="text-lg font-bold leading-tight text-slate-950"
                >
                  {confirmTitle}
                </p>
                <p className="mt-2 text-base text-muted">{confirmMessage}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                {cancelLabel}
              </Button>
              <Button
                type="button"
                variant={variant === "danger" ? "danger" : "primary"}
                onClick={handleConfirm}
              >
                {confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
