"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "./icons";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.dataset.theme === "dark" || (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches)), []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("respongo-theme", next ? "dark" : "light");
  };
  return <button className="icon-button" type="button" onClick={toggle} aria-label={dark ? "Açık temaya geç" : "Koyu temaya geç"}>{dark ? <Sun /> : <Moon />}</button>;
}
