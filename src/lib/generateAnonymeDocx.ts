import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  ShadingType,
  TableRow,
  TableCell,
  Table,
  WidthType,
  VerticalAlign,
  Header,
  ImageRun,
} from "docx";
import type { CVAnonymise } from "./anonymizeCV";
import fs from "fs";
import path from "path";

// ── Couleurs ─────────────────────────────────────────────────────────
const NAVY = "004D71";
const SKY  = "009ADE";
const LIGHT_BG = "E6F5FB";
const WHITE = "FFFFFF";
const GRAY  = "555555";
const DARK  = "1A1A1A";

// ── Helpers runs ─────────────────────────────────────────────────────
const run = (text: string, opts: Partial<{
  bold: boolean; color: string; size: number; font: string; italic: boolean;
}> = {}) =>
  new TextRun({
    text,
    bold: opts.bold,
    color: opts.color ?? DARK,
    size: opts.size ?? 20,           // 10pt = 20 half-pts
    font: opts.font ?? "Arial",
    italics: opts.italic,
  });

// Paragraphe vide de séparation
const spacer = (lines = 1) =>
  new Paragraph({ children: [new TextRun({ text: "", size: 12 })], spacing: { after: lines * 60 } });

// Séparateur horizontal bleu ciel
const divider = () =>
  new Paragraph({
    children: [],
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 12, color: SKY },
    },
    spacing: { after: 120 },
  });

// Titre de section (fond bleu clair, texte navy bold)
const sectionTitle = (label: string) =>
  new Paragraph({
    children: [run(label.toUpperCase(), { bold: true, color: WHITE, size: 20 })],
    shading: { type: ShadingType.SOLID, color: NAVY },
    spacing: { before: 160, after: 80 },
    indent: { left: 120 },
  });

// Paragraphe de corps justifié
const bodyPara = (text: string, opts: { bold?: boolean; italic?: boolean; indent?: number } = {}) =>
  new Paragraph({
    children: [run(text, { bold: opts.bold, italic: opts.italic, size: 18 })],
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 40 },
    indent: opts.indent ? { left: opts.indent } : undefined,
  });

// Bullet point (tiret)
const bullet = (text: string) =>
  new Paragraph({
    children: [run(`–  ${text}`, { size: 18, color: GRAY })],
    spacing: { after: 30 },
    indent: { left: 360 },
  });

