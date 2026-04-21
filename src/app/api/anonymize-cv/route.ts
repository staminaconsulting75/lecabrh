import { NextRequest, NextResponse } from "next/server";
import { extractTextFromCV } from "@/lib/parseCV";
import { anonymiserCV } from "@/lib/anonymizeCV";
import { generateAnonymePdfBuffer } from "@/lib/generateAnonymePdf";
import { generateAnonymeDocxBuffer } from "@/lib/generateAnonymeDocx";
import type { CVAnonymise } from "@/lib/anonymizeCV";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // ── Mode JSON : re-génération PDF depuis données stockées ──────────
    if (contentType.includes("application/json")) {
      const body = await request.json();

      // Re-download from history or DOCX: { cv: CVAnonymise, format?: "pdf"|"docx" }
      if (body.cv) {
        const cvAnonymise: CVAnonymise = body.cv;
        const format = body.format ?? "pdf";

        if (format === "docx") {
          const docxBuffer = await generateAnonymeDocxBuffer(cvAnonymise);
          return new NextResponse(new Uint8Array(docxBuffer), {
            status: 200,
            headers: {
              "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              "Content-Disposition": `attachment; filename="CV_Anonyme_CabRH.docx"`,
              "Content-Length": docxBuffer.length.toString(),
            },
          });
        }

        const pdfBuffer = await generateAnonymePdfBuffer(cvAnonymise);
        return new NextResponse(new Uint8Array(pdfBuffer), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="CV_Anonyme_CabRH.pdf"`,
            "Content-Length": pdfBuffer.length.toString(),
          },
        });
      }

      return NextResponse.json({ error: "Données manquantes." }, { status: 400 });
    }

    // ── Mode FormData : upload + anonymisation ─────────────────────────
    const formData = await request.formData();
    const file = formData.get("cv") as File | null;
    const returnJson = formData.get("returnJson") === "true";

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)." }, { status: 400 });
    }

    const isAllowed =
      file.type === "application/pdf" ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.toLowerCase().endsWith(".pdf") ||
      file.name.toLowerCase().endsWith(".docx");

    if (!isAllowed) {
      return NextResponse.json({ error: "Format non supporté. Utilisez PDF ou DOCX." }, { status: 400 });
    }

    // Extraction du texte
    const buffer = Buffer.from(await file.arrayBuffer());
    let cvText: string;
    try {
      cvText = await extractTextFromCV(buffer, file.type, file.name);
    } catch (err) {
      return NextResponse.json(
        { error: `Impossible de lire le fichier : ${err instanceof Error ? err.message : "Erreur"}` },
        { status: 422 }
      );
    }

    if (!cvText || cvText.trim().length < 50) {
      return NextResponse.json({ error: "Le fichier semble vide ou illisible." }, { status: 422 });
    }

    // Anonymisation via Claude
    const cvAnonymise = await anonymiserCV(cvText);

    // Génération du PDF
    const pdfBuffer = await generateAnonymePdfBuffer(cvAnonymise);

    // Si returnJson=true, renvoyer JSON avec PDF en base64 + données structurées
    if (returnJson) {
      return NextResponse.json({
        success: true,
        cv: cvAnonymise,
        pdfBase64: Buffer.from(pdfBuffer).toString("base64"),
      });
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="CV_Anonyme_CabRH.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (err) {
    console.error("[API /anonymize-cv] Erreur :", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
