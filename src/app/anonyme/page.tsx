"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import CabrhLogo from "@/components/CabrhLogo";
import { addToHistory } from "@/lib/history";

type Step = "upload" | "loading" | "done" | "error";

const LOADING_MSGS = [
  "Lecture du CV en cours…",
  "Identification des données personnelles…",
  "Suppression du nom et prénom…",
  "Suppression de l'adresse et des contacts…",
  "Suppression du profil LinkedIn…",
  "Génération du PDF anonymisé…",
];

export default function AnonymePage() {
  const [step, setStep] = useState<Step>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [loadingMsg, setLoadingMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [cvData, setCvData] = useState<Record<string, unknown> | null>(null);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    const isValid =
      file.type === "application/pdf" ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.toLowerCase().endsWith(".pdf") ||
      file.name.toLowerCase().endsWith(".docx");

    if (!isValid) {
      setErrorMsg("Format non supporté. Veuillez utiliser un fichier PDF ou DOCX.");
      setStep("error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Le fichier dépasse la limite de 10 Mo.");
      setStep("error");
      return;
    }

    setFileName(file.name);
    setStep("loading");
    setErrorMsg("");
    if (pdfUrl) { URL.revokeObjectURL(pdfUrl); setPdfUrl(null); }

    let i = 0;
    setLoadingMsg(LOADING_MSGS[0]);
    const t = setInterval(() => { i = (i + 1) % LOADING_MSGS.length; setLoadingMsg(LOADING_MSGS[i]); }, 2000);

    try {
      const formData = new FormData();
      formData.append("cv", file);
      formData.append("returnJson", "true");

      const res = await fetch("/api/anonymize-cv", { method: "POST", body: formData });
      clearInterval(t);

      if (!res.ok) {
        const err = await res.json();
        setErrorMsg(err.error || "Erreur lors de l'anonymisation.");
        setStep("error");
        return;
      }

      const data = await res.json();
      if (!data.success || !data.pdfBase64) {
        setErrorMsg("Erreur lors de la génération du PDF.");
        setStep("error");
        return;
      }

      // Convert base64 PDF to blob URL
      const pdfBytes = Uint8Array.from(atob(data.pdfBase64), (c) => c.charCodeAt(0));
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      setPdfUrl(URL.createObjectURL(blob));

      // Save to history
      addToHistory({
        type: "cv",
        title: data.cv?.titreProfessionnel || "CV Anonyme",
        subtitle: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }),
        data: data.cv,
      });

      setCvData(data.cv);
      setStep("done");
    } catch {
      clearInterval(t);
      setErrorMsg("Impossible de contacter le serveur.");
      setStep("error");
    }
  }, [pdfUrl]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDownload = useCallback(() => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `CV_Anonyme_CabRH.pdf`;
    a.click();
  }, [pdfUrl]);

  const handleDownloadDocx = useCallback(async () => {
    if (!cvData) return;
    setIsDownloadingDocx(true);
    try {
      const res = await fetch("/api/anonymize-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv: cvData, format: "docx" }),
      });
      if (!res.ok) { alert("Erreur lors de la génération Word."); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "CV_Anonyme_CabRH.docx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Impossible de générer le fichier Word.");
    } finally {
      setIsDownloadingDocx(false);
    }
  }, [cvData]);

  const reset = () => {
    setStep("upload");
    setFileName("");
    setErrorMsg("");
    setCvData(null);
    if (pdfUrl) { URL.revokeObjectURL(pdfUrl); setPdfUrl(null); }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F0F7FC" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 shadow-md"
        style={{ background: "white", borderBottom: "3px solid #009ADE" }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <CabrhLogo size="md" />
          <nav className="flex items-center gap-2">
            <Link href="/"
              className="text-xs font-medium px-4 py-2 rounded-full border transition-colors"
              style={{ color: "#004D71", borderColor: "#009ADE40", background: "white" }}>
              CR d&apos;Entretien
            </Link>
            <Link href="/annonce"
              className="text-xs font-medium px-4 py-2 rounded-full border transition-colors"
              style={{ color: "#004D71", borderColor: "#009ADE40", background: "white" }}>
              Générateur d&apos;Annonce
            </Link>
            <span className="text-xs font-semibold px-4 py-2 rounded-full"
              style={{ background: "#004D71", color: "white" }}>
              CV Anonyme
            </span>
            <Link href="/convention"
              className="text-xs font-medium px-4 py-2 rounded-full border transition-colors"
              style={{ color: "#004D71", borderColor: "#009ADE40", background: "white" }}>
              Convention
            </Link>
            <Link href="/historique"
              className="text-xs font-medium px-4 py-2 rounded-full border transition-colors"
              style={{ color: "#004D71", borderColor: "#009ADE40", background: "white" }}>
              Historique
            </Link>
            <Link
              href="/facture"
              className="text-xs font-medium px-4 py-2 rounded-full border transition-colors"
              style={{ color: "#004D71", borderColor: "#009ADE40", background: "white" }}>
              Facture
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10">

        {/* UPLOAD */}
        {step === "upload" && (
          <div className="section-enter">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                style={{ background: "linear-gradient(135deg, #004D71, #009ADE)" }}>
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: "#004D71" }}>
                CV Anonyme
              </h1>
              <p className="text-gray-500 text-base max-w-lg mx-auto">
                Déposez un CV — l'IA supprime automatiquement toutes les données personnelles
                et génère un PDF professionnel aux couleurs le CabRH.
              </p>
            </div>

            {/* Dropzone */}
            <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className="relative w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 py-16 px-8 cursor-pointer transition-all duration-300"
                style={{
                  borderColor: isDragging ? "#009ADE" : "#009ADE60",
                  background: isDragging ? "#E6F5FB" : "white",
                  transform: isDragging ? "scale(1.01)" : "scale(1)",
                }}
              >
                <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-md transition-all"
                  style={{ background: isDragging ? "linear-gradient(135deg, #009ADE, #004D71)" : "linear-gradient(135deg, #E6F5FB, #009ADE20)" }}>
                  <svg className="w-10 h-10" style={{ color: isDragging ? "white" : "#009ADE" }}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold" style={{ color: "#004D71" }}>
                    {isDragging ? "Déposez le CV ici" : "Glissez-déposez le CV ici"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    ou <span className="font-medium underline" style={{ color: "#009ADE" }}>parcourez vos fichiers</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {["PDF", "DOCX"].map((f) => (
                    <span key={f} className="text-xs font-medium px-3 py-1 rounded-full"
                      style={{ background: "#E6F5FB", color: "#004D71", border: "1px solid #009ADE40" }}>
                      {f}
                    </span>
                  ))}
                  <span className="text-xs text-gray-400">• Max 10 Mo</span>
                </div>
                <input ref={inputRef} type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
              </div>

              {/* Ce qui est supprimé */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { icon: "👤", label: "Nom & Prénom", desc: "Supprimés intégralement" },
                  { icon: "📍", label: "Adresse", desc: "Rue, ville, code postal" },
                  { icon: "🔗", label: "LinkedIn & contacts", desc: "Email, tél., URLs perso" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: "#F8FBFD", border: "1px solid #E6F5FB" }}>
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <p className="text-xs font-bold" style={{ color: "#004D71" }}>{item.label}</p>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                    <svg className="w-4 h-4 ml-auto flex-shrink-0 mt-0.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LOADING */}
        {step === "loading" && (
          <div className="section-enter max-w-md mx-auto text-center py-20">
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full opacity-20 animate-spin"
                style={{ background: "conic-gradient(#009ADE, #004D71, #009ADE)" }} />
              <div className="absolute inset-2 rounded-full flex items-center justify-center"
                style={{ background: "white", boxShadow: "0 0 0 4px #009ADE20" }}>
                <svg className="w-9 h-9" style={{ color: "#004D71" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "#004D71" }}>Anonymisation en cours</h2>
            <p className="text-sm text-gray-500 mb-4">
              Fichier : <span className="font-medium text-gray-700">{fileName}</span>
            </p>
            <p className="text-sm font-medium transition-all" style={{ color: "#009ADE" }}>{loadingMsg}</p>
          </div>
        )}

        {/* DONE */}
        {step === "done" && (
          <div className="section-enter">
            <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100 text-center">
              {/* Succès */}
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: "linear-gradient(135deg, #004D71, #009ADE)" }}>
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: "#004D71" }}>CV anonymisé ✓</h2>
              <p className="text-sm text-gray-500 mb-8">
                Toutes les données personnelles ont été supprimées.<br />
                Le logo le CabRH a été ajouté au document.
              </p>

              {/* Ce qui a été supprimé */}
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {["Nom & Prénom supprimés", "Adresse supprimée", "LinkedIn supprimé", "Email & Tél. supprimés"].map((t, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
                    style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {t}
                  </span>
                ))}
              </div>

              {/* Boutons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={reset}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors">
                  ← Nouveau CV
                </button>
                <button onClick={handleDownload}
                  className="flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all active:scale-95"
                  style={{ background: "linear-gradient(135deg, #009ADE, #004D71)" }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Télécharger PDF
                </button>
                <button
                  onClick={handleDownloadDocx}
                  disabled={isDownloadingDocx}
                  className="flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #1D4ED8, #1e3a5f)" }}>
                  {isDownloadingDocx ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  Télécharger Word
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ERREUR */}
        {step === "error" && (
          <div className="section-enter max-w-lg mx-auto text-center py-16">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center bg-red-50">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">Une erreur est survenue</h2>
            <p className="text-sm text-gray-600 mb-6">{errorMsg}</p>
            <button onClick={reset}
              className="px-6 py-3 rounded-xl font-semibold text-white shadow-md"
              style={{ background: "linear-gradient(135deg, #009ADE, #004D71)" }}>
              Réessayer
            </button>
          </div>
        )}
      </main>

      <footer className="mt-auto py-6 text-center border-t" style={{ background: "white", borderColor: "#009ADE20" }}>
        <div className="flex items-center justify-center gap-2 mb-1">
          <CabrhLogo size="sm" />
        </div>
        <p className="text-xs text-gray-400">© {new Date().getFullYear()} le CabRH — Outil interne confidentiel</p>
      </footer>
    </div>
  );
}
