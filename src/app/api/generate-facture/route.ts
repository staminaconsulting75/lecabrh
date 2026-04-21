import { NextRequest, NextResponse } from "next/server";
import { generateFacturePdfBuffer, type FactureData } from "@/lib/generateFacturePdf";
import { generateFactureDocxBuffer } from "@/lib/generateFactureDocx";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { format, facture } = body as { format: "pdf" | "docx"; facture: FactureData };

    if (!facture) {
      return NextResponse.json({ error: "Données de facture manquantes." }, { status: 400 });
    }

    if (format === "docx") {
      const buffer = await generateFactureDocxBuffer(facture);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="Facture_${facture.numeroFacture || "CABRH"}.docx"`,
        },
      });
    }

    // PDF par défaut
    const buffer = await generateFacturePdfBuffer(facture);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Facture_${facture.numeroFacture || "CABRH"}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Erreur génération facture:", err);
    return NextResponse.json({ error: "Erreur lors de la génération de la facture." }, { status: 500 });
  }
}
