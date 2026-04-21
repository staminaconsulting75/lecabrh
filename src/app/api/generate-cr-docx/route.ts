import { NextRequest, NextResponse } from "next/server";
import { generateDocxBuffer } from "@/lib/generateDocx";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { compteRendu } = await request.json();
    if (!compteRendu) {
      return NextResponse.json({ error: "Données manquantes." }, { status: 400 });
    }

    const docxBuffer = await generateDocxBuffer(compteRendu);
    const slug = `${compteRendu.candidat?.prenom || ""}_${compteRendu.candidat?.nom || ""}`
      .trim()
      .replace(/[^a-zA-Z0-9À-ÿ]/g, "_") || "CR";

    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="CR_Entretien_${slug}.docx"`,
        "Content-Length": docxBuffer.length.toString(),
      },
    });
  } catch (err) {
    console.error("[API /generate-cr-docx]", err);
    return NextResponse.json({ error: "Erreur lors de la génération." }, { status: 500 });
  }
}
