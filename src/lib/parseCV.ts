/**
 * Utilitaires pour extraire le texte brut d'un CV (PDF ou DOCX)
 */

/**
 * Extrait le texte d'un fichier PDF (Buffer)
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // Import dynamique pour éviter le problème d'import au build-time de pdf-parse
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text;
}

/**
 * Extrait le texte d'un fichier DOCX (Buffer)
 */
export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/**
 * Détecte le type de fichier et extrait le texte
 */
export async function extractTextFromCV(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  const isPDF =
    mimeType === "application/pdf" ||
    fileName.toLowerCase().endsWith(".pdf");
  const isDOCX =
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.toLowerCase().endsWith(".docx");

  if (isPDF) {
    return extractTextFromPDF(buffer);
  }

  if (isDOCX) {
    return extractTextFromDOCX(buffer);
  }

  throw new Error(
    `Format non supporté : ${mimeType}. Veuillez utiliser un fichier PDF ou DOCX.`
  );
}
