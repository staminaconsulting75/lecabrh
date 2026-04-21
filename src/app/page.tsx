"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import CabrhLogo from "@/components/CabrhLogo";
import DropZone from "@/components/DropZone";
import ReportView from "@/components/ReportView";
import EmailModal from "@/components/EmailModal";
import type { CompteRendu } from "@/lib/extractInfo";
import { addToHistory } from "@/lib/history";

type Step = "upload" | "loading" | "result" | "error";
type JobMode = "none" | "url" | "file";

export default function HomePage() {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState<string>("");
  const [compteRendu, setCompteRendu] = useState<CompteRendu | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  // Fiche de poste optionnelle
  const [jobMode, setJobMode] = useState<JobMode>("none");
  const [jobUrl, setJobUrl] = useState("");
  const [jobFile, setJobFile] = useState<File | null>(null);

  const loadingMessages = [
    "Lecture du CV en cours…",
    "Analyse de la fiche de poste…",
    "Extraction des informations avec l'IA…",
    "Rédaction du compte rendu ciblé…",
    "Mise en forme du document…",
  ];

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setStep("loading");
    setErrorMessage("");

    let msgIdx = 0;
    setLoadingMessage(loadingMessages[0]);
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[msgIdx]);
    }, 2500);

    try {
      const formData = new FormData();
      formData.append("cv", file);
      if (jobMode === "url" && jobUrl.trim()) formData.append("jobUrl", jobUrl.trim());
      if (jobMode === "file" && jobFile) formData.append("jobFile", jobFile);

      const res = await fetch("/api/parse", {
        method: "POST",
        body: formData,
      });

      clearInterval(interval);

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(
          data.error || "Une erreur est survenue lors de l'analyse du CV."
        );
        setStep("error");
        return;
      }

      setCompteRendu(data.compteRendu);
      addToHistory({
        type: "cr",
        title: `${data.compteRendu.candidat.prenom} ${data.compteRendu.candidat.nom}`.trim() || "Candidat",
        subtitle: data.compteRendu.candidat.poste || "",
        data: data.compteRendu,
      });
      setStep("result");
    } catch {
      clearInterval(interval);
      setErrorMessage(
        "Impossible de contacter le serveur. Vérifiez votre connexion."
      );
      setStep("error");
    }
  }, []);

  const handleDownloadDocx = useCallback(async () => {
    if (!compteRendu) return;
    setIsDownloading(true);

    try {
      const res = await fetch("/api/generate-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compteRendu }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erreur lors de la génération du fichier Word.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const nomCandidat =
        `${compteRendu.candidat.prenom}_${compteRendu.candidat.nom}`.replace(
          /[^a-zA-Z0-9_\-]/g,
          "_"
        ) || "Candidat";
      a.download = `CR_Entretien_${nomCandidat}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Erreur lors du téléchargement.");
    } finally {
      setIsDownloading(false);
    }
  }, [compteRendu]);

  const handleReset = useCallback(() => {
    setStep("upload");
    setCompteRendu(null);
    setFileName("");
    setErrorMessage("");
    setJobUrl("");
    setJobFile(null);
    setJobMode("none");
  }, []);

  const handleSendEmail = useCallback(async (email: string) => {
    if (!compteRendu) return;
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: email, type: "cr", compteRendu }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Erreur lors de l'envoi.");
  }, [compteRendu]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F0F7FC" }}>
      {/* ── Barre de navigation ── */}
      <header
        className="sticky top-0 z-50 shadow-md"
        style={{ background: "white", borderBottom: "3px solid #009ADE" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <CabrhLogo size="md"  />
          <nav className="flex items-center gap-2">
            <span
              className="text-xs font-semibold px-4 py-2 rounded-full"
              style={{ background: "#004D71", color: "white" }}
            >
              CR d&apos;Entretien
            </span>
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
            <Link
              href="/convention"
              className="text-xs font-medium px-4 py-2 rounded-full border transition-colors"
              style={{ color: "#004D71", borderColor: "#009ADE40", background: "white" }}
            >
              Convention
            </Link>
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

      {/* ── Contenu principal ── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10">

        {/* ── ÉTAPE UPLOAD ── */}
        {step === "upload" && (
          <div className="section-enter max-w-2xl mx-auto">
            {/* Titre */}
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: "#004D71" }}>
                Analysez un CV en quelques secondes
              </h1>
              <p className="text-gray-500 text-base">
                Déposez le CV d'un candidat et obtenez automatiquement un compte rendu
                d'entretien structuré, prêt à exporter en Word.
              </p>
            </div>

            {/* Zone de dépôt */}
            <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
              <DropZone onFile={handleFile} />

              {/* ── Fiche de poste optionnelle ── */}
              <div className="mt-6 border border-dashed border-gray-200 rounded-2xl overflow-hidden">
                {/* Déclencheur */}
                <button
                  type="button"
                  onClick={() => setJobMode(jobMode === "none" ? "url" : "none")}
                  className="w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: jobMode !== "none" ? "#E6F5FB" : "#F5F7FA" }}>
                      <svg className="w-4 h-4" style={{ color: jobMode !== "none" ? "#009ADE" : "#9CA3AF" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#004D71" }}>
                        Fiche de poste <span className="text-gray-400 font-normal">(optionnel)</span>
                      </p>
                      <p className="text-xs text-gray-400">
                        Ciblez le CR selon l'offre d'emploi visée
                      </p>
                    </div>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${jobMode !== "none" ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Contenu dépliable */}
                {jobMode !== "none" && (
                  <div className="px-5 pb-5 border-t border-gray-100">
                    {/* Toggle URL / Fichier */}
                    <div className="flex gap-2 mt-4 mb-4">
                      <button
                        type="button"
                        onClick={() => setJobMode("url")}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all"
                        style={jobMode === "url"
                          ? { background: "#004D71", color: "white", borderColor: "#004D71" }
                          : { background: "white", color: "#6B7280", borderColor: "#E5E7EB" }}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Lien URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setJobMode("file")}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all"
                        style={jobMode === "file"
                          ? { background: "#004D71", color: "white", borderColor: "#004D71" }
                          : { background: "white", color: "#6B7280", borderColor: "#E5E7EB" }}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        Pièce jointe
                      </button>
                    </div>

                    {/* Champ URL */}
                    {jobMode === "url" && (
                      <div>
                        <input
                          type="url"
                          placeholder="https://www.linkedin.com/jobs/view/... ou lien Indeed, HelloWork…"
                          value={jobUrl}
                          onChange={(e) => setJobUrl(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 focus:outline-none transition-colors"
                          onFocus={(e) => (e.target.style.borderColor = "#009ADE")}
                          onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                        />
                        <p className="text-xs text-gray-400 mt-1.5">
                          Collez le lien de l'offre d'emploi — LinkedIn, Indeed, HelloWork, site entreprise…
                        </p>
                      </div>
                    )}

                    {/* Champ fichier */}
                    {jobMode === "file" && (
                      <div>
                        <label
                          className="flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-gray-200 py-4 px-4 cursor-pointer hover:border-sky-400 hover:bg-sky-50 transition-colors"
                          style={jobFile ? { borderColor: "#009ADE", background: "#E6F5FB" } : {}}
                        >
                          <input
                            type="file"
                            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            className="hidden"
                            onChange={(e) => setJobFile(e.target.files?.[0] ?? null)}
                          />
                          {jobFile ? (
                            <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "#004D71" }}>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {jobFile.name}
                            </div>
                          ) : (
                            <div className="text-center">
                              <p className="text-sm text-gray-500">
                                <span className="font-medium" style={{ color: "#009ADE" }}>Cliquez</span> pour joindre la fiche de poste
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">PDF ou DOCX</p>
                            </div>
                          )}
                        </label>
                        {jobFile && (
                          <button
                            type="button"
                            onClick={() => setJobFile(null)}
                            className="text-xs text-gray-400 hover:text-red-400 mt-1.5 transition-colors"
                          >
                            ✕ Supprimer
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Étapes */}
              <div className="mt-8 grid grid-cols-3 gap-4">
                {[
                  { icon: "📄", label: "Déposez le CV", sub: "PDF ou DOCX" },
                  { icon: "🤖", label: "Analyse par l'IA", sub: "Claude Sonnet" },
                  { icon: "📝", label: "CR en Word", sub: "Export instantané" },
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl mb-1">{item.icon}</div>
                    <p className="text-xs font-semibold text-gray-600">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ÉTAPE CHARGEMENT ── */}
        {step === "loading" && (
          <div className="section-enter max-w-md mx-auto text-center py-20">
            {/* Logo animé */}
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div
                className="absolute inset-0 rounded-full opacity-20 spinner"
                style={{
                  background: `conic-gradient(#009ADE, #004D71, #009ADE)`,
                }}
              />
              <div
                className="absolute inset-2 rounded-full flex items-center justify-center"
                style={{ background: "white", boxShadow: "0 0 0 4px #009ADE20" }}
              >
                <svg
                  className="w-8 h-8 spinner"
                  style={{ color: "#009ADE" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
            </div>

            <h2 className="text-xl font-bold mb-2" style={{ color: "#004D71" }}>
              Analyse en cours
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Fichier : <span className="font-medium text-gray-700">{fileName}</span>
            </p>

            {/* Barre de progression */}
            <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
              <div
                className="h-full rounded-full spinner"
                style={{
                  background: "linear-gradient(90deg, #009ADE, #004D71, #009ADE)",
                  backgroundSize: "200% 100%",
                  width: "60%",
                  animation: "pulse 2s ease-in-out infinite",
                }}
              />
            </div>

            <p
              className="text-sm font-medium transition-all duration-700"
              style={{ color: "#009ADE" }}
            >
              {loadingMessage}
            </p>
          </div>
        )}

        {/* ── ÉTAPE RÉSULTAT ── */}
        {step === "result" && compteRendu && (
          <div className="section-enter">
            {/* Barre d'actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold" style={{ color: "#004D71" }}>
                  Compte rendu généré ✓
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Fichier source : <span className="font-medium">{fileName}</span>
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Nouveau CV */}
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Nouveau CV
                </button>

                {/* Envoyer par email */}
                <button
                  onClick={() => setEmailModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:shadow-md"
                  style={{ color: "#004D71", borderColor: "#009ADE60", background: "#E6F5FB" }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Envoyer par email
                </button>

                {/* Export DOCX */}
                <button
                  onClick={handleDownloadDocx}
                  disabled={isDownloading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-95 disabled:opacity-60"
                  style={{ background: isDownloading ? "#009ADE99" : "linear-gradient(135deg, #009ADE, #004D71)" }}
                >
                  {isDownloading ? (
                    <>
                      <svg className="w-4 h-4 spinner" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Génération…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Télécharger en Word
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Compte rendu */}
            <ReportView compteRendu={compteRendu} onUpdate={(updated) => setCompteRendu(updated)} />
          </div>
        )}

        {/* ── ÉTAPE ERREUR ── */}
        {step === "error" && (
          <div className="section-enter max-w-lg mx-auto text-center py-16">
            <div
              className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ background: "#FEE2E2" }}
            >
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-3">
              Une erreur est survenue
            </h2>
            <p className="text-sm text-gray-600 mb-6 px-4">{errorMessage}</p>

            <button
              onClick={handleReset}
              className="px-6 py-3 rounded-xl font-semibold text-white shadow-md hover:shadow-lg transition-all"
              style={{ background: "linear-gradient(135deg, #009ADE, #004D71)" }}
            >
              Réessayer
            </button>
          </div>
        )}
      </main>

      {/* ── Modal email ── */}
      <EmailModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        onSend={handleSendEmail}
        fileName={compteRendu ? `CR_Entretien_${compteRendu.candidat.prenom}_${compteRendu.candidat.nom}.docx` : "document.docx"}
      />

      {/* ── Pied de page ── */}
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
