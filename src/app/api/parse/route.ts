import { NextRequest, NextResponse } from "next/server";
import { extractTextFromCV } from "@/lib/parseCV";
import { generateCompteRendu } from "@/lib/extractInfo";

export const maxDuration = 60;

/** Récupère le texte d'une URL (fiche de poste en ligne) */
async function fetchUrlText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; CabRH-Bot/1.0)" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Impossible de récupérer l'URL (${res.status})`);
  const html = await res.text();
  // Suppression des balises HTML + nettoyage
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return text.slice(0, 6000); // max 6000 chars
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("cv") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni. Veuillez déposer un CV." },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Le fichier est trop volumineux (maximum 10 Mo)." },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const isAllowedByName =
      file.name.toLowerCase().endsWith(".pdf") ||
      file.name.toLowerCase().endsWith(".docx");

    if (!allowedTypes.includes(file.type) && !isAllowedByName) {
      return NextResponse.json(
        { error: "Format non supporté. Veuillez utiliser un fichier PDF ou DOCX." },
        { status: 400 }
      );
    }

    // Extraction du texte du CV
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let cvText: string;
    try {
      cvText = await extractTextFromCV(buffer, file.type, file.name);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur d'extraction";
      return NextResponse.json(
        { error: `Impossible de lire le fichier : ${msg}` },
        { status: 422 }
      );
    }

    if (!cvText || cvText.trim().length < 50) {
      return NextResponse.json(
        { error: "Le fichier semble vide ou illisible. Vérifiez que votre CV contient du texte sélectionnable." },
        { status: 422 }
      );
    }

    // ── Fiche de poste optionnelle ────────────────────────────────
    let fichePosteText: string | undefined;

    // Option 1 : URL
    const jobUrl = formData.get("jobUrl") as string | null;
    if (jobUrl && jobUrl.trim()) {
      try {
        fichePosteText = await fetchUrlText(jobUrl.trim());
      } catch (err) {
        console.warn("[API /parse] Impossible de récupérer l'URL:", err);
        // Non bloquant — on continue sans la fiche
      }
    }

    // Option 2 : fichier joint (PDF ou DOCX)
    if (!fichePosteText) {
      const jobFile = formData.get("jobFile") as File | null;
      if (jobFile && jobFile.size > 0) {
        try {
          const jobBuffer = Buffer.from(await jobFile.arrayBuffer());
          fichePosteText = await extractTextFromCV(jobBuffer, jobFile.type, jobFile.name);
        } catch (err) {
          console.warn("[API /parse] Impossible de lire la fiche de poste:", err);
        }
      }
    }

    // Génération du compte rendu via Claude
    const compteRendu = await generateCompteRendu(cvText, fichePosteText);

    return NextResponse.json({ success: true, compteRendu });
  } catch (err) {
    console.error("[API /parse] Erreur :", err);
    const message = err instanceof Error ? err.message : "Erreur interne du serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
