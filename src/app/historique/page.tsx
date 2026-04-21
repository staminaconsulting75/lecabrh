"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import CabrhLogo from "@/components/CabrhLogo";
import { getHistory, deleteFromHistory, clearHistory } from "@/lib/history";
import type { HistoryItem, HistoryItemType } from "@/lib/history";

type Tab = "all" | HistoryItemType;

const TYPE_LABELS: Record<HistoryItemType, string> = {
  cr: "CR d'Entretien",
  annonce: "Annonce",
  cv: "CV Anonyme",
  convention: "Convention",
};

const TYPE_COLORS: Record<HistoryItemType, { bg: string; text: string; border: string }> = {
  cr:         { bg: "#E6F5FB", text: "#004D71", border: "#009ADE40" },
  annonce:    { bg: "#FFF7E6", text: "#92400E", border: "#F59E0B40" },
  cv:         { bg: "#F0FDF4", text: "#166534", border: "#22C55E40" },
  convention: { bg: "#F5F0FF", text: "#5B21B6", border: "#8B5CF640" },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
    + " à " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function HistoriquePage() {
  const [tab, setTab] = useState<Tab>("all");
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadingDocx, setDownloadingDocx] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const reload = useCallback(() => {
    setItems(tab === "all" ? getHistory() : getHistory(tab));
  }, [tab]);

  useEffect(() => { reload(); }, [reload]);

  const handleDelete = (id: string) => {
    deleteFromHistory(id);
    reload();
  };

  const handleClear = () => {
    if (!confirmClear) { setConfirmClear(true); setTimeout(() => setConfirmClear(false), 3000); return; }
    clearHistory(tab === "all" ? undefined : tab);
    setConfirmClear(false);
    reload();
  };

  const handleDownload = async (item: HistoryItem) => {
    setDownloading(item.id);
    try {
      if (item.type === "cr") {
        const res = await fetch("/api/generate-cr-docx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ compteRendu: item.data }),
        });
        if (!res.ok) { alert("Erreur lors du téléchargement."); return; }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url;
        a.download = `CR_${item.title.replace(/[^a-zA-Z0-9À-ÿ]/g, "_")}.docx`;
        a.click(); URL.revokeObjectURL(url);
      } else if (item.type === "annonce") {
        const res = await fetch("/api/generate-annonce", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: item.data.input, format: "docx" }),
        });
        if (!res.ok) { alert("Erreur lors du téléchargement."); return; }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url;
        a.download = `Annonce_${item.title.replace(/[^a-zA-Z0-9À-ÿ]/g, "_")}.docx`;
        a.click(); URL.revokeObjectURL(url);
      } else if (item.type === "cv") {
        const res = await fetch("/api/anonymize-cv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cv: item.data }),
        });
        if (!res.ok) { alert("Erreur lors du téléchargement."); return; }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url;
        a.download = `CV_Anonyme_${item.title.replace(/[^a-zA-Z0-9À-ÿ]/g, "_")}.pdf`;
        a.click(); URL.revokeObjectURL(url);
      } else if (item.type === "convention") {
        const res = await fetch("/api/generate-convention", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: item.data, format: "docx" }),
        });
        if (!res.ok) { alert("Erreur lors du téléchargement."); return; }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url;
        a.download = `Convention_${item.title.replace(/[^a-zA-Z0-9À-ÿ]/g, "_")}.docx`;
        a.click(); URL.revokeObjectURL(url);
      }
    } catch { alert("Erreur lors du téléchargement."); }
    finally { setDownloading(null); }
  };

  const handleDownloadCvDocx = async (item: HistoryItem) => {
    setDownloadingDocx(item.id);
    try {
      const res = await fetch("/api/anonymize-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv: item.data, format: "docx" }),
      });
      if (!res.ok) { alert("Erreur lors du téléchargement Word."); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `CV_Anonyme_${item.title.replace(/[^a-zA-Z0-9À-ÿ]/g, "_")}.docx`;
      a.click(); URL.revokeObjectURL(url);
    } catch { alert("Erreur lors du téléchargement."); }
    finally { setDownloadingDocx(null); }
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all",        label: "Tous",           count: getHistory().length },
    { key: "cr",         label: "CR d'Entretien", count: getHistory("cr").length },
    { key: "annonce",    label: "Annonces",       count: getHistory("annonce").length },
    { key: "cv",         label: "CV Anonymes",    count: getHistory("cv").length },
    { key: "convention", label: "Conventions",    count: getHistory("convention").length },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F0F7FC" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 shadow-md" style={{ background: "white", borderBottom: "3px solid #009ADE" }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <CabrhLogo size="md" />
          <nav className="flex items-center gap-2 flex-wrap">
            <Link href="/" className="text-xs font-medium px-4 py-2 rounded-full border transition-colors" style={{ color: "#004D71", borderColor: "#009ADE40", background: "white" }}>
              CR d&apos;Entretien
            </Link>
            <Link href="/annonce" className="text-xs font-medium px-4 py-2 rounded-full border transition-colors" style={{ color: "#004D71", borderColor: "#009ADE40", background: "white" }}>
              Générateur d&apos;Annonce
            </Link>
            <Link href="/anonyme" className="text-xs font-medium px-4 py-2 rounded-full border transition-colors" style={{ color: "#004D71", borderColor: "#009ADE40", background: "white" }}>
              CV Anonyme
            </Link>
            <Link href="/convention" className="text-xs font-medium px-4 py-2 rounded-full border transition-colors" style={{ color: "#004D71", borderColor: "#009ADE40", background: "white" }}>
              Convention
            </Link>
            <span className="text-xs font-semibold px-4 py-2 rounded-full" style={{ background: "#004D71", color: "white" }}>
              Historique
            </span>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
        {/* Title */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ color: "#004D71" }}>Historique</h1>
            <p className="text-gray-500 text-sm">Retrouvez tous vos documents générés et retéléchargez-les</p>
          </div>
          {items.length > 0 && (
            <button onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-colors"
              style={confirmClear
                ? { background: "#FEF2F2", color: "#DC2626", borderColor: "#FCA5A5" }
                : { background: "white", color: "#6B7280", borderColor: "#E5E7EB" }}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {confirmClear ? "Confirmer la suppression" : `Vider${tab !== "all" ? " cette section" : ""}`}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all"
              style={tab === t.key
                ? { background: "linear-gradient(135deg, #004D71, #009ADE)", color: "white", boxShadow: "0 2px 8px #009ADE40" }
                : { background: "white", color: "#6B7280", border: "1px solid #E5E7EB" }}>
              {t.label}
              {t.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                  style={tab === t.key ? { background: "rgba(255,255,255,0.25)", color: "white" } : { background: "#F3F4F6", color: "#6B7280" }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: "#E6F5FB" }}>
              <svg className="w-8 h-8" style={{ color: "#009ADE" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium mb-1">Aucun document dans l&apos;historique</p>
            <p className="text-gray-400 text-sm">Les documents générés apparaîtront ici automatiquement</p>
            <div className="flex gap-3 justify-center mt-6 flex-wrap">
              <Link href="/" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md" style={{ background: "linear-gradient(135deg, #009ADE, #004D71)" }}>
                Créer un CR
              </Link>
              <Link href="/annonce" className="px-5 py-2.5 rounded-xl text-sm font-semibold border" style={{ color: "#004D71", borderColor: "#009ADE60", background: "#E6F5FB" }}>
                Générer une annonce
              </Link>
            </div>
          </div>
        )}

        {/* Items list */}
        {items.length > 0 && (
          <div className="space-y-3">
            {items.map((item) => {
              const colors = TYPE_COLORS[item.type];
              const isDown = downloading === item.id;
              return (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
                    {item.type === "cr" && (
                      <svg className="w-5 h-5" style={{ color: colors.text }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                    {item.type === "annonce" && (
                      <svg className="w-5 h-5" style={{ color: colors.text }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                    )}
                    {item.type === "cv" && (
                      <svg className="w-5 h-5" style={{ color: colors.text }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    {item.type === "convention" && (
                      <svg className="w-5 h-5" style={{ color: colors.text }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
                        {TYPE_LABELS[item.type]}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(item.date)}</span>
                    </div>
                    <p className="font-semibold text-gray-800 truncate">{item.title}</p>
                    {item.subtitle && <p className="text-xs text-gray-400 truncate mt-0.5">{item.subtitle}</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Bouton principal : PDF pour CV, Word pour le reste */}
                    <button onClick={() => handleDownload(item)} disabled={isDown}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:shadow-md disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg, #009ADE, #004D71)", color: "white" }}
                      title={item.type === "cv" ? "Télécharger PDF" : "Télécharger Word"}>
                      {isDown ? (
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                      <span className="hidden sm:inline">{item.type === "cv" ? "PDF" : "Word"}</span>
                    </button>

                    {/* Bouton Word supplémentaire pour les CV */}
                    {item.type === "cv" && (
                      <button onClick={() => handleDownloadCvDocx(item)} disabled={downloadingDocx === item.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:shadow-md disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #1D4ED8, #1e3a5f)", color: "white" }}
                        title="Télécharger Word">
                        {downloadingDocx === item.id ? (
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                        <span className="hidden sm:inline">Word</span>
                      </button>
                    )}

                    <button onClick={() => handleDelete(item.id)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Supprimer de l'historique">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="mt-auto py-6 text-center border-t" style={{ background: "white", borderColor: "#009ADE20" }}>
        <div className="flex items-center justify-center gap-2 mb-1"><CabrhLogo size="sm" /></div>
        <p className="text-xs text-gray-400">© {new Date().getFullYear()} le CabRH — Outil interne confidentiel</p>
      </footer>
    </div>
  );
}
