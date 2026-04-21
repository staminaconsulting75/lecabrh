/* eslint-disable @typescript-eslint/no-require-imports */
// pdfkit est un external webpack (CommonJS) → require obligatoire
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PDFDocument = require("pdfkit") as any;

import fs from "fs";
import path from "path";
import type { CVAnonymise } from "./anonymizeCV";

// ─── Palette le CabRH ─────────────────────────────────────────────
const NAVY   = "#004D71";
const SKY    = "#009ADE";
const WHITE  = "#FFFFFF";
const LIGHT  = "#E6F5FB";
const DARK   = "#2D2D2D";
const GRAY   = "#6B7280";
const BORDER = "#C8D8E8";

const PAGE_W = 595.28; // A4 largeur pts
const MARGIN = 50;
const COL_W  = PAGE_W - MARGIN * 2;

export async function generateAnonymePdfBuffer(cv: CVAnonymise): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: MARGIN, info: { Title: "CV Anonymisé — le CabRH" } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ── Polices ────────────────────────────────────────────────────
    const fontBold   = "Helvetica-Bold";
    const fontNormal = "Helvetica";

    let y = MARGIN;

    // ── HEADER ────────────────────────────────────────────────────
    // Bandeau navy haut
    doc.rect(0, 0, PAGE_W, 90).fill(NAVY);

    // Logo le CabRH
    const logoPath = path.join(process.cwd(), "public", "logo-cabrh.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, MARGIN, 20, { height: 50 });
    } else {
      doc.font(fontBold).fontSize(18).fillColor(WHITE).text("le CabRH", MARGIN, 30);
    }

    // Label "CV ANONYMISÉ" à droite
    doc.font(fontNormal).fontSize(9).fillColor("rgba(255,255,255,0.6)")
      .text("CV ANONYMISÉ", PAGE_W - MARGIN - 80, 30, { width: 80, align: "right" });
    doc.font(fontBold).fontSize(11).fillColor(SKY)
      .text("Confidentiel", PAGE_W - MARGIN - 80, 45, { width: 80, align: "right" });

    // Bandeau titre du poste
    doc.rect(0, 90, PAGE_W, 40).fill(SKY);
    doc.font(fontBold).fontSize(14).fillColor(WHITE)
      .text(cv.titreProfessionnel || "Profil Professionnel", MARGIN, 102, { width: COL_W });

    y = 150;

    // ── Helper : titre de section ──────────────────────────────────
    const sectionTitle = (title: string) => {
      // Vérification de saut de page
      if (y + 40 > doc.page.height - MARGIN) { doc.addPage(); y = MARGIN; }
      doc.rect(MARGIN, y, COL_W, 22).fill(NAVY);
      doc.font(fontBold).fontSize(10).fillColor(WHITE)
        .text(title.toUpperCase(), MARGIN + 8, y + 6, { width: COL_W - 16 });
      y += 30;
    };

    // ── Helper : bullet ────────────────────────────────────────────
    const bullet = (text: string, indent = 12) => {
      if (y + 16 > doc.page.height - MARGIN) { doc.addPage(); y = MARGIN; }
      doc.font(fontNormal).fontSize(9).fillColor(SKY)
        .text("▸", MARGIN + indent, y, { width: 12 });
      doc.font(fontNormal).fontSize(9).fillColor(DARK)
        .text(text, MARGIN + indent + 14, y, { width: COL_W - indent - 14 });
      y += doc.heightOfString(text, { width: COL_W - indent - 14, fontSize: 9 }) + 4;
    };

    // ── Helper : texte normal ──────────────────────────────────────
    const bodyText = (text: string, opts: Record<string, unknown> = {}) => {
      if (y + 14 > doc.page.height - MARGIN) { doc.addPage(); y = MARGIN; }
      doc.font(fontNormal).fontSize(9).fillColor(DARK)
        .text(text, MARGIN, y, { width: COL_W, align: "justify", ...opts });
      y += doc.heightOfString(text, { width: COL_W, fontSize: 9, ...opts }) + 6;
    };

    const space = (h = 8) => { y += h; };

    // ── PROFIL ─────────────────────────────────────────────────────
    if (cv.profil) {
      sectionTitle("Profil");
      bodyText(cv.profil);
      space();
    }

    // ── FORMATIONS ─────────────────────────────────────────────────
    if (cv.formations.length > 0) {
      sectionTitle("Formation");
      cv.formations.forEach((f) => {
        if (y + 30 > doc.page.height - MARGIN) { doc.addPage(); y = MARGIN; }
        doc.font(fontBold).fontSize(9).fillColor(NAVY)
          .text(f.diplome, MARGIN, y, { width: COL_W - 60 });
        doc.font(fontNormal).fontSize(9).fillColor(GRAY)
          .text(f.annee, MARGIN + COL_W - 50, y, { width: 50, align: "right" });
        y += 14;
        if (f.etablissement) {
          doc.font(fontNormal).fontSize(9).fillColor(GRAY)
            .text(f.etablissement, MARGIN, y);
          y += 14;
        }
        space(4);
      });
      space();
    }

    // ── EXPÉRIENCES ────────────────────────────────────────────────
    if (cv.experiences.length > 0) {
      sectionTitle("Expériences Professionnelles");
      cv.experiences.forEach((exp) => {
        if (y + 50 > doc.page.height - MARGIN) { doc.addPage(); y = MARGIN; }

        // Intitulé + période
        doc.font(fontBold).fontSize(10).fillColor(NAVY)
          .text(exp.intitule, MARGIN, y, { width: COL_W - 80 });
        doc.font(fontNormal).fontSize(8).fillColor(SKY)
          .text(exp.periode, MARGIN + COL_W - 70, y, { width: 70, align: "right" });
        y += 15;

        // Entreprise
        if (exp.entreprise) {
          doc.font(fontNormal).fontSize(9).fillColor(GRAY)
            .text(exp.entreprise, MARGIN, y);
          y += 13;
        }

        // Missions
        if (exp.missions?.length > 0) {
          exp.missions.forEach((m) => bullet(m));
        }
        space(6);

        // Séparateur léger
        if (y + 4 < doc.page.height - MARGIN) {
          doc.moveTo(MARGIN, y).lineTo(MARGIN + COL_W, y).strokeColor(BORDER).lineWidth(0.5).stroke();
          y += 8;
        }
      });
      space();
    }

    // ── COMPÉTENCES ────────────────────────────────────────────────
    const hasCompetences = cv.competences.length > 0 || cv.logiciels.length > 0 || cv.langues.length > 0;
    if (hasCompetences) {
      sectionTitle("Compétences & Outils");

      // Layout 2 colonnes
      const colW2 = (COL_W - 16) / 2;

      if (cv.competences.length > 0) {
        if (y + 14 > doc.page.height - MARGIN) { doc.addPage(); y = MARGIN; }
        doc.font(fontBold).fontSize(9).fillColor(NAVY).text("Compétences techniques", MARGIN, y);
        y += 14;
        cv.competences.forEach((c) => bullet(c));
        space(4);
      }

      if (cv.logiciels.length > 0) {
        if (y + 14 > doc.page.height - MARGIN) { doc.addPage(); y = MARGIN; }
        doc.font(fontBold).fontSize(9).fillColor(NAVY).text("Logiciels & Outils", MARGIN, y);
        y += 14;
        // Tags inline
        let tx = MARGIN;
        cv.logiciels.forEach((l) => {
          const tw = doc.widthOfString(l, { fontSize: 8 }) + 14;
          if (tx + tw > MARGIN + COL_W) { tx = MARGIN; y += 18; }
          doc.rect(tx, y, tw, 16).fill(LIGHT).stroke(BORDER);
          doc.font(fontNormal).fontSize(8).fillColor(NAVY).text(l, tx + 7, y + 4);
          tx += tw + 6;
        });
        y += 24;
        space(4);
      }

      if (cv.langues.length > 0) {
        if (y + 14 > doc.page.height - MARGIN) { doc.addPage(); y = MARGIN; }
        doc.font(fontBold).fontSize(9).fillColor(NAVY).text("Langues", MARGIN, y);
        y += 14;
        cv.langues.forEach((l) => bullet(l));
        space(4);
      }

      space();
    }

    // ── CERTIFICATIONS ─────────────────────────────────────────────
    if (cv.certifications.length > 0) {
      sectionTitle("Certifications & Habilitations");
      cv.certifications.forEach((c) => bullet(c));
      space();
    }

    // ── AUTRES INFOS ───────────────────────────────────────────────
    if (cv.autresInfos) {
      sectionTitle("Informations complémentaires");
      bodyText(cv.autresInfos);
      space();
    }

    // ── FOOTER ────────────────────────────────────────────────────
    const footerY = doc.page.height - 35;
    doc.rect(0, footerY - 5, PAGE_W, 40).fill(NAVY);
    doc.font(fontNormal).fontSize(8).fillColor("rgba(255,255,255,0.5)")
      .text(
        `le CabRH — Cabinet de Recrutement  |  CV Anonymisé — Confidentiel  |  ${new Date().toLocaleDateString("fr-FR")}`,
        MARGIN, footerY + 2, { width: COL_W, align: "center" }
      );

    doc.end();
  });
}
