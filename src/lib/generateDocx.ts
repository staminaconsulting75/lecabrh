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
  ShadingType,
  AlignmentType,
  ImageRun,
  VerticalAlign,
  Header,
  Footer,
  PageNumber,
  LevelFormat,
} from "docx";
import type { CompteRendu } from "./extractInfo";
import * as fs from "fs";
import * as path from "path";

// Couleurs CABRH officielles
const NAVY = "004D71"; // PANTONE 3025 C
const SKY  = "009ADE"; // PANTONE 2925 C
const GRAY_BORDER = "C0C0C0";
const WHITE = "FFFFFF";
const LABEL_BG = "E8F4FA"; // fond légèrement bleu pour les labels

// Largeurs (DXA) — calquées sur le document original
const TABLE_W    = 10561;
const COL_LABEL  = 3402;
const COL_VALUE  = 7159;

// ─── Helpers ──────────────────────────────────────────────────────────────

const border = { style: BorderStyle.SINGLE, size: 4, color: GRAY_BORDER };
const cellBorders = { top: border, bottom: border, left: border, right: border };

function run(text: string, opts: {
  bold?: boolean; color?: string; size?: number; italics?: boolean;
} = {}): TextRun {
  return new TextRun({
    text,
    font: "Calibri",
    size:    opts.size  ?? 22,
    bold:    opts.bold  ?? false,
    italics: opts.italics ?? false,
    color:   opts.color ?? "333333",
  });
}

function labelCell(text: string): TableCell {
  return new TableCell({
    width: { size: COL_LABEL, type: WidthType.DXA },
    borders: cellBorders,
    shading: { fill: LABEL_BG, type: ShadingType.CLEAR, color: "auto" },
    margins: { top: 100, bottom: 100, left: 150, right: 100 },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        children: [run(text, { bold: true, color: NAVY, size: 20 })],
      }),
    ],
  });
}

function valueCell(text: string, italic = false): TableCell {
  return new TableCell({
    width: { size: COL_VALUE, type: WidthType.DXA },
    borders: cellBorders,
    shading: { fill: WHITE, type: ShadingType.CLEAR, color: "auto" },
    margins: { top: 100, bottom: 100, left: 150, right: 150 },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [run(text || "—", { color: "1A1A1A", size: 22, italics: italic })],
      }),
    ],
  });
}

function mergedHeaderCell(text: string): TableCell {
  return new TableCell({
    width: { size: TABLE_W, type: WidthType.DXA },
    columnSpan: 2,
    borders: cellBorders,
    shading: { fill: NAVY, type: ShadingType.CLEAR, color: "auto" },
    margins: { top: 120, bottom: 120, left: 150, right: 150 },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        children: [run(text, { bold: true, color: WHITE, size: 24 })],
      }),
    ],
  });
}

function tableRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [labelCell(label), valueCell(value)],
  });
}

function headerParagraph(
  label: string,
  value: string,
  valueColor = "333333"
): Paragraph {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [
      run(label, { bold: true, color: NAVY, size: 22 }),
      run(value, { bold: true, color: valueColor, size: 22 }),
    ],
  });
}

function spacer(before = 120, after = 60): Paragraph {
  return new Paragraph({ children: [], spacing: { before, after } });
}

// ─── Export principal ──────────────────────────────────────────────────────

