import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLehengaFallback(id?: string | null) {
  const images = [
    '/images/lehengas/red.png',
    '/images/lehengas/pink.png',
    '/images/lehengas/gold.png'
  ];
  if (!id) return images[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return images[Math.abs(hash) % images.length];
}
