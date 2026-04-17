"use client";

import type { ButtonHTMLAttributes } from "react";
import { Button } from "@/components/ui/button";

type ConfirmSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  confirmMessage: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function ConfirmSubmitButton({
  confirmMessage,
  onClick,
  type = "submit",
  variant = "primary",
  ...props
}: ConfirmSubmitButtonProps) {
  return (
    <Button
      {...props}
      type={type}
      variant={variant}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
          return;
        }

        onClick?.(event);
      }}
    />
  );
}
