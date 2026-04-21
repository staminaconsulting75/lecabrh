import { NextRequest, NextResponse } from "next/server";
import { generateDocxBuffer } from "@/lib/generateDocx";
import type { CompteRendu } from "@/lib/extractInfo";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const compteRendu: CompteRendu = body.compteRendu;

    if (!compteRendu || !compteRendu.candidat) {
      return NextResponse.json(
        { error: "Données du compte rendu manquantes ou invalides." },
        { status: 400 }
      );
    }

    const docxBuffer = await generateDocxBuffer(compteRendu);

    const nomCandidat =
      `${compteRendu.candidat.prenom}_${compteRendu.candidat.nom}`.replace(
        /[^a-zA-Z0-9_\-À-ÿ]/g,
        "_"
      ) || "Candidat";
    const fileName = `CR_Entretien_${nomCandidat}.docx`;

    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": docxBuffer.length.toString(),
      },
    });
  } catch (err) {
    console.error("[API /generate-docx] Erreur :", err);
    const message =
      err instanceof Error ? err.message : "Erreur interne du serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
