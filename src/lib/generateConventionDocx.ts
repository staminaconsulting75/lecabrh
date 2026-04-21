/* eslint-disable @typescript-eslint/no-require-imports */
import fs from "fs";
import path from "path";

const PizZip = require("pizzip");

export interface ConventionData {
  date: string;
  titrePoste: string;
  logoBase64?: string;
  logoMimeType?: string;
  nomClient: string;
  adresseClient: string;
  consultantPrenomNom: string;
  consultantFonction: string;
  prenomNomSignataire: string;
  fonctionSignataire: string;
  honorairesType: "pourcentage" | "forfait";
  honorairesValeur: string;
  garantieDuree: string;
  dateEdition: string;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

interface RunStyle {
  bold?: boolean;
  italic?: boolean;
  size?: number;
}

function makeRun(text: string, style: RunStyle = {}): string {
  if (!text) return "";
  const { bold = false, italic = false, size = 18 } = style;
  const b = bold ? "<w:b/><w:bCs/>" : "";
  const i = italic ? "<w:i/><w:iCs/>" : "";
  const sp =
    text.startsWith(" ") || text.endsWith(" ")
      ? ' xml:space="preserve"'
      : "";
  // Texte en noir (000000) — les placeholders rouges deviennent noirs dans le doc final
  return `<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>${b}${i}<w:color w:val="000000"/><w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr><w:t${sp}>${escapeXml(text)}</w:t></w:r>`;
}

function makeImageRun(rId: string): string {
  const cx = 2200000;
  const cy = 550000;
  return (
    `<w:r><w:rPr/></w:r>` +
    `<w:r><w:rPr/><w:drawing>` +
    `<wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" distT="0" distB="0" distL="0" distR="0">` +
    `<wp:extent cx="${cx}" cy="${cy}"/>` +
    `<wp:effectExtent l="0" t="0" r="0" b="0"/>` +
    `<wp:docPr id="1001" name="ClientLogo" descr="Logo client"/>` +
    `<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
    `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:nvPicPr><pic:cNvPr id="0" name="ClientLogo"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="${rId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
    `</pic:pic></a:graphicData></a:graphic>` +
    `</wp:inline></w:drawing></w:r>`
  );
}

function getRunText(runXml: string): string {
  const matches = runXml.match(/<w:t(?:[^>]*)>([\s\S]*?)<\/w:t>/g) || [];
  return matches
    .map((m) => {
      const inner = m.match(/<w:t(?:[^>]*)>([\s\S]*?)<\/w:t>/);
      return inner ? inner[1] : "";
    })
    .join("");
}

function isRedRun(runXml: string): boolean {
  return (
    runXml.includes('w:val="EE0000"') || runXml.includes('w:val="FF0000"')
  );
}

function processRedRuns(
  paraContent: string,
  lookup: (t: string) => string | null
): string {
  const runRegex = /(<w:r\b(?:[^>]*)?>[\s\S]*?<\/w:r>)/g;
  const runs: Array<{ xml: string; text: string; isRed: boolean }> = [];
  let m;
  while ((m = runRegex.exec(paraContent)) !== null) {
    runs.push({
      xml: m[1],
      text: getRunText(m[1]),
      isRed: isRedRun(m[1]),
    });
  }
  if (!runs.some((r) => r.isRed)) return paraContent;

  let newContent = paraContent;
  let i = 0;
  const replacements: Array<{ original: string; replacement: string }> = [];

  while (i < runs.length) {
    if (runs[i].isRed) {
      const group = [runs[i]];
      let j = i + 1;
      while (j < runs.length && runs[j].isRed) {
        group.push(runs[j]);
        j++;
      }
      const merged = group
        .map((r) => r.text)
        .join("")
        .trim();
      const rep = lookup(merged);
      if (rep !== null) {
        replacements.push({
          original: group.map((r) => r.xml).join(""),
          replacement: rep,
        });
      }
      i = j;
    } else {
      i++;
    }
  }

  for (const rep of replacements) {
    newContent = newContent.split(rep.original).join(rep.replacement);
  }
  return newContent;
}

export async function generateConventionDocxBuffer(
  data: ConventionData
): Promise<Buffer> {
  const templatePath = path.join(
    process.cwd(),
    "public",
    "templates",
    "convention-cabrh-template.docx"
  );
  const templateBuffer = fs.readFileSync(templatePath);
  const zip = new PizZip(templateBuffer);

  // ── Handle logo first (to get rId before building lookup) ────────
  let logoRun = makeRun("\u00A0", { size: 18 }); // empty placeholder by default
  if (data.logoBase64 && data.logoMimeType) {
    try {
      const logoBuffer = Buffer.from(data.logoBase64, "base64");
      const ext = data.logoMimeType.includes("png") ? "png" : "jpg";
      zip.file(`word/media/client_logo.${ext}`, logoBuffer);

      let relsXml = zip.file("word/_rels/document.xml.rels")!.asText();
      const rId = "rId999";
      relsXml = relsXml.replace(
        "</Relationships>",
        `<Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/client_logo.${ext}"/></Relationships>`
      );
      zip.file("word/_rels/document.xml.rels", relsXml);

      let ctXml = zip.file("[Content_Types].xml")!.asText();
      const ct = data.logoMimeType.includes("png") ? "image/png" : "image/jpeg";
      if (!ctXml.includes(`Extension="${ext}"`)) {
        ctXml = ctXml.replace(
          "</Types>",
          `<Default Extension="${ext}" ContentType="${ct}"/></Types>`
        );
        zip.file("[Content_Types].xml", ctXml);
      }
      logoRun = makeImageRun(rId);
    } catch (e) {
      console.error("Logo error:", e);
    }
  }

  // ── Build honoraires strings ──────────────────────────────────────
  const h1 =
    data.honorairesType === "pourcentage"
      ? `${data.honorairesValeur} du salaire brut annuel du candidat recruté`
      : "\u00A0";
  const h2 =
    data.honorairesType === "forfait"
      ? `Forfait fixe ${data.honorairesValeur}`
      : "\u00A0";
  const clientRep =
    [data.prenomNomSignataire, data.fonctionSignataire]
      .filter(Boolean)
      .join(", ") + ".";
  const consultantFull =
    [data.consultantPrenomNom, data.consultantFonction]
      .filter(Boolean)
      .join(", ");

  // ── Build lookup function ─────────────────────────────────────────
  const lookup = (t: string): string | null => {
    // Header date
    if (t === "Date") return makeRun(data.date, { bold: true, size: 40 });

    // Job title — "Titre du poste HF", "Titre du poste", " HF", "HF"
    if (t === "Titre du poste HF" || t === "Titre du poste") {
      const title = data.titrePoste
        ? `${data.titrePoste} (H/F)`
        : "(H/F)";
      return makeRun(title, { bold: true, size: 48 });
    }
    if (t === " HF" || t === "HF") {
      return data.titrePoste
        ? ""
        : makeRun(" (H/F)", { bold: true, size: 48 });
    }

    // Logo
    if (t === "Logo du client") return logoRun;

    // CabRH consultant (Prénom + nom + fonction du consultant)
    if (
      t.includes("fonction du consultant") ||
      t.includes("Prénom +") ||
      t === "Prénom + nom + fonction du consultant"
    ) {
      return makeRun(consultantFull || "—", { bold: true, size: 18 });
    }

    // Client address
    if (t.includes("adresse") && t.includes("code postal")) {
      return makeRun(`– ${data.adresseClient}`, { bold: true, size: 18 });
    }

    // Client representative
    if (t.includes("Prénom Nom") && t.includes("Fonction")) {
      return makeRun(clientRep, { bold: true, size: 18 });
    }

    // Honoraires line 1 (percentage)
    if (t.includes("salaire brut annuel")) {
      return makeRun(h1, { bold: true, italic: true, size: 18 });
    }

    // "Ou" separator — disparaît si pourcentage choisi
    if (t === "Ou") {
      return data.honorairesType === "pourcentage"
        ? ""
        : makeRun("Ou", { bold: true, italic: true, size: 18 });
    }

    // Honoraires line 2 (forfait) — disparaît si pourcentage choisi
    if (t.includes("Forfait fixe") && t.includes("négocié")) {
      return data.honorairesType === "pourcentage"
        ? ""
        : makeRun(h2, { bold: true, italic: true, size: 18 });
    }

    // Guarantee duration (Art. 14)
    if (t === "les six") {
      return makeRun(data.garantieDuree, { bold: true, size: 18 });
    }

    // Signature date — matches "16 Avril 2026" or any "D+ Month YYYY" pattern
    if (/^\d{1,2}\s+\w+\s+\d{4}$/.test(t)) {
      return makeRun(data.dateEdition, { bold: true, size: 18 });
    }

    return null;
  };

  // ── Process XML ───────────────────────────────────────────────────
  let xml = zip.file("word/document.xml")!.asText();
  // Normalize whitespace between XML elements so runs are contiguous
  xml = xml.replace(/>\s+</g, "><");
  // Supprimer les marqueurs de vérification orthographique/grammaticale
  // Ils s'intercalent entre les runs et empêchent la correspondance des groupes
  xml = xml.replace(/<w:proofErr[^/]*\/>/g, "");

  // ── Remplacement "NOM DU CLIENT" (texte non-rouge, remplacement direct) ──
  // Dans le document, "NOM DU CLIENT" apparaît en majuscules dans le texte normal
  if (data.nomClient) {
    xml = xml.replace(/>NOM DU CLIENT</g, `>${escapeXml(data.nomClient)}<`);
  }

  // Process each paragraph's red runs
  xml = xml.replace(
    /(<w:p\b[^>]*>)([\s\S]*?)(<\/w:p>)/g,
    (_: string, pOpen: string, pContent: string, pClose: string) =>
      pOpen + processRedRuns(pContent, lookup) + pClose
  );

  zip.file("word/document.xml", xml);

  // ── Mise à jour du pied de page ───────────────────────────────────
  const footerRun = (text: string) =>
    `<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t>${escapeXml(text)}</w:t></w:r>`;

  const footerPara = (text: string, align: "center" | "right" = "center") =>
    `<w:p><w:pPr><w:pStyle w:val="Pieddepage"/><w:jc w:val="${align}"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="16"/></w:rPr></w:pPr>${footerRun(text)}</w:p>`;

  // Paragraphe numéro de page (conservé tel quel)
  const pageNumPara =
    `<w:p><w:pPr><w:pStyle w:val="Pieddepage"/><w:jc w:val="right"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="16"/></w:rPr></w:pPr>` +
    `<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r>` +
    `<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="16"/></w:rPr><w:instrText xml:space="preserve"> PAGE  \\* ArabicDash  \\* MERGEFORMAT </w:instrText></w:r>` +
    `<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r>` +
    `<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:noProof/><w:sz w:val="16"/></w:rPr><w:t>- 1 -</w:t></w:r>` +
    `<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r></w:p>`;

  // Lire le XML du footer, remplacer le contenu entre les balises <w:ftr>
  let footerXml = zip.file("word/footer1.xml")!.asText();
  const newFooterContent =
    footerPara("SARL ACE RH au capital de 10 000 euros") +
    footerPara("LE CABRH - 15, All\u00e9e Duguay Trouin \u2013 44000 NANTES") +
    footerPara("Siret 88922462200031 : Code APE : 7022Z") +
    pageNumPara;

  footerXml = footerXml.replace(
    /(<w:ftr\b[^>]*>)([\s\S]*)(<\/w:ftr>)/,
    `$1${newFooterContent}$3`
  );
  zip.file("word/footer1.xml", footerXml);

  return zip.generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  }) as Buffer;
}
