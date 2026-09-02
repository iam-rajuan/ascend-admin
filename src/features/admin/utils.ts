export function formatAdminDate(value: string | null | undefined, withTime = false) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: withTime ? undefined : "numeric",
    hour: withTime ? "2-digit" : undefined,
    minute: withTime ? "2-digit" : undefined,
  });
}
