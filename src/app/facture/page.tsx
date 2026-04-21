"use client";

import { useState } from "react";
import Link from "next/link";
import CabrhLogo from "@/components/CabrhLogo";

interface FactureData {
  nomClient: string;
  adresseClient: string;
  referent: string;
  dateFacturation: string;
  numeroClient: string;
  numeroFacture: string;
  intitule: string;
  designationNom: string;
  designationPrenom: string;
  prixUnitaireHT: number;
  tva: boolean;
}

const defaultFacture: FactureData = {
  nomClient: "",
  adresseClient: "",
  referent: "",
  dateFacturation: new Date().toLocaleDateString("fr-FR"),
  numeroClient: "",
  numeroFacture: "",
  intitule: "",
  designationNom: "",
  designationPrenom: "",
  prixUnitaireHT: 0,
  tva: true,
};

// Composant champ rouge éditable
function RedField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  multiline = false,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="border-b-2 border-red-500 bg-red-50 text-red-700 font-medium px-2 py-1 text-sm focus:outline-none focus:bg-red-100 rounded-t resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="border-b-2 border-red-500 bg-red-50 text-red-700 font-medium px-2 py-1 text-sm focus:outline-none focus:bg-red-100 rounded-t"
        />
      )}
    </div>
  );
}

export default function FacturePage() {
  const [facture, setFacture] = useState<FactureData>(defaultFacture);
  const [isDownloading, setIsDownloading] = useState<"pdf" | "docx" | null>(null);

  const set = (key: keyof FactureData, value: string | number | boolean) => {
    setFacture((prev) => ({ ...prev, [key]: value }));
  };

  const prix = facture.prixUnitaireHT || 0;
  const tvaAmount = facture.tva ? prix * 0.2 : 0;
  const totalTTC = prix + tvaAmount;
  const formatEur = (n: number) =>
    n.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";

  const handleDownload = async (format: "pdf" | "docx") => {
    setIsDownloading(format);
    try {
      const res = await fetch("/api/generate-facture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, facture }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erreur lors de la génération.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Facture_${facture.numeroFacture || "CABRH"}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Erreur lors du téléchargement.");
    } finally {
      setIsDownloading(null);
    }
  };

  const navLinks = [
    { href: "/", label: "CR d'Entretien" },
    { href: "/annonce", label: "Générateur d'Annonce" },
    { href: "/anonyme", label: "CV Anonyme" },
    { href: "/convention", label: "Convention" },
    { href: "/facture", label: "Facture", active: true },
    { href: "/historique", label: "Historique" },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F0F7FC" }}>
      {/* ── Navigation ── */}
      <header className="sticky top-0 z-50 shadow-md" style={{ background: "white", borderBottom: "3px solid #009ADE" }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <CabrhLogo size="md" />
          <nav className="flex items-center gap-2 flex-wrap">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-xs font-medium px-4 py-2 rounded-full border transition-colors"
                style={
                  l.active
                    ? { background: "#004D71", color: "white", borderColor: "#004D71" }
                    : { color: "#004D71", borderColor: "#009ADE40", background: "white" }
                }
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10">
        {/* Titre */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#004D71" }}>
            Générateur de Facture
          </h1>
          <p className="text-gray-500 text-sm">
            Remplissez les champs ci-dessous puis exportez en PDF ou Word
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ── FORMULAIRE ── */}
          <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100 space-y-6">
            <h2 className="text-base font-bold" style={{ color: "#004D71" }}>Informations de facturation</h2>

            {/* Client */}
            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Client</p>
              <RedField label="Nom du client" value={facture.nomClient} onChange={(v) => set("nomClient", v)} placeholder="Nom de l'entreprise cliente" />
              <RedField label="Adresse du client" value={facture.adresseClient} onChange={(v) => set("adresseClient", v)} placeholder="Adresse complète" multiline />
              <RedField label="Référent" value={facture.referent} onChange={(v) => set("referent", v)} placeholder="Nom du référent" />
            </div>

            <hr className="border-gray-100" />

            {/* Facture */}
            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Facture</p>
              <div className="grid grid-cols-2 gap-4">
                <RedField label="N° Facture" value={facture.numeroFacture} onChange={(v) => set("numeroFacture", v)} placeholder="FAC-2024-001" />
                <RedField label="N° Client" value={facture.numeroClient} onChange={(v) => set("numeroClient", v)} placeholder="CLI-001" />
              </div>
              <RedField label="Date de facturation" value={facture.dateFacturation} onChange={(v) => set("dateFacturation", v)} placeholder="JJ/MM/AAAA" />
            </div>

            <hr className="border-gray-100" />

            {/* Mission */}
            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mission</p>
              <RedField label="Intitulé de la mission" value={facture.intitule} onChange={(v) => set("intitule", v)} placeholder="Ex: Recrutement d'un Gestionnaire de Copropriété (F/H)" multiline />
              <div className="grid grid-cols-2 gap-4">
                <RedField label="Prénom du candidat" value={facture.designationPrenom} onChange={(v) => set("designationPrenom", v)} placeholder="Prénom" />
                <RedField label="Nom du candidat" value={facture.designationNom} onChange={(v) => set("designationNom", v)} placeholder="Nom" />
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Prix */}
            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tarification</p>
              <RedField
                label="Prix unitaire HT (€)"
                value={facture.prixUnitaireHT || ""}
                onChange={(v) => set("prixUnitaireHT", parseFloat(v) || 0)}
                placeholder="0.00"
                type="number"
              />

              {/* TVA Toggle */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">TVA à 20%</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => set("tva", true)}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold border transition-all"
                    style={
                      facture.tva
                        ? { background: "#004D71", color: "white", borderColor: "#004D71" }
                        : { background: "white", color: "#6B7280", borderColor: "#E5E7EB" }
                    }
                  >
                    Oui
                  </button>
                  <button
                    onClick={() => set("tva", false)}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold border transition-all"
                    style={
                      !facture.tva
                        ? { background: "#C0392B", color: "white", borderColor: "#C0392B" }
                        : { background: "white", color: "#6B7280", borderColor: "#E5E7EB" }
                    }
                  >
                    Non
                  </button>
                </div>
              </div>
            </div>

            {/* Boutons téléchargement */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleDownload("pdf")}
                disabled={isDownloading !== null}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-95 disabled:opacity-60"
                style={{ background: isDownloading ? "#009ADE99" : "linear-gradient(135deg, #009ADE, #004D71)" }}
              >
                {isDownloading === "pdf" ? "Génération…" : "📄 Télécharger PDF"}
              </button>
              <button
                onClick={() => handleDownload("docx")}
                disabled={isDownloading !== null}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-95 disabled:opacity-60"
                style={{ background: isDownloading ? "#1a6699" : "linear-gradient(135deg, #1a6699, #003d5a)" }}
              >
                {isDownloading === "docx" ? "Génération…" : "📝 Télécharger Word"}
              </button>
            </div>
          </div>

          {/* ── APERÇU ── */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold" style={{ color: "#004D71" }}>Aperçu de la facture</h2>
            </div>

            {/* Prévisualisation A4 */}
            <div className="p-4 bg-gray-50 overflow-auto" style={{ maxHeight: "700px" }}>
              <div
                className="bg-white shadow-md mx-auto text-xs"
                style={{ width: "100%", maxWidth: "500px", padding: "32px", fontFamily: "Helvetica, Arial, sans-serif" }}
              >
                {/* Header */}
                <div className="flex justify-between mb-6">
                  <div>
                    <div className="font-bold text-sm mb-1" style={{ color: "#004D71" }}>LE CABRH</div>
                    <div className="text-gray-600 leading-5">
                      15 All. Duguay Trouin<br />
                      44000 - Nantes<br />
                      nantes@le-cabrh.fr<br />
                      Siret : 889 224 622 00017<br />
                      Code APE : 7022Z<br />
                      TVA : FR54889224622
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xs mb-1" style={{ color: "#004D71" }}>CLIENT</div>
                    <div className={`font-bold text-sm ${!facture.nomClient ? "text-red-400" : "text-gray-800"}`}>
                      {facture.nomClient || "Nom du client"}
                    </div>
                    <div className={`text-gray-600 text-xs whitespace-pre-line ${!facture.adresseClient ? "text-red-300" : ""}`}>
                      {facture.adresseClient || "Adresse"}
                    </div>
                  </div>
                </div>

                {/* Ligne bleue */}
                <div style={{ borderTop: "2px solid #009ADE", marginBottom: "8px" }} />

                {/* Titre */}
                <div className="text-center font-bold text-lg mb-2" style={{ color: "#004D71" }}>FACTURE</div>

                {/* Ligne bleue */}
                <div style={{ borderTop: "2px solid #009ADE", marginBottom: "12px" }} />

                {/* Détails */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[
                    { label: "N° Facture", value: facture.numeroFacture },
                    { label: "Date", value: facture.dateFacturation },
                    { label: "N° Client", value: facture.numeroClient },
                    { label: "Référent", value: facture.referent },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="text-gray-400" style={{ fontSize: "9px" }}>{item.label}</div>
                      <div className={`font-semibold ${!item.value ? "text-red-400" : "text-gray-800"}`} style={{ fontSize: "10px" }}>
                        {item.value || "—"}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: "1px solid #EEE", marginBottom: "8px" }} />

                {/* Intitulé */}
                <div>
                  <div className="text-gray-400" style={{ fontSize: "9px" }}>Intitulé de la mission</div>
                  <div className={`font-semibold mb-4 ${!facture.intitule ? "text-red-400" : "text-gray-800"}`} style={{ fontSize: "10px" }}>
                    {facture.intitule || "Intitulé de la mission"}
                  </div>
                </div>

                {/* Tableau */}
                <table className="w-full mb-4" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#004D71", color: "white" }}>
                      <th className="text-left px-2 py-1.5" style={{ fontSize: "9px" }}>Désignation</th>
                      <th className="text-center px-2 py-1.5" style={{ fontSize: "9px" }}>Qté</th>
                      <th className="text-right px-2 py-1.5" style={{ fontSize: "9px" }}>Prix HT</th>
                      <th className="text-right px-2 py-1.5" style={{ fontSize: "9px" }}>Total HT</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ background: "#F5F5F5" }}>
                      <td className="px-2 py-1.5" style={{ fontSize: "9px" }}>
                        {facture.designationPrenom || facture.designationNom
                          ? `Finalisation avec ${facture.designationPrenom} ${facture.designationNom}`.trim()
                          : <span className="text-red-400">Nom du candidat</span>}
                      </td>
                      <td className="text-center px-2 py-1.5" style={{ fontSize: "9px" }}>1</td>
                      <td className="text-right px-2 py-1.5" style={{ fontSize: "9px" }}>
                        {prix > 0 ? formatEur(prix) : <span className="text-red-400">0,00 €</span>}
                      </td>
                      <td className="text-right px-2 py-1.5" style={{ fontSize: "9px" }}>
                        {prix > 0 ? formatEur(prix) : <span className="text-red-400">0,00 €</span>}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Totaux */}
                <div className="flex justify-end mb-4">
                  <div style={{ width: "200px" }}>
                    <div className="flex justify-between py-1 text-gray-600" style={{ fontSize: "10px" }}>
                      <span>Total HT</span><span>{formatEur(prix)}</span>
                    </div>
                    <div className="flex justify-between py-1 text-gray-600" style={{ fontSize: "10px" }}>
                      <span>{facture.tva ? "TVA 20%" : "TVA"}</span>
                      <span>{facture.tva ? formatEur(tvaAmount) : "Non applicable"}</span>
                    </div>
                    <div
                      className="flex justify-between px-2 py-1.5 font-bold text-white mt-1"
                      style={{ background: "#004D71", fontSize: "11px", borderRadius: "4px" }}
                    >
                      <span>Total TTC</span><span>{formatEur(totalTTC)}</span>
                    </div>
                  </div>
                </div>

                {/* Mentions */}
                <div style={{ borderTop: "1px solid #009ADE", paddingTop: "8px" }}>
                  <div className="text-gray-400 leading-4" style={{ fontSize: "8px" }}>
                    Aucun escompte consenti pour règlement anticipé. Tout incident de paiement est passible d&apos;intérêt de retard. Le montant des pénalités résulte de l&apos;application aux sommes restant dues d&apos;un intérêt de 10% sur base annuelle ou un intérêt de trois fois le taux légal, le montant le plus élevé s&apos;appliquant.
                  </div>
                </div>

                {/* Footer */}
                <div style={{ borderTop: "1px solid #009ADE", marginTop: "12px", paddingTop: "6px" }}>
                  <div className="text-center text-gray-400" style={{ fontSize: "8px" }}>
                    LE CABRH — 15 All. Duguay Trouin, 44000 Nantes — nantes@le-cabrh.fr — TVA FR54889224622
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center border-t" style={{ background: "white", borderColor: "#009ADE20" }}>
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
