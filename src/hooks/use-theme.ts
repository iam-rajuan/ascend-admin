"use client";

import { useState, useEffect } from "react";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("ascend_admin_theme") as
      | "light"
      | "dark"
      | null;
    const initial = saved || "light";
    document.documentElement.classList.toggle("dark", initial === "dark");
    const timer = setTimeout(() => setTheme(initial), 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("ascend_admin_theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return { theme, mounted, toggleTheme };
}
