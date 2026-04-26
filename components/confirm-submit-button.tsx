"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type MouseEvent,
} from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type ConfirmSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  confirmMessage: string;
  confirmTitle?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  requiredConfirmationText?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function ConfirmSubmitButton({
  confirmMessage,
  confirmTitle = "Please confirm this action",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  requiredConfirmationText,
  type = "submit",
  variant = "primary",
  onClick,
  ...props
}: ConfirmSubmitButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const modalTitleId = useId();
  const modalDescriptionId = useId();
  const confirmationInputId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const confirmationInputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const canConfirm =
    !requiredConfirmationText || confirmationText.trim() === requiredConfirmationText;

  function handlePrimaryClick(event: MouseEvent<HTMLButtonElement>) {
    if (type === "submit") {
      event.preventDefault();
      triggerRef.current = event.currentTarget;
      setConfirmationText("");
      setIsOpen(true);
      return;
    }

    onClick?.(event);
  }

  function handleConfirm(event: MouseEvent<HTMLButtonElement>) {
    if (!canConfirm) {
      return;
    }

    const button = event.currentTarget;
    const form = button.closest("form");
    setIsOpen(false);

    if (form) {
      form.requestSubmit();
    }
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const triggerElement = triggerRef.current;
    document.body.style.overflow = "hidden";
    if (requiredConfirmationText) {
      confirmationInputRef.current?.focus();
    } else {
      cancelButtonRef.current?.focus();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        return;
      }

      if (event.key === "Tab" && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );

        if (focusableElements.length === 0) {
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement;

        if (event.shiftKey && activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      triggerElement?.focus();
    };
  }, [isOpen, requiredConfirmationText]);

  return (
    <>
      <Button {...props} type={type} variant={variant} onClick={handlePrimaryClick}>
        {props.children}
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 px-4 py-6">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            aria-describedby={modalDescriptionId}
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
                <p id={modalDescriptionId} className="mt-2 text-base text-muted">
                  {confirmMessage}
                </p>
              </div>
            </div>

            {requiredConfirmationText ? (
              <div className="mt-5 rounded-3xl bg-slate-50 p-4">
                <label
                  htmlFor={confirmationInputId}
                  className="block text-sm font-bold text-slate-950"
                >
                  Type <span className="font-mono">{requiredConfirmationText}</span> to continue
                </label>
                <input
                  ref={confirmationInputRef}
                  id={confirmationInputId}
                  name="_confirmation_text"
                  value={confirmationText}
                  onChange={(event) => setConfirmationText(event.target.value)}
                  autoComplete="off"
                  className="mt-2 min-h-12 w-full rounded-2xl border border-line px-4 py-2 font-mono text-base text-slate-950 outline-none focus:border-primary"
                />
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                ref={cancelButtonRef}
                type="button"
                variant="secondary"
                onClick={() => setIsOpen(false)}
              >
                {cancelLabel}
              </Button>
              <Button
                type="button"
                variant={variant === "danger" ? "danger" : "primary"}
                onClick={handleConfirm}
                disabled={!canConfirm}
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
