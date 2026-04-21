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
  ImageRun,
  Header,
  Footer,
  PageNumber,
  UnderlineType,
  ShadingType,
  VerticalAlign,
  convertInchesToTwip,
} from "docx";
import fs from "fs";
import path from "path";
import type { AnnonceGeneree } from "./generateAnnonce";

// ─── Palette le CabRH ──────────────────────────────────────────────
const NAVY        = "004D71";
const SKY         = "009ADE";
const WHITE       = "FFFFFF";
const LIGHT_BLUE  = "E6F5FB";
const GRAY_BORDER = "C8D8E8";
const DARK_TEXT   = "2D2D2D";
const GRAY_TEXT   = "555555";

// ─── Helpers ───────────────────────────────────────────────────────

/** Titre de section (bandeau navy pleine largeur) */
function sectionHeader(num: string, title: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `  ${num}  `,
        bold: true,
        color: SKY,
        size: 18,
        font: "Calibri",
      }),
      new TextRun({
        text: title.toUpperCase(),
        bold: true,
        color: WHITE,
        size: 22,
        font: "Calibri",
      }),
      new TextRun({ text: "  ", size: 22 }),
    ],
    shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
    spacing: { before: 280, after: 140 },
  });
}

/** Bullet point ▸ */
function bullet(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: "▸  ", color: SKY, bold: true, size: 20, font: "Calibri" }),
      new TextRun({ text, color: DARK_TEXT, size: 20, font: "Calibri" }),
    ],
    spacing: { before: 50, after: 50 },
    indent: { left: 280 },
  });
}

/** Ligne info : label | valeur dans tableau 2 colonnes */
function infoRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: label, bold: true, color: NAVY, size: 18, font: "Calibri" })],
        })],
        width: { size: 2800, type: WidthType.DXA },
        shading: { type: ShadingType.SOLID, color: LIGHT_BLUE, fill: LIGHT_BLUE },
        borders: allBorders(GRAY_BORDER),
        margins: { top: 80, bottom: 80, left: 140, right: 80 },
        verticalAlign: VerticalAlign.CENTER,
      }),
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: value || "—", color: DARK_TEXT, size: 18, font: "Calibri" })],
        })],
        width: { size: 7200, type: WidthType.DXA },
        borders: allBorders(GRAY_BORDER),
        margins: { top: 80, bottom: 80, left: 140, right: 80 },
        verticalAlign: VerticalAlign.CENTER,
      }),
    ],
  });
}

function allBorders(color: string) {
  const b = { style: BorderStyle.SINGLE, size: 4, color };
  return { top: b, bottom: b, left: b, right: b };
}

function spacer(after = 120): Paragraph {
  return new Paragraph({ children: [], spacing: { after } });
}

