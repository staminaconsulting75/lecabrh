import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const name = file.name.toLowerCase();
    let text = "";

    if (name.endsWith(".pdf")) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
      const result = await pdfParse(buffer);
      text = result.text;
    } else if (name.endsWith(".docx") || name.endsWith(".doc")) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      return NextResponse.json({ error: "Format non supporté. Utilisez PDF ou DOCX." }, { status: 400 });
    }

    // Nettoyage et troncature
    text = text.replace(/\s+/g, " ").trim().slice(0, 8000);
    return NextResponse.json({ success: true, text });
  } catch (err) {
    console.error("[API /extract-text]", err);
    return NextResponse.json({ error: "Erreur lors de l'extraction du texte." }, { status: 500 });
  }
}
