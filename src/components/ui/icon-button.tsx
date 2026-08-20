import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type IconButtonProps = {
  icon: LucideIcon;
  /** Required — every icon-only button must have an accessible name. */
  "aria-label": string;
  /** Visible tooltip text; defaults to aria-label so sighted mouse users still get one. */
  title?: string;
  iconClassName?: string;
  /** Extra content rendered after the icon, e.g. an unread-dot overlay span. */
  children?: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "title">;

const DEFAULT_BUTTON_CLASSES =
  "flex size-8 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#070a13] hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 transition-all duration-200 cursor-pointer";

// Accessible icon-only button — wraps a real <button> and forces an
// aria-label at the type level so no icon-only control (theme toggle,
// notification bell, etc.) can ship without an accessible name.
export function IconButton({
  icon: Icon,
  "aria-label": ariaLabel,
  title,
  className,
  iconClassName,
  children,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      className={className ?? DEFAULT_BUTTON_CLASSES}
      {...rest}
    >
      <Icon className={iconClassName ?? "size-4"} />
      {children}
    </button>
  );
}
