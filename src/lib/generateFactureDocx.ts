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
} from "docx";
import type { FactureData } from "./generateFacturePdf";

const NAVY = "004D71";
const BLUE = "009ADE";
const GRAY = "666666";
const DARK = "1A1A1A";
const WHITE = "FFFFFF";
const LIGHT = "F5F5F5";

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideH: NO_BORDER as any, insideV: NO_BORDER as any };

export async function generateFactureDocxBuffer(data: FactureData): Promise<Buffer> {
  const prix = data.prixUnitaireHT || 0;
  const tvaAmount = data.tva ? prix * 0.2 : 0;
  const totalTTC = prix + tvaAmount;
  const formatEur = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
  const designation = `Finalisation avec ${data.designationPrenom || ""} ${data.designationNom || ""}`.trim();

  // ── Séparateur bleu (bottom) ──
  const blueSeparatorBottom = (before: number, after: number) =>
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: BLUE } },
      spacing: { before, after },
      children: [],
    });

  // ── Séparateur gris clair (bottom) ──
  const graySeparator = () =>
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" } },
      spacing: { before: 160, after: 160 },
      children: [],
    });

  // ── En-tête : CabRH gauche + Client droite ──
  const headerTable = new Table({
    width: { size: 5000, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          // Colonne CabRH
          new TableCell({
            width: { size: 2500, type: WidthType.PERCENTAGE },
            borders: noBorders,
            children: [
              new Paragraph({ children: [new TextRun({ text: "LE CABRH", bold: true, color: NAVY, size: 22 })] }),
              new Paragraph({ children: [new TextRun({ text: "15 All. Duguay Trouin", size: 16 })] }),
              new Paragraph({ children: [new TextRun({ text: "44000 - Nantes", size: 16 })] }),
              new Paragraph({ children: [new TextRun({ text: "nantes@le-cabrh.fr", size: 16, color: BLUE })] }),
              new Paragraph({ children: [new TextRun({ text: "Siret : 889 224 622 00017", size: 16 })] }),
              new Paragraph({ children: [new TextRun({ text: "Code APE : 7022Z", size: 16 })] }),
              new Paragraph({ children: [new TextRun({ text: "TVA intracommunautaire : FR54889224622", size: 16 })] }),
            ],
          }),
          // Colonne Client
          new TableCell({
            width: { size: 2500, type: WidthType.PERCENTAGE },
            borders: noBorders,
            children: [
              new Paragraph({ children: [new TextRun({ text: "CLIENT", bold: true, color: NAVY, size: 18 })] }),
              new Paragraph({ children: [new TextRun({ text: data.nomClient || "—", bold: true })] }),
              new Paragraph({ children: [new TextRun({ text: data.adresseClient || "—", size: 18 })] }),
            ],
          }),
        ],
      }),
    ],
  });

  // ── Tableau détails (N° Facture, Date, N° Client, Référent) ──
  const detailsTable = new Table({
    width: { size: 5000, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          { label: "N° Facture", value: data.numeroFacture || "—" },
          { label: "Date", value: data.dateFacturation || "—" },
          { label: "N° Client", value: data.numeroClient || "—" },
          { label: "Référent", value: data.referent || "—" },
        ].map(({ label, value }) =>
          new TableCell({
            borders: noBorders,
            margins: { top: 0, bottom: 0, left: 10, right: 10 },
            children: [
              new Paragraph({ children: [new TextRun({ text: label, color: GRAY, size: 16 })] }),
              new Paragraph({ children: [new TextRun({ text: value, bold: true, size: 18 })] }),
            ],
          })
        ),
      }),
    ],
  });

  // ── Tableau prestations ──
  const prestationsTable = new Table({
    width: { size: 5000, type: WidthType.PERCENTAGE },
    borders: ({
      top: { style: BorderStyle.SINGLE, size: 4, color: "auto" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "auto" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "auto" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "auto" },
      insideH: { style: BorderStyle.SINGLE, size: 4, color: "auto" },
      insideV: { style: BorderStyle.SINGLE, size: 4, color: "auto" },
    }) as any,
    rows: [
      // Header
      new TableRow({
        tableHeader: true,
        children: [
          { text: "Désignation", align: AlignmentType.LEFT },
          { text: "Qté", align: AlignmentType.CENTER },
          { text: "Prix unitaire HT", align: AlignmentType.RIGHT },
          { text: "Total HT", align: AlignmentType.RIGHT },
        ].map(({ text, align }) =>
          new TableCell({
            shading: { type: ShadingType.SOLID, color: NAVY },
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: [
              new Paragraph({
                alignment: align,
                children: [new TextRun({ text, bold: true, color: WHITE, size: 18 })],
              }),
            ],
          })
        ),
      }),
      // Data
      new TableRow({
        children: [
          { text: designation || "—", align: AlignmentType.LEFT },
          { text: "1", align: AlignmentType.CENTER },
          { text: formatEur(prix), align: AlignmentType.RIGHT },
          { text: formatEur(prix), align: AlignmentType.RIGHT },
        ].map(({ text, align }) =>
          new TableCell({
            shading: { type: ShadingType.SOLID, color: LIGHT },
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: [
              new Paragraph({
                alignment: align,
                children: [new TextRun({ text, color: DARK })],
              }),
            ],
          })
        ),
      }),
    ],
  });

  // ── Tableau totaux (aligné à droite via table wrapper) ──
  const innerTotauxRows = [
    { label: data.tva ? "Total HT" : "Total HT", value: formatEur(prix), navy: false },
    { label: data.tva ? "TVA 20%" : "TVA", value: data.tva ? formatEur(tvaAmount) : "Non applicable", navy: false },
    { label: "Total TTC", value: formatEur(totalTTC), navy: true },
  ].map(({ label, value, navy }) =>
    new TableRow({
      children: [
        new TableCell({
          shading: navy ? { type: ShadingType.SOLID, color: NAVY } : undefined,
          borders: noBorders,
          margins: { top: navy ? 80 : 60, bottom: navy ? 80 : 60, left: navy ? 100 : 80, right: navy ? 100 : 80 },
          children: [
            new Paragraph({
              children: [new TextRun({ text: label, bold: navy, color: navy ? WHITE : GRAY, size: navy ? 22 : 18 })],
            }),
          ],
        }),
        new TableCell({
          shading: navy ? { type: ShadingType.SOLID, color: NAVY } : undefined,
          borders: noBorders,
          margins: { top: navy ? 80 : 60, bottom: navy ? 80 : 60, left: navy ? 100 : 80, right: navy ? 100 : 80 },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: value, bold: navy, color: navy ? WHITE : DARK, size: navy ? 22 : 18 })],
            }),
          ],
        }),
      ],
    })
  );

  // Table wrapper: colonne vide à gauche + totaux à droite
  const totauxWrapper = new Table({
    width: { size: 5000, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          // Colonne vide (spacer gauche)
          new TableCell({
            width: { size: 2500, type: WidthType.PERCENTAGE },
            borders: noBorders,
            children: [new Paragraph({ children: [] })],
          }),
          // Colonne totaux
          new TableCell({
            width: { size: 2500, type: WidthType.PERCENTAGE },
            borders: noBorders,
            children: [
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: noBorders,
                rows: innerTotauxRows,
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 720, bottom: 860, left: 800, right: 800 },
          },
        },
        children: [
          // 1. Header CabRH + Client
          headerTable,

          // 2. Séparateur bleu
          blueSeparatorBottom(300, 100),

          // 3. Titre FACTURE
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 100 },
            children: [new TextRun({ text: "FACTURE", bold: true, color: NAVY, size: 40 })],
          }),

          // 4. Séparateur bleu
          blueSeparatorBottom(100, 200),

          // 5. Détails (N° Facture, Date, N° Client, Référent)
          detailsTable,

          // 6. Séparateur gris
          graySeparator(),

          // 7. Intitulé
          new Paragraph({
            children: [new TextRun({ text: "Intitulé de la mission", color: GRAY, size: 16 })],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: data.intitule || "—", bold: true })],
          }),

          // 8. Tableau prestations
          prestationsTable,

          // 9. Espace
          new Paragraph({ spacing: { before: 200 }, children: [] }),

          // 10. Totaux (alignés à droite)
          totauxWrapper,

          // 11. Espace
          new Paragraph({ spacing: { before: 800 }, children: [] }),

          // 12. Escompte
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: "Aucun escompte consenti pour règlement anticipé.", italics: true, color: GRAY, size: 16 })],
          }),

          // 13. Séparateur bleu (top)
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 8, color: BLUE } },
            spacing: { before: 200, after: 100 },
            children: [],
          }),

          // 14. Mentions légales
          new Paragraph({
            alignment: AlignmentType.BOTH,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "Tout incident de paiement est passible d'intérêt de retard. Le montant des pénalités résulte de l'application aux sommes restant dues d'un intérêt de 10% sur base annuelle ou un intérêt de trois fois le taux légal, le montant le plus élevé s'appliquant.",
                color: GRAY,
                size: 14,
              }),
            ],
          }),

          // 15. Pied de page
          new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 8, color: BLUE } },
            spacing: { before: 200 },
            children: [
              new TextRun({
                text: "LE CABRH — 15 All. Duguay Trouin, 44000 Nantes — nantes@le-cabrh.fr — TVA FR54889224622",
                color: GRAY,
                size: 14,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