// ─── Export principal ──────────────────────────────────────────────
export async function generateAnnonceDocxBuffer(annonce: AnnonceGeneree): Promise<Buffer> {
  const { input, detailPoste, profilRecherche, informationsComplementaires } = annonce;

  // Logo
  let logoImage: ImageRun | null = null;
  try {
    const logoPath = path.join(process.cwd(), "public", "logo-cabrh.png");
    if (fs.existsSync(logoPath)) {
      logoImage = new ImageRun({
        data: fs.readFileSync(logoPath),
        transformation: { width: 140, height: 45 },
        type: "png",
      });
    }
  } catch { /* fallback texte */ }

  // ── Header ──────────────────────────────────────────────────────
  const headerChildren: Paragraph[] = [
    logoImage
      ? new Paragraph({ children: [logoImage], alignment: AlignmentType.LEFT })
      : new Paragraph({ children: [new TextRun({ text: "le CabRH", bold: true, color: NAVY, size: 28 })] }),
  ];

  // ── Footer ──────────────────────────────────────────────────────
  const footerChildren: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({ text: "le CabRH — Cabinet de Recrutement  |  ", color: NAVY, size: 16, font: "Calibri" }),
        new TextRun({ text: "www.lecabrh.fr", color: SKY, size: 16, font: "Calibri" }),
        new TextRun({ text: "  |  p. ", color: "888888", size: 16, font: "Calibri" }),
        new TextRun({ children: [PageNumber.CURRENT], color: "888888", size: 16, font: "Calibri" }),
      ],
      alignment: AlignmentType.CENTER,
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: SKY } },
      spacing: { before: 100 },
    }),
  ];

  // ══════════════════════════════════════════════════════════════════
  // BLOC TITRE (bandeau)
  // ══════════════════════════════════════════════════════════════════
  const titreBlock: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: input.intitule || "OFFRE D'EMPLOI", bold: true, color: WHITE, size: 40, font: "Calibri" })],
      shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 0 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: [
            informationsComplementaires.contrat,
            informationsComplementaires.localisation,
            informationsComplementaires.reference ? `Réf. ${informationsComplementaires.reference}` : "",
          ].filter(Boolean).join("   ·   "),
          color: WHITE,
          size: 20,
          font: "Calibri",
        }),
      ],
      shading: { type: ShadingType.SOLID, color: SKY, fill: SKY },
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 300 },
    }),
  ];

  // ══════════════════════════════════════════════════════════════════
  // SECTION 1 — DESCRIPTION COURTE + HASHTAGS
  // ══════════════════════════════════════════════════════════════════
  const section1: Paragraph[] = [
    sectionHeader("01", "En bref"),
    new Paragraph({
      children: [new TextRun({ text: annonce.descriptionCourte, color: DARK_TEXT, size: 20, font: "Calibri", italics: true })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 60, after: 100 },
    }),
  ];

  // Hashtags
  if (annonce.hashtags.length > 0) {
    section1.push(
      new Paragraph({
        children: annonce.hashtags.map((h, i) => new TextRun({
          text: `#${h}${i < annonce.hashtags.length - 1 ? "  " : ""}`,
          color: SKY,
          bold: true,
          size: 18,
          font: "Calibri",
        })),
        spacing: { after: 60 },
      })
    );
  }
  section1.push(spacer(100));

  // ══════════════════════════════════════════════════════════════════
  // SECTION 2 — ENTREPRISE
  // ══════════════════════════════════════════════════════════════════
  const section2: Paragraph[] = [
    sectionHeader("02", "Notre client"),
    new Paragraph({
      children: [new TextRun({ text: annonce.entrepriseTexte, color: DARK_TEXT, size: 20, font: "Calibri" })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 60, after: 100 },
    }),
  ];

  // Tags types de chantiers
  if (detailPoste.typesChantiersListe.length > 0) {
    section2.push(
      new Paragraph({
        children: [new TextRun({ text: "Secteurs & types de projets :", bold: true, color: NAVY, size: 18, font: "Calibri" })],
        spacing: { before: 80, after: 60 },
      }),
      new Paragraph({
        children: detailPoste.typesChantiersListe.flatMap((t, i) => [
          new TextRun({ text: `  ${t}  `, color: NAVY, bold: true, size: 18, font: "Calibri",
            shading: { type: ShadingType.SOLID, color: LIGHT_BLUE, fill: LIGHT_BLUE } }),
          new TextRun({ text: i < detailPoste.typesChantiersListe.length - 1 ? "  " : "", size: 18 }),
        ]),
        spacing: { after: 60 },
      })
    );
  }
  section2.push(spacer(100));

  // ══════════════════════════════════════════════════════════════════
  // SECTION 3 — DÉTAIL DU POSTE
  // ══════════════════════════════════════════════════════════════════
  const section3: (Paragraph | Table)[] = [
    sectionHeader("03", "Détail du poste"),
    new Paragraph({
      children: [new TextRun({ text: "Vos missions", bold: true, color: NAVY, size: 20, font: "Calibri",
        underline: { type: UnderlineType.SINGLE, color: SKY } })],
      spacing: { before: 100, after: 80 },
    }),
    ...detailPoste.missions.map(m => bullet(m)),
    spacer(120),
    new Paragraph({
      children: [new TextRun({ text: "Conditions", bold: true, color: NAVY, size: 20, font: "Calibri",
        underline: { type: UnderlineType.SINGLE, color: SKY } })],
      spacing: { before: 80, after: 80 },
    }),
  ];

  const condRows: TableRow[] = [];
  if (detailPoste.conditions.remuneration) condRows.push(infoRow("Rémunération", detailPoste.conditions.remuneration));
  if (detailPoste.conditions.avantages)    condRows.push(infoRow("Avantages / Primes", detailPoste.conditions.avantages));
  if (detailPoste.conditions.encadrement)  condRows.push(infoRow("Encadrement", detailPoste.conditions.encadrement));

  if (condRows.length > 0) {
    section3.push(
      new Table({ width: { size: 10000, type: WidthType.DXA }, rows: condRows })
    );
  }
  section3.push(spacer(100));

  // ══════════════════════════════════════════════════════════════════
  // SECTION 4 — PROFIL RECHERCHÉ
  // ══════════════════════════════════════════════════════════════════
  const section4: Paragraph[] = [sectionHeader("04", "Profil recherché")];

  if (profilRecherche.competences.length > 0) {
    section4.push(
      new Paragraph({ children: [new TextRun({ text: "Compétences techniques", bold: true, color: NAVY, size: 20, font: "Calibri" })], spacing: { before: 100, after: 60 } }),
      ...profilRecherche.competences.map(c => bullet(c))
    );
  }
  if (profilRecherche.habilitations.length > 0) {
    section4.push(
      new Paragraph({ children: [new TextRun({ text: "Habilitations & Certifications", bold: true, color: NAVY, size: 20, font: "Calibri" })], spacing: { before: 120, after: 60 } }),
      ...profilRecherche.habilitations.map(h => bullet(h))
    );
  }
  if (profilRecherche.qualites.length > 0) {
    section4.push(
      new Paragraph({ children: [new TextRun({ text: "Qualités humaines", bold: true, color: NAVY, size: 20, font: "Calibri" })], spacing: { before: 120, after: 60 } }),
      ...profilRecherche.qualites.map(q => bullet(q))
    );
  }
  section4.push(spacer(100));

  // ══════════════════════════════════════════════════════════════════
  // SECTION 5 — INFORMATIONS COMPLÉMENTAIRES
  // ══════════════════════════════════════════════════════════════════
  const infoRows: TableRow[] = [];
  if (informationsComplementaires.contrat)      infoRows.push(infoRow("Type de contrat", informationsComplementaires.contrat));
  if (informationsComplementaires.localisation) infoRows.push(infoRow("Localisation", informationsComplementaires.localisation));
  if (informationsComplementaires.reference)    infoRows.push(infoRow("Référence", informationsComplementaires.reference));

  const section5: (Paragraph | Table)[] = [sectionHeader("05", "Informations complémentaires")];

  if (infoRows.length > 0) {
    section5.push(
      new Table({ width: { size: 10000, type: WidthType.DXA }, rows: infoRows }),
      spacer(80)
    );
  }

  if (informationsComplementaires.autresInfos) {
    section5.push(
      new Paragraph({
        children: [new TextRun({ text: informationsComplementaires.autresInfos, color: GRAY_TEXT, size: 18, font: "Calibri", italics: true })],
        spacing: { before: 80, after: 80 },
      })
    );
  }

  // CTA
  section5.push(
    spacer(200),
    new Paragraph({
      children: [
        new TextRun({ text: "Intéressé(e) par cette opportunité ? ", bold: true, color: NAVY, size: 22, font: "Calibri" }),
        new TextRun({ text: "Contactez votre consultant le CabRH ou postulez sur ", color: GRAY_TEXT, size: 20, font: "Calibri" }),
        new TextRun({ text: "www.lecabrh.fr", color: SKY, bold: true, size: 20, font: "Calibri" }),
      ],
      alignment: AlignmentType.CENTER,
      border: {
        top:    { style: BorderStyle.SINGLE, size: 6, color: SKY },
        bottom: { style: BorderStyle.SINGLE, size: 6, color: SKY },
      },
      spacing: { before: 160, after: 160 },
    })
  );

  // ── Assemblage final ─────────────────────────────────────────────
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top:    convertInchesToTwip(0.8),
            bottom: convertInchesToTwip(0.8),
            left:   convertInchesToTwip(0.9),
            right:  convertInchesToTwip(0.9),
          },
        },
      },
      headers: { default: new Header({ children: headerChildren }) },
      footers: { default: new Footer({ children: footerChildren }) },
      children: [
        ...titreBlock,
        ...section1,
        ...section2,
        ...section3,
        ...section4,
        ...section5,
      ],
    }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
