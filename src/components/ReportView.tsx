"use client";

import { useState, useEffect } from "react";
import type { CompteRendu, CandidatInfo } from "@/lib/extractInfo";

interface ReportViewProps {
  compteRendu: CompteRendu;
  onUpdate?: (updated: CompteRendu) => void;
}

// ─── Champ texte inline éditable ─────────────────────────────────
function EditableField({
  value,
  onChange,
  multiline = false,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);

  if (multiline) {
    return editing ? (
      <textarea
        autoFocus
        rows={Math.max(3, (value.match(/\n/g) || []).length + 2)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setEditing(false)}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-700 focus:outline-none resize-y leading-relaxed ${className}`}
        style={{ borderColor: "#009ADE", minHeight: 80 }}
      />
    ) : (
      <div
        className={`group relative cursor-text rounded-lg px-3 py-2 -mx-3 -my-2 hover:bg-sky-50 transition-colors ${className}`}
        onClick={() => setEditing(true)}
        title="Cliquez pour modifier"
      >
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{value || <span className="text-gray-400 italic">Vide</span>}</p>
        <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <PencilIcon />
        </span>
      </div>
    );
  }

  return editing ? (
    <input
      autoFocus
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => setEditing(false)}
      onKeyDown={(e) => { if (e.key === "Enter") setEditing(false); }}
      className={`w-full rounded-lg border px-3 py-1.5 text-sm text-gray-700 focus:outline-none ${className}`}
      style={{ borderColor: "#009ADE" }}
    />
  ) : (
    <div
      className="group relative cursor-text inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 -mx-2 hover:bg-sky-50 transition-colors"
      onClick={() => setEditing(true)}
      title="Cliquez pour modifier"
    >
      <span className={`text-sm text-gray-700 ${className}`}>{value || <span className="text-gray-400 italic">—</span>}</span>
      <span className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <PencilIcon />
      </span>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg className="w-3.5 h-3.5" style={{ color: "#009ADE" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

// ─── Section avec en-tête ──────────────────────────────────────────
function Section({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="section-enter bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4"
        style={{ background: "linear-gradient(135deg, #004D71, #009ADE)" }}>
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">{icon}</div>
        <h3 className="text-white font-semibold text-sm tracking-wide uppercase">{title}</h3>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ─── Ligne label / valeur ──────────────────────────────────────────
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 w-36 flex-shrink-0 mt-1">
        {label}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// ─── Composant principal ───────────────────────────────────────────
export default function ReportView({ compteRendu, onUpdate }: ReportViewProps) {
  const [data, setData] = useState<CandidatInfo>(compteRendu.candidat);
  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync si compteRendu change (nouveau CV chargé)
  useEffect(() => {
    setData(compteRendu.candidat);
    setHasChanges(false);
    setSaved(false);
  }, [compteRendu]);

  const update = (field: keyof CandidatInfo) => (value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setSaved(false);
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate({ ...compteRendu, candidat: data });
    }
    setHasChanges(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const nomComplet = `${data.prenom} ${data.nom}`.trim() || "Candidat";
  const { fichePosteFournie, dateGeneration } = compteRendu;

  return (
    <div className="space-y-5">

      {/* ── Bandeau "modifications en cours" ── */}
      {hasChanges && (
        <div className="sticky top-20 z-30 flex items-center justify-between gap-4 px-5 py-3 rounded-2xl shadow-lg"
          style={{ background: "linear-gradient(135deg, #004D71, #009ADE)" }}>
          <div className="flex items-center gap-2 text-white text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span className="font-medium">Modifications en cours</span>
            <span className="text-white/60 text-xs hidden sm:inline">— Cliquez sur Enregistrer pour appliquer au fichier Word</span>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white transition-all hover:shadow-md active:scale-95"
            style={{ color: "#004D71" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Enregistrer les modifications
          </button>
        </div>
      )}

      {/* ── Confirmation sauvegarde ── */}
      {saved && !hasChanges && (
        <div className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium"
          style={{ background: "#E6F5FB", color: "#004D71", border: "1px solid #009ADE40" }}>
          <svg className="w-4 h-4" style={{ color: "#009ADE" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Modifications enregistrées — le fichier Word utilisera ces données
        </div>
      )}

      {/* ── Carte candidat ── */}
      <div className="section-enter rounded-2xl p-6 shadow-md text-white"
        style={{ background: "linear-gradient(135deg, #004D71 0%, #009ADE 100%)" }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-1">
              Compte rendu d'entretien
            </p>
            <h2 className="text-2xl font-bold text-white">{nomComplet}</h2>
            {data.poste && <p className="text-white/80 text-sm mt-1 font-medium">{data.poste}</p>}
            {data.residence && !data.residence.includes("Non précis") && (
              <p className="text-white/60 text-sm mt-1 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {data.residence}
              </p>
            )}
          </div>
          <div className="text-right">
            {fichePosteFournie && (
              <span className="inline-flex items-center gap-1 bg-white/20 text-white text-xs px-2.5 py-1 rounded-full mb-2">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ciblé sur le poste
              </span>
            )}
            <p className="text-xs text-white/50">Généré le</p>
            <p className="text-sm font-medium text-white">{dateGeneration}</p>
          </div>
        </div>
      </div>

      {/* ── Profil Candidat ── */}
      <Section title="Profil Candidat" icon={
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      }>
        <InfoRow label="Candidat"><span className="text-sm text-gray-700 font-medium">{nomComplet}</span></InfoRow>
        <InfoRow label="Poste souhaité"><EditableField value={data.poste} onChange={update("poste")} /></InfoRow>
        <InfoRow label="Résidence"><EditableField value={data.residence} onChange={update("residence")} /></InfoRow>
        <InfoRow label="Nationalité"><EditableField value={data.nationalite} onChange={update("nationalite")} /></InfoRow>
      </Section>

      {/* ── Formation ── */}
      <Section title="Formation" icon={
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      }>
        <EditableField value={data.formation} onChange={update("formation")} multiline />
      </Section>

      {/* ── Expérience Professionnelle ── */}
      <Section title="Expérience Professionnelle" icon={
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      }>
        <EditableField value={data.experience} onChange={update("experience")} multiline />
      </Section>

      {/* ── Compétences ── */}
      <Section title="Résumé des Compétences" icon={
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      }>
        <EditableField value={data.competences} onChange={update("competences")} multiline />
      </Section>

      {/* ── Salaire & Disponibilités ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Section title="Salaire marché" icon={
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }>
          <EditableField value={data.salaireMarchePoste} onChange={update("salaireMarchePoste")} />
        </Section>

        <Section title="Dispo. entretien" icon={
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }>
          <EditableField value={data.disponibiliteEntretien} onChange={update("disponibiliteEntretien")} />
        </Section>

        <Section title="Dispo. démarrage" icon={
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }>
          <EditableField value={data.disponibiliteDemarrage} onChange={update("disponibiliteDemarrage")} />
        </Section>
      </div>
    </div>
  );
}
