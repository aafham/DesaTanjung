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
  const modalDescriptionId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  function handlePrimaryClick(event: MouseEvent<HTMLButtonElement>) {
    if (type === "submit") {
      event.preventDefault();
      triggerRef.current = event.currentTarget;
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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const triggerElement = triggerRef.current;
    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();

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
  }, [isOpen]);

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
