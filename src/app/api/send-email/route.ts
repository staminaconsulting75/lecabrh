import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { generateDocxBuffer } from "@/lib/generateDocx";
import { generateAnnonceDocxBuffer } from "@/lib/generateAnnonceDocx";
import type { CompteRendu } from "@/lib/extractInfo";
import type { AnnonceGeneree } from "@/lib/generateAnnonce";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, type, compteRendu, annonce } = body as {
      to: string;
      type: "cr" | "annonce";
      compteRendu?: CompteRendu;
      annonce?: AnnonceGeneree;
    };

    // Validation email
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
    }

    // Génération du DOCX selon le type
    let docxBuffer: Buffer;
    let fileName: string;
    let subject: string;
    let bodyText: string;

    if (type === "cr" && compteRendu) {
      docxBuffer = await generateDocxBuffer(compteRendu);
      const nom = `${compteRendu.candidat.prenom} ${compteRendu.candidat.nom}`.trim() || "Candidat";
      fileName = `CR_Entretien_${nom.replace(/\s+/g, "_")}.docx`;
      subject = `Compte rendu d'entretien — ${nom}`;
      bodyText = `Bonjour,\n\nVeuillez trouver en pièce jointe le compte rendu d'entretien de ${nom}.\n\nCordialement,\nle CabRH`;
    } else if (type === "annonce" && annonce) {
      docxBuffer = await generateAnnonceDocxBuffer(annonce);
      const titre = annonce.input.intitule || "Annonce";
      fileName = `Annonce_${titre.replace(/[^a-zA-Z0-9À-ÿ]/g, "_").slice(0, 40)}.docx`;
      subject = `Offre d'emploi — ${titre}`;
      bodyText = `Bonjour,\n\nVeuillez trouver en pièce jointe l'annonce de recrutement pour le poste de ${titre}.\n\nCordialement,\nle CabRH`;
    } else {
      return NextResponse.json({ error: "Données manquantes." }, { status: 400 });
    }

    // Configuration SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"le CabRH" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: bodyText,
      html: `
        <div style="font-family: Calibri, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #004D71, #009ADE); padding: 24px 32px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 20px;">le CabRH</h2>
            <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 13px;">Cabinet de Recrutement</p>
          </div>
          <div style="background: #f8f9fa; padding: 32px; border: 1px solid #e0e0e0; border-top: none;">
            <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">Bonjour,</p>
            <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
              Veuillez trouver en pièce jointe le document <strong style="color: #004D71;">${fileName}</strong>.
            </p>
            <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0;">
              Cordialement,<br/>
              <strong style="color: #004D71;">L'équipe le CabRH</strong>
            </p>
          </div>
          <div style="background: #004D71; padding: 16px 32px; border-radius: 0 0 8px 8px; text-align: center;">
            <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0;">© ${new Date().getFullYear()} le CabRH — Outil interne confidentiel</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: fileName,
          content: docxBuffer,
          contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API /send-email] Erreur :", err);
    const message = err instanceof Error ? err.message : "Erreur d'envoi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
