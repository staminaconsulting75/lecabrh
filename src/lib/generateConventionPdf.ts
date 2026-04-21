/* eslint-disable @typescript-eslint/no-require-imports */
import type { ConventionData } from "./generateConventionDocx";
import fs from "fs";
import path from "path";

export async function generateConventionPdfBuffer(data: ConventionData): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const PDFDocument = require("pdfkit") as any;

  return new Promise((resolve, reject) => {
    // ── A4 avec marges identiques au template (1417 twips = 70.85pt ≈ 71pt) ──
    const MARGIN = 71;
    const PAGE_W = 595.28;
    const PAGE_H = 841.89;
    const TW = PAGE_W - MARGIN * 2; // 453pt usable width

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: MARGIN, bottom: 70, left: MARGIN, right: MARGIN },
      bufferPages: true, // needed for per-page footer
      info: {
        Title: `Convention de Recrutement — ${data.titrePoste || data.nomClient}`,
        Author: "le CabRH",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ── Couleurs ──────────────────────────────────────────────────────────
    const NAVY  = "#004D71";
    const SKY   = "#009ADE";
    const BLACK = "#1A1A1A";
    const GRAY  = "#555555";

    // ── Helpers ───────────────────────────────────────────────────────────
    const x0 = MARGIN; // left margin

    /** Texte justifié 9pt – corps courant */
    const body = (text: string, opts: Record<string, unknown> = {}) => {
      doc.font("Helvetica").fontSize(9).fillColor(BLACK)
        .text(text, x0, doc.y, { width: TW, align: "justify", lineGap: 1.5, ...opts });
    };

    /** Paragraphe article numéroté  "N.   texte..." avec retrait identique template */
    const INDENT = 21; // 425 twips / 20
    const articlePara = (num: number, content: string) => {
      if (doc.y > PAGE_H - 110) doc.addPage();
      const label = `${num}.`;
      doc.font("Helvetica").fontSize(9).fillColor(BLACK)
        .text(label, x0, doc.y, { continued: true, width: INDENT, lineGap: 1.5 });
      doc.text(`  ${content}`, { width: TW - INDENT, align: "justify", lineGap: 1.5 });
      doc.moveDown(0.4);
    };

    // ─────────────────────────────────────────────────────────────────────
    // PAGE 1 – EN-TÊTE
    // ─────────────────────────────────────────────────────────────────────

    // ── Logo CabRH (en haut à gauche, identique au template) ─────────────
    // Template: cx=3289935 EMU → 3289935/914400*72 ≈ 258.8pt
    //           cy=1065530 EMU → 1065530/914400*72 ≈  83.8pt
    const LOGO_W = 173; // ~61mm, proportionnel template
    const LOGO_H = 56;  // ~20mm
    const logoPath = path.join(process.cwd(), "public", "templates", "cabrh-logo.jpg");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, x0, MARGIN - 10, { width: LOGO_W, height: LOGO_H });
    }

    // ── Date (en haut à droite, gras, 20pt, identique au template sz:40) ──
    if (data.date) {
      doc.font("Helvetica-Bold").fontSize(20).fillColor(BLACK)
        .text(data.date, x0, MARGIN + 5, { width: TW, align: "right" });
    }

    // ── Espacements vides après l'en-tête (template : plusieurs <w:p> vides) ──
    doc.moveDown(3.5);

    // ── Titre principal (center, bold, 24pt = sz:48, navy) ───────────────
    const titleText = data.titrePoste
      ? `CONVENTION DE RECRUTEMENT : ${data.titrePoste} (H/F)`
      : "CONVENTION DE RECRUTEMENT";
    doc.font("Helvetica-Bold").fontSize(24).fillColor(NAVY)
      .text(titleText, x0, doc.y, { width: TW, align: "center" });

    doc.moveDown(1.5);

    // ── Logo client (centré, si fourni – remplace "Logo du client") ───────
    if (data.logoBase64 && data.logoMimeType) {
      try {
        const logoBuf = Buffer.from(data.logoBase64, "base64");
        // Dimensions cibles : hauteur max 45pt, largeur max 150pt
        doc.image(logoBuf, x0 + (TW - 150) / 2, doc.y, { fit: [150, 45], align: "center" });
        doc.moveDown(3.5);
      } catch { doc.moveDown(1); }
    } else {
      doc.moveDown(1);
    }

    // ── "CONDITIONS CONTRACTUELLES..." (center, bold, 9pt) ───────────────
    doc.font("Helvetica-Bold").fontSize(9).fillColor(BLACK)
      .text("CONDITIONS CONTRACTUELLES DE PRESENTATION DE CANDIDATS", x0, doc.y, { width: TW, align: "center" });
    doc.moveDown(0.8);

    // ─────────────────────────────────────────────────────────────────────
    // INTRO + PARTIES
    // ─────────────────────────────────────────────────────────────────────
    body('La présente convention (dénommée ci-après "la Convention") est conclue');
    doc.moveDown(0.5);

    // ENTRE : LE CABRH
    doc.font("Helvetica").fontSize(9).fillColor(BLACK)
      .text("ENTRE :", x0, doc.y, { continued: true, lineGap: 1.5 })
      .font("Helvetica").text(
        " LE CABRH (dénommée ci-après \u201cLE CABRH\u201d), dont le si\u00e8ge social est situ\u00e9 \u2013 15 All\u00e9e Duguay Trouin \u2013 44000 NANTES.",
        { width: TW, align: "justify", lineGap: 1.5 }
      );
    doc.moveDown(0.3);

    const consultantFull = [data.consultantPrenomNom, data.consultantFonction].filter(Boolean).join(", ");
    doc.font("Helvetica-Bold").fontSize(9).fillColor(BLACK)
      .text(`Repr\u00e9sent\u00e9e par\u00a0: ${consultantFull || "\u2014"}`,
        x0, doc.y, { width: TW, align: "justify", lineGap: 1.5 });
    doc.moveDown(0.5);

    // ET : Client
    const clientName = data.nomClient || "NOM DU CLIENT";
    doc.font("Helvetica").fontSize(9).fillColor(BLACK)
      .text("ET\u00a0:", x0, doc.y, { continued: true, lineGap: 1.5 })
      .text(
        ` ${clientName} (d\u00e9nomm\u00e9e ci-apr\u00e8s \u201cle Client\u201d), dont le si\u00e8ge social est situ\u00e9 ${data.adresseClient ? "\u2013 " + data.adresseClient + "." : "\u2013."}`,
        { width: TW, align: "justify", lineGap: 1.5 }
      );
    doc.moveDown(0.3);

    const clientRep = [data.prenomNomSignataire, data.fonctionSignataire].filter(Boolean).join(", ");
    if (clientRep) {
      doc.font("Helvetica-Bold").fontSize(9).fillColor(BLACK)
        .text(`Repr\u00e9sent\u00e9e par ${clientRep}.`,
          x0, doc.y, { width: TW, align: "justify", lineGap: 1.5 });
    }
    doc.moveDown(0.8);

    // ─────────────────────────────────────────────────────────────────────
    // ARTICLES 1 – 7  (liste numId:1, départ 1)
    // ─────────────────────────────────────────────────────────────────────
    articlePara(1, "Sur demande du Client, LE CABRH pr\u00e9sentera un ou plusieurs candidat(s) au Client en vue de leur recrutement.");
    articlePara(2, "LE CABRH assiste le Client dans les processus de s\u00e9lection et de recrutement du candidat. LE CABRH met tout en \u0153uvre pour \u00e9valuer le candidat mais ne se porte en aucun cas garant des aptitudes techniques ou autres du candidat.");
    articlePara(3, "La Convention constitue le seul contrat entre LE CABRH et le Client.");
    articlePara(4, "La Convention ne peut \u00eatre modifi\u00e9e que par accord \u00e9crit entre LE CABRH et le Client.");
    articlePara(5, "Une pr\u00e9sentation de candidat sera r\u00e9put\u00e9e avoir eu lieu d\u00e8s que LE CABRH aura fourni au Client une information identifiant un candidat par son nom ou des renseignements suffisants afin d\u2019identifier ce candidat. La pr\u00e9sente Convention prend effet d\u00e8s qu\u2019une pr\u00e9sentation a lieu.");
    articlePara(6, "Les candidats pr\u00e9sent\u00e9s par LE CABRH ne peuvent \u00eatre consid\u00e9r\u00e9s comme provenant du Client, sauf si celui-ci justifie d\u2019un contact direct avec eux dans les trente (30) jours pr\u00e9c\u00e9dant leur pr\u00e9sentation.");
    articlePara(7, "Les honoraires de LE CABRH correspondent \u00e0 un montant fixe ou un pourcentage de la r\u00e9mun\u00e9ration annuelle totale anticip\u00e9e pour la premi\u00e8re ann\u00e9e d\u2019un candidat, comprenant notamment, toute bonification ou commission et autres avantages accord\u00e9s au candidat s\u2019il est salari\u00e9. Si le candidat a le statut d\u2019ind\u00e9pendant, tous les revenus, b\u00e9n\u00e9fices, profits et biens qui lui sont attribu\u00e9s seront pris en consid\u00e9ration, de m\u00eame que tous les avantages compl\u00e9mentaires \u00e9ventuels. Le Client fournira \u00e0 LE CABRH un \u00e9tat complet de l\u2019ensemble des r\u00e9mun\u00e9rations \u00e0 percevoir par le candidat ainsi qu\u2019une copie de l\u2019offre d\u2019embauche et/ou le contrat de travail concernant le candidat. Si un candidat est engag\u00e9 \u00e0 temps partiel ou pour une dur\u00e9e d\u00e9termin\u00e9e de moins de douze mois, l\u2019\u00e9quivalent de la r\u00e9mun\u00e9ration annuelle du candidat travaillant \u00e0 temps plein sera pris en compte afin de calculer les honoraires de recrutement de LE CABRH.");

    // ─────────────────────────────────────────────────────────────────────
    // ARTICLE 8 – Honoraires (liste numId:2, départ 8)
    // ─────────────────────────────────────────────────────────────────────
    if (doc.y > PAGE_H - 110) doc.addPage();
    doc.font("Helvetica").fontSize(9).fillColor(BLACK)
      .text("8.", x0, doc.y, { continued: true, width: INDENT, lineGap: 1.5 });
    doc.text("  Les pourcentages mentionn\u00e9s \u00e0 l\u2019article 7 sont les suivants\u00a0:",
      { width: TW - INDENT, align: "justify", lineGap: 1.5 });
    doc.moveDown(0.3);

    // Ligne d'en-tête du tableau honoraires (indenté comme le corps du §)
    const hdrX = x0 + INDENT;
    const hdrW = TW - INDENT;
    doc.font("Helvetica").fontSize(8.5).fillColor(GRAY)
      .text("Montant de la r\u00e9mun\u00e9ration de r\u00e9f\u00e9rence en euros (\u20ac)\u00a0: Montant fixe ou pourcentage appliqu\u00e9 Hors Taxes\u00a0:",
        hdrX, doc.y, { width: hdrW, align: "justify", lineGap: 1.5 });
    doc.moveDown(0.3);

    // Valeur honoraires (bold italic, indenté)
    const honorairesLine =
      data.honorairesType === "pourcentage"
        ? `${data.honorairesValeur} du salaire brut annuel du candidat recruté`
        : `Forfait fixe ${data.honorairesValeur}`;
    doc.font("Helvetica-BoldOblique").fontSize(9).fillColor(BLACK)
      .text(honorairesLine, hdrX, doc.y, { width: hdrW, align: "justify", lineGap: 1.5 });
    doc.moveDown(0.3);

    // "Ou" + forfait uniquement si forfait sélectionné
    if (data.honorairesType === "forfait") {
      doc.font("Helvetica-BoldOblique").fontSize(9).fillColor(BLACK)
        .text("Ou", hdrX, doc.y, { width: hdrW, lineGap: 1.5 });
      doc.moveDown(0.2);
      doc.font("Helvetica-BoldOblique").fontSize(9).fillColor(BLACK)
        .text(`Forfait fixe ${data.honorairesValeur}`, hdrX, doc.y, { width: hdrW, lineGap: 1.5 });
      doc.moveDown(0.3);
    }

    doc.font("Helvetica").fontSize(9).fillColor(BLACK)
      .text("Les honoraires de LE CABRH sont dus d\u00e8s le recrutement d\u2019un candidat, y compris tout recrutement tel que vis\u00e9 aux articles 11, 12 et 13 qui suivent. Un recrutement est r\u00e9put\u00e9 avoir lieu qu\u2019il soit soumis ou non \u00e0 l\u2019accomplissement d\u2019une p\u00e9riode d\u2019essai.",
        hdrX, doc.y, { width: hdrW, align: "justify", lineGap: 1.5 });
    doc.moveDown(0.4);

    // ─────────────────────────────────────────────────────────────────────
    // ARTICLES 9 – 13
    // ─────────────────────────────────────────────────────────────────────
    articlePara(9, "Le Client s\u2019engage \u00e0 fournir \u00e0 LE CABRH tout bon de commande ou num\u00e9ro de commande, si n\u00e9cessaire, dans les 14 jours suivant l\u2019engagement d\u2019un candidat. Si le Client omet de communiquer ce document dans le d\u00e9lai imparti, LE CABRH sera autoris\u00e9 \u00e0 \u00e9mettre une facture sans bon de commande.");
    articlePara(10, "Les factures de LE CABRH sont payables \u00e0 la r\u00e9ception. A d\u00e9faut de paiement dans un d\u00e9lai de 60 jours, les sommes dues produiront de plein droit et sans mise en demeure pr\u00e9alable un int\u00e9r\u00eat de 10\u00a0% sur base annuelle ou un int\u00e9r\u00eat de trois fois le taux d\u2019int\u00e9r\u00eat l\u00e9gal, le montant le plus \u00e9lev\u00e9 s\u2019appliquant.");
    articlePara(11, "Si le Client recrute un candidat dans les 12 mois suivant une pr\u00e9sentation, sans avertir LE CABRH, les honoraires stipul\u00e9s \u00e0 l\u2019article 13 ci-apr\u00e8s seront dus \u00e0 LE CABRH.");
    articlePara(12, "Un recrutement a lieu qu\u2019un candidat soit engag\u00e9 de mani\u00e8re temporaire ou permanente. Si apr\u00e8s qu\u2019un candidat a accept\u00e9 une offre d\u2019emploi du Client, le Client r\u00e9tracte son offre avant la date de commencement du candidat, le Client devra payer \u00e0 LE CABRH des frais de gestion s\u2019\u00e9levant \u00e0 5\u00a0000\u00a0\u20ac.");

    // Art. 13 avec sous-points
    if (doc.y > PAGE_H - 110) doc.addPage();
    doc.font("Helvetica").fontSize(9).fillColor(BLACK)
      .text("13.", x0, doc.y, { continued: true, width: INDENT, lineGap: 1.5 });
    doc.text("  Toute pr\u00e9sentation d\u2019un candidat propos\u00e9 par LE CABRH est strictement confidentielle. En cas de recrutement d\u2019un candidat par un tiers r\u00e9sultant du non-respect de cette clause par le Client, ce dernier paiera \u00e0 LE CABRH la plus \u00e9lev\u00e9e des sommes suivantes\u00a0:",
      { width: TW - INDENT, align: "justify", lineGap: 1.5 });
    doc.moveDown(0.2);
    doc.font("Helvetica").fontSize(9).fillColor(BLACK)
      .text("- 30\u00a0% de la r\u00e9mun\u00e9ration anticip\u00e9e pour la premi\u00e8re ann\u00e9e du candidat\u00a0; ou",
        hdrX, doc.y, { width: hdrW, lineGap: 1.5 });
    doc.font("Helvetica").fontSize(9).fillColor(BLACK)
      .text("- une somme fixe de 30\u00a0000\u00a0\u20ac",
        hdrX, doc.y, { width: hdrW, lineGap: 1.5 });
    doc.font("Helvetica").fontSize(9).fillColor(BLACK)
      .text('Un \u00ab\u00a0tiers\u00a0\u00bb inclut notamment, toute soci\u00e9t\u00e9 associ\u00e9e, affili\u00e9e au Client ou avec laquelle le Client entretient des relations.',
        hdrX, doc.y, { width: hdrW, align: "justify", lineGap: 1.5 });
    doc.moveDown(0.4);

    // ─────────────────────────────────────────────────────────────────────
    // ARTICLE 14 – Garantie
    // ─────────────────────────────────────────────────────────────────────
    if (doc.y > PAGE_H - 110) doc.addPage();
    doc.font("Helvetica").fontSize(9).fillColor(BLACK)
      .text("14.", x0, doc.y, { continued: true, width: INDENT, lineGap: 1.5 });
    doc.text("  LE CABRH s\u2019engage \u00e0 fournir une garantie de remplacement. En cas de d\u00e9part pr\u00e9matur\u00e9 du candidat recrut\u00e9 dans ",
      { continued: true, width: TW - INDENT, align: "justify", lineGap: 1.5 });
    doc.font("Helvetica-Bold")
      .text(`${data.garantieDuree || "six"} mois`, { continued: true });
    doc.font("Helvetica")
      .text(" suivant son commencement, que ce soit \u00e0 l\u2019initiative de l\u2019employeur ou du candidat, LE CABRH proc\u00e9dera alors \u00e0 une seconde recherche sans honoraires.",
        { align: "justify", lineGap: 1.5 });
    doc.moveDown(0.3);
    doc.font("Helvetica").fontSize(9).fillColor(BLACK)
      .text("La garantie ne s\u2019applique pas dans les situations ci-apr\u00e8s\u00a0:",
        hdrX, doc.y, { width: hdrW, align: "justify", lineGap: 1.5 });
    doc.moveDown(0.2);
    for (const item of ["Licenciement pour motif \u00e9conomique,", "Affectation \u00e0 un nouveau poste,", "Changement de mission."]) {
      doc.font("Helvetica").fontSize(9).fillColor(BLACK)
        .text(`- ${item}`, hdrX, doc.y, { width: hdrW, lineGap: 1.5 });
    }
    doc.moveDown(0.4);

    // ─────────────────────────────────────────────────────────────────────
    // ARTICLES 15 – 19
    // ─────────────────────────────────────────────────────────────────────
    articlePara(15, "LE CABRH ne saurait assumer la moindre responsabilit\u00e9 envers le Client dans le cas o\u00f9 ce dernier ne recruterait aucun des candidats pr\u00e9sent\u00e9s par LE CABRH.");
    articlePara(16, "La nullit\u00e9 d\u2019un des articles de la Convention ne saurait entra\u00eener la nullit\u00e9 de la Convention dans son ensemble.");
    articlePara(17, "La Convention est r\u00e9gie par le droit fran\u00e7ais et tout litige relatif \u00e0 son existence, sa validit\u00e9, son interpr\u00e9tation ou sa r\u00e9siliation sera soumis au tribunal de commerce du Havre. Si quelque contestation devait na\u00eetre quant \u00e0 l\u2019interpr\u00e9tation de la Convention, concernant la langue utilis\u00e9e, c\u2019est la version fran\u00e7aise de la Convention qui pr\u00e9vaudra.");
    articlePara(18, "La Convention est form\u00e9e au si\u00e8ge social de LE CABRH au 6 place Fr\u00e9d\u00e9ric Sauvage - 76310 Sainte-Adresse.");
    articlePara(19, "La Convention est valable pour une dur\u00e9e de 1 an. Elle sera reconduite tacitement chaque ann\u00e9e pour une dur\u00e9e d\u2019un an, sauf d\u00e9nonciation par l\u2019une des Parties un mois pr\u00e9c\u00e9dant la date d\u2019anniversaire de la convention par courrier RAR ou remis en main propre contre d\u00e9charge.");

    // ─────────────────────────────────────────────────────────────────────
    // BLOC DE SIGNATURE
    // ─────────────────────────────────────────────────────────────────────
    if (doc.y > PAGE_H - 160) doc.addPage();
    doc.moveDown(0.6);

    doc.font("Helvetica").fontSize(9).fillColor(BLACK)
      .text(`Fait en deux exemplaires \u00e0 Nantes, le ${data.dateEdition || "_______________"}`,
        x0, doc.y, { width: TW, align: "justify", lineGap: 1.5 });
    doc.moveDown(1);

    // Deux colonnes signature (template : 2 signataires côte à côte)
    const colW  = (TW - 20) / 2;
    const col2X = x0 + colW + 20;
    const sigY  = doc.y;

    doc.font("Helvetica-Bold").fontSize(9).fillColor(NAVY)
      .text("Le Client,", x0, sigY, { width: colW })
      .text("LE CABRH,", col2X, sigY, { width: colW });

    doc.font("Helvetica").fontSize(8.5).fillColor(GRAY)
      .text(`Nom et fonction du signataire\u00a0: ${clientRep || ""}`, x0, sigY + 14, { width: colW })
      .text(`Nom et fonction du signataire\u00a0: ${consultantFull || ""}`, col2X, sigY + 14, { width: colW });

    // Lignes de signature
    doc.moveDown(4);
    const lineY = doc.y;
    doc.moveTo(x0, lineY).lineTo(x0 + colW, lineY).lineWidth(0.5).strokeColor("#AAAAAA").stroke();
    doc.moveTo(col2X, lineY).lineTo(col2X + colW, lineY).lineWidth(0.5).strokeColor("#AAAAAA").stroke();

    doc.font("Helvetica").fontSize(7.5).fillColor(GRAY)
      .text("Signature :", x0, lineY + 4, { width: colW })
      .text("Signature :", col2X, lineY + 4, { width: colW });

    doc.moveDown(2);
    doc.font("Helvetica-Oblique").fontSize(8).fillColor(GRAY)
      .text(
        "Faire pr\u00e9c\u00e9der la signature de la mention \u00ab\u00a0Bon pour accord\u00a0\u00bb et apposer le cachet de la soci\u00e9t\u00e9",
        x0, doc.y, { width: TW, align: "center" }
      );

    // ─────────────────────────────────────────────────────────────────────
    // PIED DE PAGE – appliqué sur toutes les pages
    // ─────────────────────────────────────────────────────────────────────
    doc.flushPages();
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      const footerY = PAGE_H - 52;

      // Ligne de séparation bleue
      doc.moveTo(x0, footerY - 6).lineTo(x0 + TW, footerY - 6)
        .lineWidth(0.75).strokeColor(SKY).stroke();

      doc.font("Helvetica").fontSize(7).fillColor(GRAY)
        .text("SARL ACE RH au capital de 10 000 euros", x0, footerY, { width: TW, align: "center" })
        .text("LE CABRH - 15, All\u00e9e Duguay Trouin \u2013 44000 NANTES", x0, footerY + 10, { width: TW, align: "center" })
        .text("Siret 88922462200031\u00a0: Code APE\u00a0: 7022Z", x0, footerY + 20, { width: TW, align: "center" });

      // Numéro de page à droite
      doc.font("Helvetica").fontSize(7).fillColor(GRAY)
        .text(`- ${i + 1} -`, x0, footerY + 30, { width: TW, align: "right" });
    }

    doc.end();
  });
}
