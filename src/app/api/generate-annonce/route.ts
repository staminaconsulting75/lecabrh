import { NextRequest, NextResponse } from "next/server";
import { generateAnnonce } from "@/lib/generateAnnonce";
import { generateAnnonceDocxBuffer } from "@/lib/generateAnnonceDocx";
import type { AnnonceInput, AnnonceGeneree } from "@/lib/generateAnnonce";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ── Mode export DOCX depuis une annonce déjà générée (modifiée manuellement) ──
    // body.annonce contient l'objet AnnonceGeneree complet → pas de re-génération IA
    if (body.format === "docx" && body.annonce) {
      const annonce: AnnonceGeneree = body.annonce;
      const docxBuffer = await generateAnnonceDocxBuffer(annonce);
      const slug = annonce.input.intitule.replace(/[^a-zA-Z0-9À-ÿ]/g, "_").slice(0, 40);
      return new NextResponse(new Uint8Array(docxBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="Annonce_${slug}.docx"`,
          "Content-Length": docxBuffer.length.toString(),
        },
      });
    }

    // ── Mode génération IA depuis le formulaire ──────────────────────
    const input: AnnonceInput = body.input;

    if (!input || !input.intitule) {
      return NextResponse.json(
        { error: "L'intitulé du poste est requis." },
        { status: 400 }
      );
    }

    const annonce = await generateAnnonce(input);

    // Si le client demande le DOCX directement (depuis historique par ex.)
    if (body.format === "docx") {
      const docxBuffer = await generateAnnonceDocxBuffer(annonce);
      const slug = input.intitule.replace(/[^a-zA-Z0-9À-ÿ]/g, "_").slice(0, 40);
      return new NextResponse(new Uint8Array(docxBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="Annonce_${slug}.docx"`,
          "Content-Length": docxBuffer.length.toString(),
        },
      });
    }

    return NextResponse.json({ success: true, annonce });
  } catch (err) {
    console.error("[API /generate-annonce] Erreur :", err);
    const message = err instanceof Error ? err.message : "Erreur interne du serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