export async function generateDocxBuffer(cr: CompteRendu): Promise<Buffer> {
  const { candidat, dateGeneration } = cr;
  const nomComplet = `${candidat.prenom} ${candidat.nom}`.trim() || "Candidat";

  // ── Logo ──
  let logoChildren: (ImageRun | TextRun)[] = [];
  try {
    const logoPath = path.join(process.cwd(), "public", "logo-cabrh.png");
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      logoChildren = [
        new ImageRun({
          data: logoBuffer,
          transformation: { width: 180, height: 58 },
          type: "png",
          altText: { title: "le CabRH", description: "Logo le CabRH", name: "logo" },
        }),
      ];
    }
  } catch { /* logo non dispo */ }

  if (logoChildren.length === 0) {
    logoChildren = [run("le CabRH", { bold: true, color: NAVY, size: 36 })];
  }

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "bullet-list",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 480, hanging: 240 } },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            // A4
            size: { width: 11906, height: 16838 },
            margin: { top: 900, right: 900, bottom: 900, left: 900 },
          },
        },

        // ── En-tête de page ──
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  run("le CabRH — Le Partenaire de Votre Recrutement", {
                    color: SKY, size: 16, italics: true,
                  }),
                ],
              }),
            ],
          }),
        },

        // ── Pied de page ──
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  run(`Document confidentiel — le CabRH — ${dateGeneration} — Page `, {
                    color: "999999", size: 16,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: "Calibri",
                    size: 16,
                    color: "999999",
                  }),
                ],
              }),
            ],
          }),
        },

        children: [

          // ── Logo ──
          new Paragraph({
            spacing: { before: 0, after: 180 },
            children: logoChildren,
          }),

          // ── Titre principal ──
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 60 },
            children: [
              run("COMPTE RENDU D'ENTRETIEN", {
                bold: true, color: NAVY, size: 36,
              }),
            ],
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 6, color: SKY, space: 4 },
            },
          }),

          spacer(120, 80),

          // ── Bloc méta (en-tête du CR) ──
          headerParagraph("Consultant : ", "À compléter", "888888"),
          headerParagraph("Effectué le : ", dateGeneration),
          headerParagraph("Pour : ", ""),
          headerParagraph("Poste : ", candidat.poste || "—"),

          spacer(180, 120),

          // ── Tableau principal ──
          new Table({
            width: { size: TABLE_W, type: WidthType.DXA },
            columnWidths: [COL_LABEL, COL_VALUE],
            rows: [

              // Ligne titre fusionnée
              new TableRow({
                children: [mergedHeaderCell("Profil du Candidat")],
              }),

              tableRow("CANDIDAT :", nomComplet),
              tableRow("POSTE SOUHAITÉ :", candidat.poste || "—"),
              tableRow("RÉSIDENCE", candidat.residence || "Non précisée"),
              tableRow("NATIONALITÉ", candidat.nationalite || "Française"),

              // Formation — peut être multi-ligne
              new TableRow({
                children: [
                  labelCell("FORMATION"),
                  new TableCell({
                    width: { size: COL_VALUE, type: WidthType.DXA },
                    borders: cellBorders,
                    shading: { fill: WHITE, type: ShadingType.CLEAR, color: "auto" },
                    margins: { top: 100, bottom: 100, left: 150, right: 150 },
                    children: candidat.formation
                      ? candidat.formation.split(/\n|(?<=\))\s*(?=[A-Z•\-])/).filter(Boolean).map(
                          (line) =>
                            new Paragraph({
                              numbering: { reference: "bullet-list", level: 0 },
                              children: [run(line.trim(), { color: "1A1A1A", size: 22 })],
                            })
                        )
                      : [new Paragraph({ children: [run("Non précisée", { color: "888888", italics: true })] })],
                  }),
                ],
              }),

              // Expérience — prose longue
              new TableRow({
                children: [
                  labelCell("EXPÉRIENCE"),
                  new TableCell({
                    width: { size: COL_VALUE, type: WidthType.DXA },
                    borders: cellBorders,
                    shading: { fill: WHITE, type: ShadingType.CLEAR, color: "auto" },
                    margins: { top: 100, bottom: 100, left: 150, right: 150 },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { line: 280 },
                        children: [run(candidat.experience || "—", { color: "1A1A1A", size: 22 })],
                      }),
                    ],
                  }),
                ],
              }),

              // Compétences
              new TableRow({
                children: [
                  labelCell("RÉSUMÉ DES COMPÉTENCES"),
                  new TableCell({
                    width: { size: COL_VALUE, type: WidthType.DXA },
                    borders: cellBorders,
                    shading: { fill: WHITE, type: ShadingType.CLEAR, color: "auto" },
                    margins: { top: 100, bottom: 100, left: 150, right: 150 },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { line: 280 },
                        children: [run(candidat.competences || "—", { color: "1A1A1A", size: 22 })],
                      }),
                    ],
                  }),
                ],
              }),

              // Salaire marché
              tableRow("SALAIRE", candidat.salaireMarchePoste || "—"),

              // Disponibilités
              tableRow("DISPONIBILITÉ ENTRETIEN", candidat.disponibiliteEntretien || "À définir"),
              tableRow("DISPONIBILITÉ DÉMARRAGE", candidat.disponibiliteDemarrage || "À définir"),
            ],
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
