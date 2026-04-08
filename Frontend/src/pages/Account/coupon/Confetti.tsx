import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function Confetti({ active }: { active: boolean }) {
  useEffect(() => {
    if (!active) return;

    const instance = confetti.create(undefined, { resize: true });
    instance({
      particleCount: 60,
      spread: 80,
      origin: { x: 0.5, y: 0.25 },
    });
    instance({
      particleCount: 40,
      spread: 120,
      origin: { x: 0.5, y: 0.2 },
    });
    instance({
      particleCount: 30,
      spread: 160,
      origin: { x: 0.5, y: 0.15 },
    });
  }, [active]);

  return null;
}
