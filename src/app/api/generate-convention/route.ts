import { NextRequest, NextResponse } from "next/server";
import { generateConventionDocxBuffer } from "@/lib/generateConventionDocx";
import { generateConventionPdfBuffer } from "@/lib/generateConventionPdf";
import type { ConventionData } from "@/lib/generateConventionDocx";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data: ConventionData = body.data ?? body; // support both {data, format} and direct
    const format: string = body.format ?? "docx";

    if (!data.dateEdition && format !== "preview") {
      return NextResponse.json({ error: "La date d'édition est requise." }, { status: 400 });
    }

    if (format === "pdf") {
      const pdfBuffer = await generateConventionPdfBuffer(data);
      const slug = (data.titrePoste || data.nomClient || "Convention").replace(/[^a-zA-Z0-9À-ÿ]/g, "_").slice(0, 40);
      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="Convention_${slug}.pdf"`,
          "Content-Length": pdfBuffer.length.toString(),
        },
      });
    }

    // Default: DOCX
    const docxBuffer = await generateConventionDocxBuffer(data);
    const slug = (data.titrePoste || data.nomClient || "Convention").replace(/[^a-zA-Z0-9À-ÿ]/g, "_").slice(0, 40);
    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Convention_${slug}.docx"`,
        "Content-Length": docxBuffer.length.toString(),
      },
    });
  } catch (err) {
    console.error("[API /generate-convention]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur interne" }, { status: 500 });
  }
}
