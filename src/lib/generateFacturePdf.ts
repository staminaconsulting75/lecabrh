/* eslint-disable @typescript-eslint/no-require-imports */
import path from "path";
import fs from "fs";

export interface FactureData {
  // Client
  nomClient: string;
  adresseClient: string;
  referent: string;
  // Facture
  dateFacturation: string;
  numeroClient: string;
  numeroFacture: string;
  // Mission
  intitule: string;
  designationNom: string;
  designationPrenom: string;
  prixUnitaireHT: number;
  tva: boolean; // true = TVA 20%, false = sans TVA
}

export async function generateFacturePdfBuffer(data: FactureData): Promise<Buffer> {
  const PDFDocument = require("pdfkit") as any;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 60, left: 55, right: 55 },
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const navy = "#004D71";
    const blue = "#009ADE";
    const red = "#C0392B";
    const black = "#1A1A1A";
    const gray = "#666666";
    const lightGray = "#F5F5F5";

    const pageW = 595.28 - 55 - 55; // usable width

    // ── LOGO ──
    const logoPath = path.join(process.cwd(), "public", "templates", "cabrh-logo.jpg");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 55, 45, { width: 90 });
    }

    // ── INFOS CABRH (left, below logo) ──
    doc.y = 145;
    doc.x = 55;
    doc.fontSize(8).fillColor(navy).font("Helvetica-Bold").text("LE CABRH", 55, 145);
    doc.fontSize(8).fillColor(black).font("Helvetica")
      .text("15 All. Duguay Trouin", 55, 157)
      .text("44000 - Nantes", 55, 168)
      .text("nantes@le-cabrh.fr", 55, 179)
      .text("Siret : 889 224 622 00017", 55, 190)
      .text("Code APE : 7022Z", 55, 201)
      .text("TVA intracommunautaire : FR54889224622", 55, 212);

    // ── INFOS CLIENT (right) ──
    const clientX = 340;
    doc.fontSize(8).fillColor(navy).font("Helvetica-Bold").text("CLIENT", clientX, 145);
    doc.fontSize(9).fillColor(black).font("Helvetica-Bold").text(data.nomClient || "—", clientX, 157, { width: 200 });
    doc.fontSize(8).fillColor(black).font("Helvetica").text(data.adresseClient || "—", clientX, 170, { width: 200 });

    // ── TITRE FACTURE ──
    doc.y = 240;
    doc.moveTo(55, 238).lineTo(540, 238).strokeColor(blue).lineWidth(1.5).stroke();

    doc.fontSize(18).fillColor(navy).font("Helvetica-Bold")
      .text("FACTURE", 55, 248, { align: "center", width: pageW });

    doc.moveTo(55, 272).lineTo(540, 272).strokeColor(blue).lineWidth(1.5).stroke();

    // ── DÉTAILS FACTURE ──
    const detailY = 282;
    const col1X = 55;
    const col2X = 200;
    const col3X = 330;
    const col4X = 430;

    doc.fontSize(8).fillColor(gray).font("Helvetica")
      .text("N° Facture", col1X, detailY)
      .text("Date", col2X, detailY)
      .text("N° Client", col3X, detailY)
      .text("Référent", col4X, detailY);

    doc.fontSize(9).fillColor(black).font("Helvetica-Bold")
      .text(data.numeroFacture || "—", col1X, detailY + 12, { width: 130 })
      .text(data.dateFacturation || "—", col2X, detailY + 12, { width: 120 })
      .text(data.numeroClient || "—", col3X, detailY + 12, { width: 90 })
      .text(data.referent || "—", col4X, detailY + 12, { width: 110 });

    doc.moveTo(55, detailY + 30).lineTo(540, detailY + 30).strokeColor("#DDDDDD").lineWidth(0.5).stroke();

    // ── INTITULÉ ──
    const intituleY = detailY + 40;
    doc.fontSize(8).fillColor(gray).font("Helvetica").text("Intitulé de la mission", col1X, intituleY);
    doc.fontSize(9).fillColor(black).font("Helvetica-Bold")
      .text(data.intitule || "—", col1X, intituleY + 12, { width: pageW });

    doc.moveTo(55, intituleY + 32).lineTo(540, intituleY + 32).strokeColor("#DDDDDD").lineWidth(0.5).stroke();

    // ── TABLEAU ──
    const tableY = intituleY + 45;

    // Header tableau
    doc.rect(55, tableY, pageW, 20).fillColor(navy).fill();
    doc.fontSize(8).fillColor("white").font("Helvetica-Bold")
      .text("Désignation", 65, tableY + 6, { width: 240 })
      .text("Qté", 310, tableY + 6, { width: 50, align: "center" })
      .text("Prix unitaire HT", 365, tableY + 6, { width: 90, align: "right" })
      .text("Total HT", 460, tableY + 6, { width: 75, align: "right" });

    // Ligne de données
    const rowY = tableY + 22;
    doc.rect(55, rowY, pageW, 22).fillColor(lightGray).fill();
    doc.rect(55, rowY, pageW, 22).strokeColor("#DDDDDD").lineWidth(0.5).stroke();

    const designation = `Finalisation avec ${data.designationPrenom || ""} ${data.designationNom || ""}`.trim();
    const prix = data.prixUnitaireHT || 0;

    doc.fontSize(9).fillColor(black).font("Helvetica")
      .text(designation || "—", 65, rowY + 7, { width: 240 })
      .text("1", 310, rowY + 7, { width: 50, align: "center" })
      .text(`${prix.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`, 365, rowY + 7, { width: 90, align: "right" })
      .text(`${prix.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`, 460, rowY + 7, { width: 75, align: "right" });

    // ── TOTAUX ──
    const totauxY = rowY + 40;
    const totauxX = 360;
    const totauxW = 175;

    const tvaAmount = data.tva ? prix * 0.2 : 0;
    const totalTTC = prix + tvaAmount;

    doc.moveTo(totauxX, totauxY).lineTo(540, totauxY).strokeColor("#DDDDDD").lineWidth(0.5).stroke();

    doc.fontSize(9).fillColor(gray).font("Helvetica")
      .text("Total HT", totauxX, totauxY + 6, { width: 90 })
      .text(`${prix.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`, totauxX + 95, totauxY + 6, { width: 80, align: "right" });

    if (data.tva) {
      doc.text("TVA 20%", totauxX, totauxY + 22, { width: 90 })
        .text(`${tvaAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`, totauxX + 95, totauxY + 22, { width: 80, align: "right" });
    } else {
      doc.text("TVA", totauxX, totauxY + 22, { width: 90 })
        .text("Non applicable", totauxX + 95, totauxY + 22, { width: 80, align: "right" });
    }

    doc.moveTo(totauxX, totauxY + 38).lineTo(540, totauxY + 38).strokeColor(navy).lineWidth(1).stroke();

    doc.rect(totauxX, totauxY + 40, totauxW, 22).fillColor(navy).fill();
    doc.fontSize(10).fillColor("white").font("Helvetica-Bold")
      .text("Total TTC", totauxX + 5, totauxY + 46, { width: 85 })
      .text(`${totalTTC.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`, totauxX + 90, totauxY + 46, { width: 80, align: "right" });

    // Mention escompte
    doc.fontSize(7.5).fillColor(gray).font("Helvetica")
      .text("Aucun escompte consenti pour règlement anticipé.", 55, totauxY + 6, { width: 280 });

    // ── MENTIONS LÉGALES ──
    const mentionY = totauxY + 90;
    doc.moveTo(55, mentionY).lineTo(540, mentionY).strokeColor(blue).lineWidth(1).stroke();

    doc.fontSize(7).fillColor(gray).font("Helvetica")
      .text(
        "Tout incident de paiement est passible d'intérêt de retard. Le montant des pénalités résulte de l'application aux sommes restant dues d'un intérêt de 10% sur base annuelle ou un intérêt de trois fois le taux légal, le montant le plus élevé s'appliquant.",
        55,
        mentionY + 8,
        { width: pageW, align: "justify" }
      );

    // ── PIED DE PAGE ──
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.moveTo(55, 780).lineTo(540, 780).strokeColor(blue).lineWidth(1).stroke();
      doc.fontSize(7).fillColor(gray).font("Helvetica")
        .text(
          "LE CABRH — 15 All. Duguay Trouin, 44000 Nantes — nantes@le-cabrh.fr — TVA FR54889224622",
          55, 787, { align: "center", width: pageW }
        );
    }

    doc.end();
  });
}
