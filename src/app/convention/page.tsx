"use client";

import { useState, useRef, useCallback } from "react";
import CabrhLogo from "@/components/CabrhLogo";
import Link from "next/link";
import type { ConventionData } from "@/lib/generateConventionDocx";
import { addToHistory } from "@/lib/history";

function Field({
  label,
  placeholder,
  value,
  onChange,
  multiline = false,
  hint,
  required = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold" style={{ color: "#004D71" }}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-400 -mt-1">{hint}</p>}
      {multiline ? (
        <textarea
          rows={3}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 focus:outline-none resize-none transition-colors"
          onFocus={(e) => (e.target.style.borderColor = "#009ADE")}
          onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
        />
      ) : (
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 focus:outline-none transition-colors"
          onFocus={(e) => (e.target.style.borderColor = "#009ADE")}
          onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
        />
      )}
    </div>
  );
}

function SectionCard({
  num,
  title,
  icon,
  children,
}: {
  num: string;
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div
        className="flex items-center gap-3 px-6 py-4"
        style={{ background: "linear-gradient(135deg, #004D71, #009ADE)" }}
      >
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.2)" }}
        >
          {num}
        </span>
        <span className="text-white text-base">{icon}</span>
        <h3 className="text-white font-semibold text-sm">{title}</h3>
      </div>
      <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

function ConventionPreviewModal({
  data,
  onClose,
  onDownloadWord,
  onDownloadPdf,
  isDownloadingWord,
  isDownloadingPdf,
}: {
  data: ConventionData;
  onClose: () => void;
  onDownloadWord: () => void;
  onDownloadPdf: () => void;
  isDownloadingWord: boolean;
  isDownloadingPdf: boolean;
}) {
  const honorairesLine =
    data.honorairesType === "pourcentage"
      ? `${data.honorairesValeur} du salaire brut annuel du candidat recruté`
      : `Forfait fixe ${data.honorairesValeur}`;

  const clientRep = [data.prenomNomSignataire, data.fonctionSignataire].filter(Boolean).join(", ");
  const consultantFull = [data.consultantPrenomNom, data.consultantFonction].filter(Boolean).join(", ");

  const articles = [
    { n: 1, text: "Sur demande du Client, LE CABRH présentera un ou plusieurs candidat(s) au Client en vue de leur recrutement." },
    { n: 2, text: "LE CABRH assiste le Client dans les processus de sélection et de recrutement du candidat. LE CABRH met tout en œuvre pour évaluer le candidat mais ne se porte en aucun cas garant des aptitudes techniques ou autres du candidat." },
    { n: 3, text: "La Convention constitue le seul contrat entre LE CABRH et le Client." },
    { n: 4, text: "La Convention ne peut être modifiée que par accord écrit entre LE CABRH et le Client." },
    { n: 5, text: "Une présentation de candidat sera réputée avoir eu lieu dès que LE CABRH aura fourni au Client une information identifiant un candidat par son nom ou des renseignements suffisants afin d'identifier ce candidat. La présente Convention prend effet dès qu'une présentation a lieu." },
    { n: 6, text: "Les candidats présentés par LE CABRH ne peuvent être considérés comme provenant du Client, sauf si celui-ci justifie d'un contact direct avec eux dans les trente (30) jours précédant leur présentation." },
    { n: 7, text: "Les honoraires de LE CABRH correspondent à un montant fixe ou un pourcentage de la rémunération annuelle totale anticipée pour la première année d'un candidat, comprenant notamment, toute bonification ou commission et autres avantages accordés au candidat s'il est salarié. Si le candidat a le statut d'indépendant, tous les revenus, bénéfices, profits et biens qui lui sont attribués seront pris en considération, de même que tous les avantages complémentaires éventuels. Le Client fournira à LE CABRH un état complet de l'ensemble des rémunérations à percevoir par le candidat ainsi qu'une copie de l'offre d'embauche et/ou le contrat de travail concernant le candidat. Si un candidat est engagé à temps partiel ou pour une durée déterminée de moins de douze mois, l'équivalent de la rémunération annuelle du candidat travaillant à temps plein sera pris en compte afin de calculer les honoraires de recrutement de LE CABRH." },
    { n: 9, text: "Le Client s'engage à fournir à LE CABRH tout bon de commande ou numéro de commande, si nécessaire, dans les 14 jours suivant l'engagement d'un candidat. Si le Client omet de communiquer ce document dans le délai imparti, LE CABRH sera autorisé à émettre une facture sans bon de commande." },
    { n: 10, text: "Les factures de LE CABRH sont payables à la réception. A défaut de paiement dans un délai de 60 jours, les sommes dues produiront de plein droit et sans mise en demeure préalable un intérêt de 10% sur base annuelle ou un intérêt de trois fois le taux d'intérêt légal, le montant le plus élevé s'appliquant." },
    { n: 11, text: "Si le Client recrute un candidat dans les 12 mois suivant une présentation, sans avertir LE CABRH, les honoraires stipulés à l'article 13 ci-après seront dus à LE CABRH." },
    { n: 12, text: "Un recrutement a lieu qu'un candidat soit engagé de manière temporaire ou permanente. Si après qu'un candidat a accepté une offre d'emploi du Client, le Client rétracte son offre avant la date de commencement du candidat, le Client devra payer à LE CABRH des frais de gestion s'élevant à 5 000 €." },
    { n: 13, text: "Toute présentation d'un candidat proposé par LE CABRH est strictement confidentielle. En cas de recrutement d'un candidat par un tiers résultant du non-respect de cette clause par le Client, ce dernier paiera à LE CABRH la plus élevée des sommes suivantes : 30 % de la rémunération anticipée pour la première année du candidat ; ou une somme fixe de 30 000 €. Un « tiers » inclut notamment, toute société associée, affiliée au Client ou avec laquelle le Client entretient des relations." },
    { n: 15, text: "LE CABRH ne saurait assumer la moindre responsabilité envers le Client dans le cas où ce dernier ne recruterait aucun des candidats présentés par LE CABRH." },
    { n: 16, text: "La nullité d'un des articles de la Convention ne saurait entraîner la nullité de la Convention dans son ensemble." },
    { n: 17, text: "La Convention est régie par le droit français et tout litige relatif à son existence, sa validité, son interprétation ou sa résiliation sera soumis au tribunal de commerce du Havre. Si quelque contestation devait naître quant à l'interprétation de la Convention, concernant la langue utilisée, c'est la version française de la Convention qui prévaudra." },
    { n: 18, text: "La Convention est formée au siège social de LE CABRH au 6 place Frédéric Sauvage - 76310 Sainte-Adresse." },
    { n: 19, text: "La Convention est valable pour une durée de 1 an. Elle sera reconduite tacitement chaque année pour une durée d'un an, sauf dénonciation par l'une des Parties un mois précédant la date d'anniversaire de la convention par courrier RAR ou remis en main propre contre décharge." },
  ];

  // Style articles numérotés identique au template (liste "X." avec retrait)
  const ArticleRow = ({ num, children }: { num: number; children: React.ReactNode }) => (
    <div style={{ display: "flex", gap: "6px", marginBottom: "6px", textAlign: "justify" }}>
      <span style={{ minWidth: "18px", fontWeight: "normal" }}>{num}.</span>
      <span style={{ flex: 1 }}>{children}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.6)" }}>
      {/* Barre d'outils */}
      <div className="flex items-center justify-between px-6 py-3 flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #004D71, #009ADE)" }}>
        <h2 className="text-white font-bold text-sm">Aperçu — Convention de Recrutement</h2>
        <div className="flex items-center gap-2">
          <button onClick={onDownloadPdf} disabled={isDownloadingPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/40 text-white hover:bg-white/10 transition-colors disabled:opacity-50">
            {isDownloadingPdf
              ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            Télécharger PDF
          </button>
          <button onClick={onDownloadWord} disabled={isDownloadingWord}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/15 text-white hover:bg-white/25 transition-colors disabled:opacity-50">
            {isDownloadingWord
              ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            Télécharger Word
          </button>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Zone de défilement du document */}
      <div className="flex-1 overflow-y-auto py-8 px-4" style={{ background: "#D0D0D0" }}>
        {/* Feuille A4 */}
        <div className="mx-auto bg-white shadow-2xl" style={{
          width: "794px", minHeight: "1123px",
          fontFamily: "Arial, sans-serif", fontSize: "9pt", lineHeight: "1.5",
          color: "#1A1A1A", position: "relative"
        }}>
          <div style={{ padding: "71px 71px 90px 71px" }}>

            {/* ── EN-TÊTE : logo CabRH gauche + date droite ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/templates/cabrh-logo.jpg" alt="le CabRH" style={{ height: "56px", objectFit: "contain" }} />
              {data.date && (
                <span style={{ fontSize: "20pt", fontWeight: "bold", color: "#1A1A1A", textAlign: "right" }}>
                  {data.date}
                </span>
              )}
            </div>

            {/* ── TITRE PRINCIPAL (centré, 24pt, bold, navy) ── */}
            <div style={{ textAlign: "center", marginBottom: "18px", marginTop: "16px" }}>
              <h1 style={{ fontSize: "24pt", fontWeight: "bold", color: "#004D71", margin: 0, lineHeight: 1.2 }}>
                CONVENTION DE RECRUTEMENT
                {data.titrePoste && <> : {data.titrePoste} (H/F)</>}
              </h1>
            </div>

            {/* ── LOGO CLIENT (centré, si fourni) ── */}
            {data.logoBase64 && (
              <div style={{ textAlign: "center", marginBottom: "14px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`data:${data.logoMimeType};base64,${data.logoBase64}`} alt="Logo client"
                  style={{ maxHeight: "45px", maxWidth: "150px", objectFit: "contain" }} />
              </div>
            )}

            {/* ── CONDITIONS CONTRACTUELLES (centré, bold) ── */}
            <div style={{ textAlign: "center", fontWeight: "bold", marginBottom: "14px" }}>
              CONDITIONS CONTRACTUELLES DE PRESENTATION DE CANDIDATS
            </div>

            {/* ── INTRO ── */}
            <p style={{ textAlign: "justify", marginBottom: "8px" }}>
              La présente convention (dénommée ci-après &quot;la Convention&quot;) est conclue
            </p>

            {/* ── ENTRE : LE CABRH ── */}
            <p style={{ textAlign: "justify", marginBottom: "4px" }}>
              <strong>ENTRE :</strong> LE CABRH (dénommée ci-après &quot;LE CABRH&quot;), dont le siège social est situé – 15 Allée Duguay Trouin – 44000 NANTES.
            </p>
            <p style={{ textAlign: "justify", fontWeight: "bold", marginBottom: "8px" }}>
              Représentée par : {consultantFull || <span style={{ color: "#9CA3AF", fontWeight: "normal", fontStyle: "italic" }}>Non renseigné</span>}
            </p>

            {/* ── ET : CLIENT ── */}
            <p style={{ textAlign: "justify", marginBottom: "4px" }}>
              <strong>ET :</strong> {data.nomClient || "NOM DU CLIENT"} (dénommée ci-après &quot;le Client&quot;), dont le siège social est situé {data.adresseClient ? `– ${data.adresseClient}.` : "–."}
            </p>
            <p style={{ textAlign: "justify", fontWeight: "bold", marginBottom: "16px" }}>
              Représentée par {clientRep || <span style={{ color: "#9CA3AF", fontWeight: "normal", fontStyle: "italic" }}>Non renseigné</span>}.
            </p>

            {/* ── ARTICLES 1 – 7 ── */}
            <div style={{ marginBottom: "6px" }}>
              <ArticleRow num={1}>Sur demande du Client, LE CABRH présentera un ou plusieurs candidat(s) au Client en vue de leur recrutement.</ArticleRow>
              <ArticleRow num={2}>LE CABRH assiste le Client dans les processus de sélection et de recrutement du candidat. LE CABRH met tout en œuvre pour évaluer le candidat mais ne se porte en aucun cas garant des aptitudes techniques ou autres du candidat.</ArticleRow>
              <ArticleRow num={3}>La Convention constitue le seul contrat entre LE CABRH et le Client.</ArticleRow>
              <ArticleRow num={4}>La Convention ne peut être modifiée que par accord écrit entre LE CABRH et le Client.</ArticleRow>
              <ArticleRow num={5}>Une présentation de candidat sera réputée avoir eu lieu dès que LE CABRH aura fourni au Client une information identifiant un candidat par son nom ou des renseignements suffisants afin d&apos;identifier ce candidat. La présente Convention prend effet dès qu&apos;une présentation a lieu.</ArticleRow>
              <ArticleRow num={6}>Les candidats présentés par LE CABRH ne peuvent être considérés comme provenant du Client, sauf si celui-ci justifie d&apos;un contact direct avec eux dans les trente (30) jours précédant leur présentation.</ArticleRow>
              <ArticleRow num={7}>Les honoraires de LE CABRH correspondent à un montant fixe ou un pourcentage de la rémunération annuelle totale anticipée pour la première année d&apos;un candidat, comprenant notamment, toute bonification ou commission et autres avantages accordés au candidat s&apos;il est salarié. Si le candidat a le statut d&apos;indépendant, tous les revenus, bénéfices, profits et biens qui lui sont attribués seront pris en considération, de même que tous les avantages complémentaires éventuels. Le Client fournira à LE CABRH un état complet de l&apos;ensemble des rémunérations à percevoir par le candidat ainsi qu&apos;une copie de l&apos;offre d&apos;embauche et/ou le contrat de travail concernant le candidat. Si un candidat est engagé à temps partiel ou pour une durée déterminée de moins de douze mois, l&apos;équivalent de la rémunération annuelle du candidat travaillant à temps plein sera pris en compte afin de calculer les honoraires de recrutement de LE CABRH.</ArticleRow>
            </div>

            {/* ── ARTICLE 8 – Honoraires ── */}
            <div style={{ marginBottom: "6px" }}>
              <ArticleRow num={8}>
                <span>Les pourcentages mentionnés à l&apos;article 7 sont les suivants :</span>
              </ArticleRow>
              {/* Ligne d'en-tête du tableau */}
              <div style={{ marginLeft: "24px", color: "#555", fontSize: "8.5pt", marginBottom: "4px" }}>
                Montant de la rémunération de référence en euros (€) : Montant fixe ou pourcentage appliqué Hors Taxes :
              </div>
              {/* Valeur honoraires */}
              <div style={{ marginLeft: "24px", fontWeight: "bold", fontStyle: "italic", marginBottom: "4px" }}>
                {honorairesLine || <span style={{ color: "#9CA3AF" }}>Non renseigné</span>}
              </div>
              {/* "Ou" + forfait (uniquement si forfait sélectionné) */}
              {data.honorairesType === "forfait" && (
                <>
                  <div style={{ marginLeft: "24px", fontWeight: "bold", fontStyle: "italic", marginBottom: "2px" }}>Ou</div>
                  <div style={{ marginLeft: "24px", fontWeight: "bold", fontStyle: "italic", marginBottom: "4px" }}>
                    Forfait fixe {data.honorairesValeur}
                  </div>
                </>
              )}
              <div style={{ marginLeft: "24px", textAlign: "justify", marginBottom: "4px" }}>
                Les honoraires de LE CABRH sont dus dès le recrutement d&apos;un candidat, y compris tout recrutement tel que visé aux articles 11, 12 et 13 qui suivent. Un recrutement est réputé avoir lieu qu&apos;il soit soumis ou non à l&apos;accomplissement d&apos;une période d&apos;essai.
              </div>
            </div>

            {/* ── ARTICLES 9 – 12 ── */}
            <div style={{ marginBottom: "6px" }}>
              <ArticleRow num={9}>Le Client s&apos;engage à fournir à LE CABRH tout bon de commande ou numéro de commande, si nécessaire, dans les 14 jours suivant l&apos;engagement d&apos;un candidat. Si le Client omet de communiquer ce document dans le délai imparti, LE CABRH sera autorisé à émettre une facture sans bon de commande.</ArticleRow>
              <ArticleRow num={10}>Les factures de LE CABRH sont payables à la réception. A défaut de paiement dans un délai de 60 jours, les sommes dues produiront de plein droit et sans mise en demeure préalable un intérêt de 10 % sur base annuelle ou un intérêt de trois fois le taux d&apos;intérêt légal, le montant le plus élevé s&apos;appliquant.</ArticleRow>
              <ArticleRow num={11}>Si le Client recrute un candidat dans les 12 mois suivant une présentation, sans avertir LE CABRH, les honoraires stipulés à l&apos;article 13 ci-après seront dus à LE CABRH.</ArticleRow>
              <ArticleRow num={12}>Un recrutement a lieu qu&apos;un candidat soit engagé de manière temporaire ou permanente. Si après qu&apos;un candidat a accepté une offre d&apos;emploi du Client, le Client rétracte son offre avant la date de commencement du candidat, le Client devra payer à LE CABRH des frais de gestion s&apos;élevant à 5 000 €.</ArticleRow>
            </div>

            {/* ── ARTICLE 13 avec sous-points ── */}
            <div style={{ marginBottom: "6px" }}>
              <ArticleRow num={13}>
                <span>Toute présentation d&apos;un candidat proposé par LE CABRH est strictement confidentielle. En cas de recrutement d&apos;un candidat par un tiers résultant du non-respect de cette clause par le Client, ce dernier paiera à LE CABRH la plus élevée des sommes suivantes :</span>
              </ArticleRow>
              <div style={{ marginLeft: "24px" }}>
                <div>- 30 % de la rémunération anticipée pour la première année du candidat ; ou</div>
                <div style={{ marginBottom: "4px" }}>- une somme fixe de 30 000 €</div>
                <div style={{ textAlign: "justify" }}>Un &quot;tiers&quot; inclut notamment, toute société associée, affiliée au Client ou avec laquelle le Client entretient des relations.</div>
              </div>
            </div>

            {/* ── ARTICLE 14 – Garantie ── */}
            <div style={{ marginBottom: "6px" }}>
              <ArticleRow num={14}>
                <span>
                  LE CABRH s&apos;engage à fournir une garantie de remplacement. En cas de départ prématuré du candidat recruté dans{" "}
                  <strong>{data.garantieDuree || "six"} mois</strong>{" "}
                  suivant son commencement, que ce soit à l&apos;initiative de l&apos;employeur ou du candidat, LE CABRH procèdera alors à une seconde recherche sans honoraires.
                </span>
              </ArticleRow>
              <div style={{ marginLeft: "24px" }}>
                <div style={{ marginBottom: "2px" }}>La garantie ne s&apos;applique pas dans les situations ci-après :</div>
                <div>- Licenciement pour motif économique,</div>
                <div>- Affectation à un nouveau poste,</div>
                <div style={{ marginBottom: "4px" }}>- Changement de mission.</div>
              </div>
            </div>

            {/* ── ARTICLES 15 – 19 ── */}
            <div style={{ marginBottom: "16px" }}>
              <ArticleRow num={15}>LE CABRH ne saurait assumer la moindre responsabilité envers le Client dans le cas où ce dernier ne recruterait aucun des candidats présentés par LE CABRH.</ArticleRow>
              <ArticleRow num={16}>La nullité d&apos;un des articles de la Convention ne saurait entraîner la nullité de la Convention dans son ensemble.</ArticleRow>
              <ArticleRow num={17}>La Convention est régie par le droit français et tout litige relatif à son existence, sa validité, son interprétation ou sa résiliation sera soumis au tribunal de commerce du Havre. Si quelque contestation devait naître quant à l&apos;interprétation de la Convention, concernant la langue utilisée, c&apos;est la version française de la Convention qui prévaudra.</ArticleRow>
              <ArticleRow num={18}>La Convention est formée au siège social de LE CABRH au 6 place Frédéric Sauvage - 76310 Sainte-Adresse.</ArticleRow>
              <ArticleRow num={19}>La Convention est valable pour une durée de 1 an. Elle sera reconduite tacitement chaque année pour une durée d&apos;un an, sauf dénonciation par l&apos;une des Parties un mois précédant la date d&apos;anniversaire de la convention par courrier RAR ou remis en main propre contre décharge.</ArticleRow>
            </div>

            {/* ── BLOC DE SIGNATURE ── */}
            <p style={{ textAlign: "justify", marginBottom: "16px" }}>
              Fait en deux exemplaires à Nantes, le <strong>{data.dateEdition || "_______________"}</strong>
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginBottom: "8px" }}>
              <div>
                <p style={{ fontWeight: "bold", color: "#004D71", marginBottom: "6px" }}>Le Client,</p>
                <p style={{ color: "#555", marginBottom: "32px", fontSize: "8.5pt" }}>
                  Nom et fonction du signataire : {clientRep || ""}
                </p>
                <div style={{ borderTop: "0.5px solid #AAAAAA", paddingTop: "4px", color: "#888", fontSize: "7.5pt" }}>Signature :</div>
              </div>
              <div>
                <p style={{ fontWeight: "bold", color: "#004D71", marginBottom: "6px" }}>LE CABRH,</p>
                <p style={{ color: "#555", marginBottom: "32px", fontSize: "8.5pt" }}>
                  Nom et fonction du signataire : {consultantFull || ""}
                </p>
                <div style={{ borderTop: "0.5px solid #AAAAAA", paddingTop: "4px", color: "#888", fontSize: "7.5pt" }}>Signature :</div>
              </div>
            </div>
            <p style={{ textAlign: "center", color: "#777", fontStyle: "italic", fontSize: "8pt", marginTop: "12px" }}>
              Faire précéder la signature de la mention « Bon pour accord » et apposer le cachet de la société
            </p>

            {/* ── PIED DE PAGE ── */}
            <div style={{ marginTop: "40px", paddingTop: "6px", borderTop: "1px solid #009ADE", textAlign: "center", fontSize: "7pt", color: "#888" }}>
              <div>SARL ACE RH au capital de 10 000 euros</div>
              <div>LE CABRH - 15, Allée Duguay Trouin – 44000 NANTES</div>
              <div>Siret 88922462200031 : Code APE : 7022Z</div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

const EMPTY: ConventionData = {
  date: "",
  titrePoste: "",
  logoBase64: "",
  logoMimeType: "",
  nomClient: "",
  adresseClient: "",
  consultantPrenomNom: "",
  consultantFonction: "",
  prenomNomSignataire: "",
  fonctionSignataire: "",
  honorairesType: "pourcentage",
  honorairesValeur: "",
  garantieDuree: "six",
  dateEdition: "",
};

export default function ConventionPage() {
  const [data, setData] = useState<ConventionData>(EMPTY);
  const [logoFileName, setLogoFileName] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof ConventionData) => (v: string) =>
    setData((p) => ({ ...p, [key]: v }));

  const handleLogoUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image (PNG, JPG, SVG).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      setData((p) => ({ ...p, logoBase64: base64, logoMimeType: file.type }));
      setLogoPreview(e.target?.result as string);
      setLogoFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = useCallback(async () => {
    if (!data.dateEdition.trim()) {
      alert("Veuillez indiquer la date d'édition (section 6).");
      return;
    }
    setIsGenerating(true);
    setGenerated(false);
    try {
      const res = await fetch("/api/generate-convention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, format: "docx" }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || "Erreur lors de la génération.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Convention_${(data.titrePoste || "Recrutement").replace(/[^a-zA-Z0-9À-ÿ]/g, "_")}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      addToHistory({
        type: "convention",
        title: data.titrePoste || data.nomClient || "Convention de recrutement",
        subtitle: [data.nomClient, data.date].filter(Boolean).join(" — "),
        data,
      });
      setGenerated(true);
      setTimeout(() => setGenerated(false), 4000);
    } catch {
      alert("Impossible de contacter le serveur.");
    } finally {
      setIsGenerating(false);
    }
  }, [data]);

  const handleDownloadPdf = useCallback(async () => {
    setIsDownloadingPdf(true);
    try {
      const res = await fetch("/api/generate-convention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, format: "pdf" }),
      });
      if (!res.ok) { const d = await res.json(); alert(d.error || "Erreur."); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Convention_${(data.titrePoste || data.nomClient || "Recrutement").replace(/[^a-zA-Z0-9À-ÿ]/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert("Impossible de contacter le serveur."); }
    finally { setIsDownloadingPdf(false); }
  }, [data]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F0F7FC" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 shadow-md"
        style={{ background: "white", borderBottom: "3px solid #009ADE" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <CabrhLogo size="md" />
          <nav className="flex items-center gap-2 flex-wrap">
            <Link
              href="/"
              className="text-xs font-medium px-4 py-2 rounded-full border transition-colors"
              style={{ color: "#004D71", borderColor: "#009ADE40", background: "white" }}
            >
              CR d&apos;Entretien
            </Link>
            <Link
              href="/annonce"
              className="text-xs font-medium px-4 py-2 rounded-full border transition-colors"
              style={{ color: "#004D71", borderColor: "#009ADE40", background: "white" }}
            >
              Générateur d&apos;Annonce
            </Link>
            <Link
              href="/anonyme"
              className="text-xs font-medium px-4 py-2 rounded-full border transition-colors"
              style={{ color: "#004D71", borderColor: "#009ADE40", background: "white" }}
            >
              CV Anonyme
            </Link>
            <span
              className="text-xs font-semibold px-4 py-2 rounded-full"
              style={{ background: "#004D71", color: "white" }}
            >
              Convention
            </span>
            <Link
              href="/historique"
              className="text-xs font-medium px-4 py-2 rounded-full border transition-colors"
              style={{ color: "#004D71", borderColor: "#009ADE40", background: "white" }}
            >
              Historique
            </Link>
            <Link
              href="/facture"
              className="text-xs font-medium px-4 py-2 rounded-full border transition-colors"
              style={{ color: "#004D71", borderColor: "#009ADE40", background: "white" }}
            >
              Facture
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="text-center mb-10">
          <h1
            className="text-3xl sm:text-4xl font-bold mb-3"
            style={{ color: "#004D71" }}
          >
            Convention de Recrutement
          </h1>
          <p className="text-gray-500 text-base max-w-xl mx-auto">
            Renseignez les informations spécifiques au client — le document Word
            est généré à l&apos;identique avec vos données.
          </p>
        </div>

        <div className="space-y-5">

          {/* Section 1 : En-tête */}
          <SectionCard num="1" title="En-tête de la convention" icon="📄">
            <Field
              label="Date"
              placeholder="ex : 16 avril 2026"
              value={data.date}
              onChange={set("date")}
            />
            <Field
              label="Intitulé du poste"
              placeholder="ex : Conducteur de Travaux (optionnel)"
              value={data.titrePoste}
              onChange={set("titrePoste")}
              hint="Apparaît dans le titre de la convention"
            />
          </SectionCard>

          {/* Section 2 : Logo client */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div
              className="flex items-center gap-3 px-6 py-4"
              style={{ background: "linear-gradient(135deg, #004D71, #009ADE)" }}
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                2
              </span>
              <span className="text-white text-base">🏢</span>
              <h3 className="text-white font-semibold text-sm">
                Logo du client{" "}
                <span className="text-white/60 font-normal">(optionnel)</span>
              </h3>
            </div>
            <div className="px-6 py-5">
              {logoPreview ? (
                <div className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoPreview}
                    alt="Logo client"
                    className="h-16 object-contain rounded-lg border border-gray-200 p-2 bg-gray-50"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">
                      {logoFileName}
                    </p>
                    <button
                      onClick={() => {
                        setLogoPreview("");
                        setLogoFileName("");
                        setData((p) => ({
                          ...p,
                          logoBase64: "",
                          logoMimeType: "",
                        }));
                        if (logoInputRef.current)
                          logoInputRef.current.value = "";
                      }}
                      className="text-xs text-red-500 hover:underline mt-1"
                    >
                      Retirer le logo
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="cursor-pointer rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-8 transition-all hover:bg-sky-50"
                  style={{ borderColor: "#C8D8E8", background: "#FAFCFF" }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files[0];
                    if (f) handleLogoUpload(f);
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: "#E6F5FB" }}
                  >
                    <svg
                      className="w-5 h-5"
                      style={{ color: "#009ADE" }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "#004D71" }}
                    >
                      Glissez le logo ici ou cliquez
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PNG, JPG, SVG acceptés
                    </p>
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleLogoUpload(f);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 3 : Informations client */}
          <SectionCard num="3" title="Informations client" icon="🏗️">
            <Field
              label="Nom du client"
              placeholder="ex : Entreprise Martin BTP"
              value={data.nomClient}
              onChange={set("nomClient")}
              hint="Raison sociale — apparaîtra dans le document à la place de «NOM DU CLIENT»"
            />
            <div className="sm:col-span-1" />
            <div className="sm:col-span-2">
              <Field
                label="Adresse postale du client"
                placeholder="ex : 12 rue des Bâtisseurs – 75001 Paris"
                value={data.adresseClient}
                onChange={set("adresseClient")}
                multiline
                hint="Siège social du client"
              />
            </div>
            <Field
              label="Prénom + Nom du signataire client"
              placeholder="ex : Jean Dupont"
              value={data.prenomNomSignataire}
              onChange={set("prenomNomSignataire")}
            />
            <Field
              label="Fonction du signataire client"
              placeholder="ex : Directeur Général"
              value={data.fonctionSignataire}
              onChange={set("fonctionSignataire")}
            />
          </SectionCard>

          {/* Section 3b : Consultant le CabRH */}
          <SectionCard num="4" title="Consultant le CabRH" icon="👤">
            <Field
              label="Prénom + Nom du consultant"
              placeholder="ex : Marie Martin"
              value={data.consultantPrenomNom}
              onChange={set("consultantPrenomNom")}
              hint="Représentant le CabRH dans la convention"
            />
            <Field
              label="Fonction du consultant"
              placeholder="ex : Consultante en Recrutement"
              value={data.consultantFonction}
              onChange={set("consultantFonction")}
            />
          </SectionCard>

          {/* Section 5 : Honoraires */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div
              className="flex items-center gap-3 px-6 py-4"
              style={{ background: "linear-gradient(135deg, #004D71, #009ADE)" }}
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                5
              </span>
              <span className="text-white text-base">💶</span>
              <h3 className="text-white font-semibold text-sm">
                Honoraires — Paragraphe 8
              </h3>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setData((p) => ({ ...p, honorairesType: "pourcentage" }))
                  }
                  className="flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all"
                  style={
                    data.honorairesType === "pourcentage"
                      ? {
                          background:
                            "linear-gradient(135deg, #004D71, #009ADE)",
                          color: "white",
                          borderColor: "transparent",
                        }
                      : {
                          background: "white",
                          color: "#6B7280",
                          borderColor: "#E5E7EB",
                        }
                  }
                >
                  Pourcentage (%)
                </button>
                <button
                  onClick={() =>
                    setData((p) => ({ ...p, honorairesType: "forfait" }))
                  }
                  className="flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all"
                  style={
                    data.honorairesType === "forfait"
                      ? {
                          background:
                            "linear-gradient(135deg, #004D71, #009ADE)",
                          color: "white",
                          borderColor: "transparent",
                        }
                      : {
                          background: "white",
                          color: "#6B7280",
                          borderColor: "#E5E7EB",
                        }
                  }
                >
                  Forfait fixe
                </button>
              </div>
              <Field
                label={
                  data.honorairesType === "pourcentage"
                    ? "Pourcentage appliqué"
                    : "Montant du forfait"
                }
                placeholder={
                  data.honorairesType === "pourcentage"
                    ? "ex : 18% ou 15 à 20%"
                    : "ex : 5 000 € HT"
                }
                value={data.honorairesValeur}
                onChange={set("honorairesValeur")}
                hint={
                  data.honorairesType === "pourcentage"
                    ? "Sera affiché : «XX% du salaire brut annuel du candidat recruté»"
                    : "Sera affiché : «Forfait fixe XX»"
                }
              />
              <div
                className="px-4 py-3 rounded-xl text-xs text-gray-500 leading-relaxed"
                style={{
                  background: "#F0F7FC",
                  border: "1px solid #009ADE20",
                }}
              >
                <strong style={{ color: "#004D71" }}>
                  Aperçu paragraphe 8 :
                </strong>
                <br />
                {data.honorairesType === "pourcentage" ? (
                  <em>
                    {data.honorairesValeur || "XX%"} du salaire brut annuel du
                    candidat recruté
                  </em>
                ) : (
                  <em>Forfait fixe {data.honorairesValeur || "XX € HT"}</em>
                )}
              </div>
            </div>
          </div>

          {/* Section 6 : Garantie */}
          <SectionCard
            num="6"
            title="Garantie de remplacement — Paragraphe 14"
            icon="🔄"
          >
            <div className="sm:col-span-2">
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-semibold"
                  style={{ color: "#004D71" }}
                >
                  Durée de la garantie
                </label>
                <p className="text-xs text-gray-400">
                  Dans l&apos;article 14 : «En cas de départ prématuré dans{" "}
                  <strong>[durée]</strong> mois suivant son commencement»
                </p>
                <div className="flex gap-2 flex-wrap mt-1">
                  {["trois", "quatre", "cinq", "six", "neuf", "douze"].map(
                    (d) => (
                      <button
                        key={d}
                        onClick={() =>
                          setData((p) => ({ ...p, garantieDuree: d }))
                        }
                        className="px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all capitalize"
                        style={
                          data.garantieDuree === d
                            ? {
                                background:
                                  "linear-gradient(135deg, #004D71, #009ADE)",
                                color: "white",
                                borderColor: "transparent",
                              }
                            : {
                                background: "white",
                                color: "#6B7280",
                                borderColor: "#E5E7EB",
                              }
                        }
                      >
                        {d}
                      </button>
                    )
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Ou saisissez une durée personnalisée…"
                  value={
                    ["trois", "quatre", "cinq", "six", "neuf", "douze"].includes(
                      data.garantieDuree
                    )
                      ? ""
                      : data.garantieDuree
                  }
                  onChange={(e) =>
                    setData((p) => ({ ...p, garantieDuree: e.target.value }))
                  }
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 focus:outline-none transition-colors"
                  onFocus={(e) => (e.target.style.borderColor = "#009ADE")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                />
                <p className="text-xs mt-1" style={{ color: "#009ADE" }}>
                  Durée sélectionnée :{" "}
                  <strong className="capitalize">
                    {data.garantieDuree || "—"}
                  </strong>{" "}
                  mois
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Section 7 : Date d'édition */}
          <SectionCard
            num="7"
            title="Date d'édition — Paragraphe 19"
            icon="📅"
          >
            <div className="sm:col-span-2">
              <Field
                label="Date d'édition de la convention"
                required
                placeholder="ex : 16 Avril 2026"
                value={data.dateEdition}
                onChange={set("dateEdition")}
                hint="Apparaît dans le bloc de signature en bas de la convention"
              />
            </div>
          </SectionCard>

          {/* Confirmation */}
          {generated && (
            <div
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium"
              style={{
                background: "#E6F5FB",
                color: "#004D71",
                border: "1px solid #009ADE40",
              }}
            >
              <svg
                className="w-4 h-4 flex-shrink-0"
                style={{ color: "#009ADE" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Convention générée et téléchargée avec succès
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 flex-wrap">
            {/* Aperçu */}
            <button
              onClick={() => setShowPreview(true)}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-semibold border-2 transition-all hover:shadow-md"
              style={{ color: "#004D71", borderColor: "#009ADE", background: "white" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Prévisualiser
            </button>
            {/* PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-semibold border-2 transition-all hover:shadow-md disabled:opacity-60"
              style={{ color: "#DC2626", borderColor: "#DC262640", background: "#FEF2F2" }}>
              {isDownloadingPdf
                ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              Télécharger PDF
            </button>
            {/* Word */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-60"
              style={{ background: isGenerating ? "#009ADE99" : "linear-gradient(135deg, #009ADE, #004D71)" }}>
              {isGenerating
                ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>Génération…</>
                : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Télécharger Word</>}
            </button>
          </div>

          <p className="text-center text-xs text-gray-400">
            Le document Word généré est identique à la convention type le CabRH
            — seuls les champs en rouge sont remplacés par vos informations.
          </p>
        </div>

        {/* Preview modal */}
        {showPreview && (
          <ConventionPreviewModal
            data={data}
            onClose={() => setShowPreview(false)}
            onDownloadWord={handleGenerate}
            onDownloadPdf={handleDownloadPdf}
            isDownloadingWord={isGenerating}
            isDownloadingPdf={isDownloadingPdf}
          />
        )}
      </main>

      <footer
        className="mt-auto py-6 text-center border-t"
        style={{ background: "white", borderColor: "#009ADE20" }}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <CabrhLogo size="sm" />
        </div>
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} le CabRH — Outil interne confidentiel
        </p>
      </footer>
    </div>
  );
}
