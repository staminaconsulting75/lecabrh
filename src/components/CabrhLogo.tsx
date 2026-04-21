"use client";

import Image from "next/image";
import Link from "next/link";

interface CabrhLogoProps {
  size?: "sm" | "md" | "lg";
}

export default function CabrhLogo({ size = "md" }: CabrhLogoProps) {
  const heights = { sm: 28, md: 44, lg: 60 };
  const h = heights[size];
  // Ratio original : 600 × 194 → ~3.09
  const w = Math.round(h * (600 / 194));

  return (
    <Link href="/" title="Retour à l'accueil">
      <Image
        src="/logo-cabrh.png"
        alt="le CabRH — Le Partenaire de Votre Recrutement"
        width={w}
        height={h}
        priority
        style={{ objectFit: "contain" }}
        className="cursor-pointer hover:opacity-80 transition-opacity"
      />
    </Link>
  );
}
