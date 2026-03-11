import Link from "next/link";
import { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

type ButtonLinkProps = {
  children: ReactNode;
  href: string;
  variant?: ButtonVariant;
  className?: string;
};

function classFor(variant: ButtonVariant, className?: string) {
  const base = variant === "primary" ? "btn btnPrimary" : variant === "secondary" ? "btn btnSecondary" : "btn btnGhost";
  return className ? `${base} ${className}` : base;
}

export function Button({ children, variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button className={classFor(variant, className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({ children, href, variant = "primary", className }: ButtonLinkProps) {
  return (
    <Link href={href} className={classFor(variant, className)}>
      {children}
    </Link>
  );
}