export async function generateAnonymeDocxBuffer(cv: CVAnonymise): Promise<Buffer> {
  // ── Logo CabRH ────────────────────────────────────────────────────
  const logoPath = path.join(process.cwd(), "public", "templates", "cabrh-logo.jpg");
  const logoBuffer = fs.existsSync(logoPath) ? fs.readFileSync(logoPath) : null;

  const headerChildren: Paragraph[] = [];

  if (logoBuffer) {
    headerChildren.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: logoBuffer,
            transformation: { width: 130, height: 42 },
            type: "jpg",
          }),
        ],
        spacing: { after: 60 },
      })
    );
  }

  // Ligne de séparation bleue en en-tête
  headerChildren.push(
    new Paragraph({
      children: [],
      border: { bottom: { style: BorderStyle.SINGLE, size: 16, color: SKY } },
    })
  );

  // ── Section d'informations (titre pro + profil) ───────────────────
  const children: Paragraph[] = [];

  // Titre professionnel
  children.push(
    new Paragraph({
      children: [run(cv.titreProfessionnel || "CV Anonymisé", { bold: true, color: NAVY, size: 32 })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 120 },
    })
  );

  // Badge « CV Anonymisé – le CabRH »
  children.push(
    new Paragraph({
      children: [run("CV ANONYMISÉ — LE CABRH", { bold: true, color: WHITE, size: 16 })],
      alignment: AlignmentType.CENTER,
      shading: { type: ShadingType.SOLID, color: SKY },
      spacing: { before: 0, after: 160 },
    })
  );

  divider();

  // ── PROFIL ────────────────────────────────────────────────────────
  if (cv.profil && cv.profil.trim()) {
    children.push(sectionTitle("Profil"));
    children.push(bodyPara(cv.profil));
  }

  // ── EXPÉRIENCES ───────────────────────────────────────────────────
  if (cv.experiences && cv.experiences.length > 0) {
    children.push(sectionTitle("Expériences professionnelles"));

    for (const exp of cv.experiences) {
      // En-tête expérience : poste + période
      children.push(
        new Paragraph({
          children: [
            run(`${exp.intitule}`, { bold: true, color: NAVY, size: 20 }),
            run(exp.periode ? `  —  ${exp.periode}` : "", { color: GRAY, size: 18 }),
          ],
          spacing: { before: 120, after: 20 },
        })
      );
      // Entreprise
      if (exp.entreprise) {
        children.push(
          new Paragraph({
            children: [run(exp.entreprise, { italic: true, color: SKY, size: 18 })],
            spacing: { after: 40 },
          })
        );
      }
      // Missions
      for (const m of exp.missions || []) {
        children.push(bullet(m));
      }
    }
  }

  // ── FORMATIONS ────────────────────────────────────────────────────
  if (cv.formations && cv.formations.length > 0) {
    children.push(sectionTitle("Formations"));

    for (const f of cv.formations) {
      children.push(
        new Paragraph({
          children: [
            run(`${f.diplome}`, { bold: true, color: NAVY, size: 20 }),
            run(f.annee ? `  —  ${f.annee}` : "", { color: GRAY, size: 18 }),
          ],
          spacing: { before: 100, after: 20 },
        })
      );
      if (f.etablissement) {
        children.push(
          new Paragraph({
            children: [run(f.etablissement, { italic: true, color: GRAY, size: 18 })],
            spacing: { after: 60 },
          })
        );
      }
    }
  }

  // ── COMPÉTENCES ───────────────────────────────────────────────────
  if (cv.competences && cv.competences.length > 0) {
    children.push(sectionTitle("Compétences"));
    // Affichage en grille 2 colonnes via une table invisible
    const half = Math.ceil(cv.competences.length / 2);
    const col1 = cv.competences.slice(0, half);
    const col2 = cv.competences.slice(half);
    const rows = col1.map((c, i) =>
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [run(`• ${c}`, { size: 18 })], spacing: { after: 20 } })],
            borders: {
              top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
            },
            verticalAlign: VerticalAlign.TOP,
          }),
          new TableCell({
            children: [
              col2[i]
                ? new Paragraph({ children: [run(`• ${col2[i]}`, { size: 18 })], spacing: { after: 20 } })
                : new Paragraph({ children: [] }),
            ],
            borders: {
              top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
            },
            verticalAlign: VerticalAlign.TOP,
          }),
        ],
      })
    );
    children.push(
      new Table({
        rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [4500, 4500],
      }) as unknown as Paragraph
    );
    children.push(spacer());
  }

  // ── LANGUES + LOGICIELS (côte à côte) ────────────────────────────
  const hasLangues   = cv.langues && cv.langues.length > 0;
  const hasLogiciels = cv.logiciels && cv.logiciels.length > 0;

  if (hasLangues || hasLogiciels) {
    children.push(sectionTitle(hasLangues && hasLogiciels ? "Langues & Logiciels" : hasLangues ? "Langues" : "Logiciels"));

    const maxLen = Math.max(
      hasLangues ? cv.langues.length : 0,
      hasLogiciels ? cv.logiciels.length : 0,
    );

    if (hasLangues && hasLogiciels) {
      // Titre des colonnes
      children.push(
        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [run("Langues", { bold: true, color: NAVY, size: 18 })] })],
                  borders: {
                    top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, color: SKY, size: 6 },
                    left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
                  },
                  shading: { type: ShadingType.SOLID, color: LIGHT_BG },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [run("Logiciels & Outils", { bold: true, color: NAVY, size: 18 })] })],
                  borders: {
                    top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, color: SKY, size: 6 },
                    left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
                  },
                  shading: { type: ShadingType.SOLID, color: LIGHT_BG },
                }),
              ],
            }),
            ...Array.from({ length: maxLen }, (_, i) =>
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: cv.langues[i] ? [run(`• ${cv.langues[i]}`, { size: 18 })] : [], spacing: { after: 20 } })],
                    borders: {
                      top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
                    },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: cv.logiciels[i] ? [run(`• ${cv.logiciels[i]}`, { size: 18 })] : [], spacing: { after: 20 } })],
                    borders: {
                      top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
                    },
                  }),
                ],
              })
            ),
          ],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }) as unknown as Paragraph
      );
      children.push(spacer());
    } else {
      const items = hasLangues ? cv.langues : cv.logiciels;
      for (const item of items) children.push(bullet(item));
    }
  }

  // ── CERTIFICATIONS ────────────────────────────────────────────────
  if (cv.certifications && cv.certifications.length > 0) {
    children.push(sectionTitle("Certifications"));
    for (const c of cv.certifications) children.push(bullet(c));
  }

  // ── AUTRES INFOS ──────────────────────────────────────────────────
  if (cv.autresInfos && cv.autresInfos.trim()) {
    children.push(sectionTitle("Informations complémentaires"));
    children.push(bodyPara(cv.autresInfos));
  }

  // ── Pied de page ─────────────────────────────────────────────────
  children.push(spacer(2));
  children.push(
    new Paragraph({
      children: [
        run("SARL ACE RH au capital de 10 000 euros  |  LE CABRH - 15, Allée Duguay Trouin – 44000 NANTES  |  Siret 88922462200031 : Code APE : 7022Z",
          { size: 14, color: GRAY })
      ],
      alignment: AlignmentType.CENTER,
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: SKY } },
      spacing: { before: 80 },
    })
  );

  // ── Assemblage du document ────────────────────────────────────────
  const doc = new Document({
    sections: [
      {
        headers: {
          default: new Header({ children: headerChildren }),
        },
        properties: {
          page: {
            margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
