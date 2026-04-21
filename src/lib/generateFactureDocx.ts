import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  HeadingLevel,
  UnderlineType,
} from "docx";
import type { FactureData } from "./generateFacturePdf";

export async function generateFactureDocxBuffer(data: FactureData): Promise<Buffer> {
  const navyHex = "004D71";
  const blueHex = "009ADE";
  const grayHex = "666666";
  const lightGrayHex = "F5F5F5";
  const whiteHex = "FFFFFF";

  const prix = data.prixUnitaireHT || 0;
  const tvaAmount = data.tva ? prix * 0.2 : 0;
  const totalTTC = prix + tvaAmount;

  const formatEur = (n: number) =>
    n.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";

  const designation = `Finalisation avec ${data.designationPrenom || ""} ${data.designationNom || ""}`.trim();

  // Helper pour cellule header tableau
  const headerCell = (text: string, align = AlignmentType.LEFT) =>
    new TableCell({
      shading: { type: ShadingType.SOLID, color: navyHex },
      children: [
        new Paragraph({
          alignment: align,
          children: [
            new TextRun({ text, bold: true, color: whiteHex, size: 18 }),
          ],
        }),
      ],
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
    });

  // Helper pour cellule data
  const dataCell = (text: string, align = AlignmentType.LEFT, bold = false) =>
    new TableCell({
      shading: { type: ShadingType.SOLID, color: lightGrayHex },
      children: [
        new Paragraph({
          alignment: align,
          children: [
            new TextRun({ text, bold, size: 20, color: "1A1A1A" }),
          ],
        }),
      ],
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
    });

  // Helper pour cellule totaux
  const totalLabelCell = (text: string) =>
    new TableCell({
      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
      children: [
        new Paragraph({
          children: [new TextRun({ text, size: 18, color: grayHex })],
        }),
      ],
      margins: { top: 60, bottom: 60, left: 80, right: 80 },
    });

  const totalValueCell = (text: string) =>
    new TableCell({
      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
      children: [
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text, size: 18, color: "1A1A1A" })],
        }),
      ],
      margins: { top: 60, bottom: 60, left: 80, right: 80 },
    });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 860, left: 800, right: 800 },
          },
        },
        children: [
          // ── EN-TÊTE CabRH (2 colonnes) ──
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideH: { style: BorderStyle.NONE },
              insideV: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "LE CABRH", bold: true, size: 22, color: navyHex })] }),
                      new Paragraph({ children: [new TextRun({ text: "15 All. Duguay Trouin", size: 16 })] }),
                      new Paragraph({ children: [new TextRun({ text: "44000 - Nantes", size: 16 })] }),
                      new Paragraph({ children: [new TextRun({ text: "nantes@le-cabrh.fr", size: 16, color: blueHex })] }),
                      new Paragraph({ children: [new TextRun({ text: "Siret : 889 224 622 00017", size: 16 })] }),
                      new Paragraph({ children: [new TextRun({ text: "Code APE : 7022Z", size: 16 })] }),
                      new Paragraph({ children: [new TextRun({ text: "TVA intracommunautaire : FR54889224622", size: 16 })] }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "CLIENT", bold: true, size: 18, color: navyHex })] }),
                      new Paragraph({ children: [new TextRun({ text: data.nomClient || "—", bold: true, size: 20 })] }),
                      new Paragraph({ children: [new TextRun({ text: data.adresseClient || "—", size: 18 })] }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Séparateur
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, color: blueHex, size: 12 } },
            children: [],
            spacing: { before: 300, after: 100 },
          }),

          // ── TITRE FACTURE ──
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 100 },
            children: [
              new TextRun({ text: "FACTURE", bold: true, size: 40, color: navyHex }),
            ],
          }),

          // Séparateur
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, color: blueHex, size: 12 } },
            children: [],
            spacing: { before: 100, after: 200 },
          }),

          // ── DÉTAILS (4 colonnes) ──
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
              insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "N° Facture", size: 16, color: grayHex })] }),
                      new Paragraph({ children: [new TextRun({ text: data.numeroFacture || "—", bold: true, size: 18 })] }),
                    ],
                  }),
                  new TableCell({
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "Date", size: 16, color: grayHex })] }),
                      new Paragraph({ children: [new TextRun({ text: data.dateFacturation || "—", bold: true, size: 18 })] }),
                    ],
                  }),
                  new TableCell({
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "N° Client", size: 16, color: grayHex })] }),
                      new Paragraph({ children: [new TextRun({ text: data.numeroClient || "—", bold: true, size: 18 })] }),
                    ],
                  }),
                  new TableCell({
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "Référent", size: 16, color: grayHex })] }),
                      new Paragraph({ children: [new TextRun({ text: data.referent || "—", bold: true, size: 18 })] }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Séparateur léger
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, color: "DDDDDD", size: 4 } },
            children: [],
            spacing: { before: 160, after: 160 },
          }),

          // ── INTITULÉ ──
          new Paragraph({ children: [new TextRun({ text: "Intitulé de la mission", size: 16, color: grayHex })] }),
          new Paragraph({
            children: [new TextRun({ text: data.intitule || "—", bold: true, size: 20 })],
            spacing: { after: 200 },
          }),

          // ── TABLEAU PRESTATIONS ──
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              // Header
              new TableRow({
                children: [
                  headerCell("Désignation"),
                  headerCell("Qté", AlignmentType.CENTER),
                  headerCell("Prix unitaire HT", AlignmentType.RIGHT),
                  headerCell("Total HT", AlignmentType.RIGHT),
                ],
                tableHeader: true,
              }),
              // Data row
              new TableRow({
                children: [
                  dataCell(designation || "—"),
                  dataCell("1", AlignmentType.CENTER),
                  dataCell(formatEur(prix), AlignmentType.RIGHT),
                  dataCell(formatEur(prix), AlignmentType.RIGHT),
                ],
              }),
            ],
          }),

          // Espace
          new Paragraph({ children: [], spacing: { before: 200 } }),

          // ── TOTAUX ──
          new Table({
            width: { size: 50, type: WidthType.PERCENTAGE },
            float: { horizontalAnchor: "margin" as any, relativeHorizontalPosition: "right" as any },
            borders: {
              top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
              insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  totalLabelCell("Total HT"),
                  totalValueCell(formatEur(prix)),
                ],
              }),
              new TableRow({
                children: [
                  totalLabelCell(data.tva ? "TVA 20%" : "TVA"),
                  totalValueCell(data.tva ? formatEur(tvaAmount) : "Non applicable"),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    shading: { type: ShadingType.SOLID, color: navyHex },
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    children: [new Paragraph({ children: [new TextRun({ text: "Total TTC", bold: true, size: 22, color: whiteHex })] })],
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  }),
                  new TableCell({
                    shading: { type: ShadingType.SOLID, color: navyHex },
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatEur(totalTTC), bold: true, size: 22, color: whiteHex })] })],
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  }),
                ],
              }),
            ],
          }),

          // espace
          new Paragraph({ children: [], spacing: { before: 800 } }),

          // Mention escompte
          new Paragraph({
            children: [new TextRun({ text: "Aucun escompte consenti pour règlement anticipé.", size: 16, color: grayHex, italics: true })],
            spacing: { after: 200 },
          }),

          // ── MENTIONS LÉGALES ──
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, color: blueHex, size: 8 } },
            children: [],
            spacing: { before: 200, after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Tout incident de paiement est passible d'intérêt de retard. Le montant des pénalités résulte de l'application aux sommes restant dues d'un intérêt de 10% sur base annuelle ou un intérêt de trois fois le taux légal, le montant le plus élevé s'appliquant.",
                size: 14,
                color: grayHex,
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 },
          }),

          // ── PIED DE PAGE ──
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, color: blueHex, size: 8 } },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "LE CABRH — 15 All. Duguay Trouin, 44000 Nantes — nantes@le-cabrh.fr — TVA FR54889224622",
                size: 14,
                color: grayHex,
              }),
            ],
            spacing: { before: 200 },
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
