"use client";

import { useState, useCallback, useRef } from "react";
import CabrhLogo from "@/components/CabrhLogo";
import Link from "next/link";
import EmailModal from "@/components/EmailModal";
import type { AnnonceInput, AnnonceGeneree } from "@/lib/generateAnnonce";
import { addToHistory } from "@/lib/history";

// ─── Champ de saisie ─────────────────────────────────────────────────
function Field({
  label, placeholder, value, onChange, multiline = false, hint, span2 = false,
}: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; multiline?: boolean; hint?: string; span2?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1.5${span2 ? " sm:col-span-2" : ""}`}>
      <label className="text-sm font-semibold" style={{ color: "#004D71" }}>{label}</label>
      {hint && <p className="text-xs text-gray-400 -mt-1">{hint}</p>}
      {multiline ? (
        <textarea
          rows={4} placeholder={placeholder} value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 focus:outline-none resize-none transition-colors"
          onFocus={(e) => (e.target.style.borderColor = "#009ADE")}
          onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
        />
      ) : (
        <input
          type="text" placeholder={placeholder} value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 focus:outline-none transition-colors"
          onFocus={(e) => (e.target.style.borderColor = "#009ADE")}
          onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
        />
      )}
    </div>
  );
}

// ─── Bloc de section du formulaire ───────────────────────────────────
function FormSection({ num, title, icon, children }: {
  num: string; title: string; icon: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4"
        style={{ background: "linear-gradient(135deg, #004D71, #009ADE)" }}>
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}
        >{num}</span>
        <div className="flex items-center gap-2">
          <span className="text-white text-base">{icon}</span>
          <h3 className="text-white font-semibold text-sm">{title}</h3>
        </div>
      </div>
      <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

// ─── Badge section dans l'aperçu ─────────────────────────────────────
function PreviewSection({ num, title, children }: {
  num: string; title: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-3.5"
        style={{ background: "linear-gradient(135deg, #004D71, #009ADE)" }}>
        <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.15)", color: "#7DDEFF" }}>{num}</span>
        <h3 className="text-white font-semibold text-sm uppercase tracking-wide">{title}</h3>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ─── Zone de dépôt fiche de poste ────────────────────────────────────
function FichePosteDropzone({ onExtracted }: { onExtracted: (text: string, fileName: string) => void }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.name.match(/\.(pdf|docx|doc)$/i)) {
      setError("Format non supporté. Utilisez un fichier PDF ou DOCX.");
      return;
    }
    setError("");
    setLoading(true);
    setFileName(file.name);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/extract-text", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.error || "Erreur d'extraction."); setLoading(false); return; }
      onExtracted(data.text, file.name);
    } catch { setError("Impossible de lire le fichier."); }
    finally { setLoading(false); }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const clear = () => { setFileName(""); setError(""); onExtracted("", ""); if (inputRef.current) inputRef.current.value = ""; };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4"
        style={{ background: "linear-gradient(135deg, #004D71, #009ADE)" }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.2)" }}>
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-white font-semibold text-sm">Fiche de poste client <span className="text-white/60 font-normal">(optionnel)</span></h3>
      </div>

      <div className="px-6 py-5">
        {fileName && !loading ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "#E6F5FB", border: "1px solid #009ADE40" }}>
            <svg className="w-5 h-5 flex-shrink-0" style={{ color: "#009ADE" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium flex-1" style={{ color: "#004D71" }}>{fileName}</span>
            <button onClick={clear} className="text-xs text-gray-400 hover:text-red-500 transition-colors underline">Retirer</button>
          </div>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className="relative cursor-pointer rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 py-8"
            style={{ borderColor: dragging ? "#009ADE" : "#C8D8E8", background: dragging ? "#E6F5FB" : "#FAFCFF" }}
          >
            {loading ? (
              <>
                <svg className="w-6 h-6 animate-spin" style={{ color: "#009ADE" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <p className="text-sm font-medium" style={{ color: "#009ADE" }}>Extraction en cours…</p>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#E6F5FB" }}>
                  <svg className="w-5 h-5" style={{ color: "#009ADE" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold" style={{ color: "#004D71" }}>Glissez la fiche de poste ici</p>
                  <p className="text-xs text-gray-400 mt-1">ou cliquez pour sélectionner — PDF, DOCX acceptés</p>
                </div>
              </>
            )}
            <input ref={inputRef} type="file" accept=".pdf,.docx,.doc" className="hidden" onChange={onFileChange} />
          </div>
        )}
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        <p className="mt-2 text-xs text-gray-400">
          Le contenu du document sera utilisé par l&apos;IA pour enrichir l&apos;annonce sans remplacer vos saisies.
        </p>
      </div>
    </div>
  );
}

// ─── Champ texte inline éditable ─────────────────────────────────────
function EditableText({ value, onChange, multiline = false, placeholder = "", className = "" }: {
  value: string; onChange: (v: string) => void;
  multiline?: boolean; placeholder?: string; className?: string;
}) {
  const base = `w-full bg-transparent border-0 border-b-2 focus:outline-none transition-colors resize-none text-sm text-gray-700 leading-relaxed ${className}`;
  return multiline ? (
    <textarea
      rows={Math.max(2, value.split("\n").length)}
      value={value} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={base}
      style={{ borderBottomColor: "#009ADE40" }}
      onFocus={(e) => (e.target.style.borderBottomColor = "#009ADE")}
      onBlur={(e) => (e.target.style.borderBottomColor = "#009ADE40")}
    />
  ) : (
    <input
      type="text" value={value} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={base + " py-0.5"}
      style={{ borderBottomColor: "#009ADE40" }}
      onFocus={(e) => (e.target.style.borderBottomColor = "#009ADE")}
      onBlur={(e) => (e.target.style.borderBottomColor = "#009ADE40")}
    />
  );
}

// ─── Liste éditable (items ajoutables / supprimables) ─────────────────
function EditableList({ items, onChange, placeholder = "Ajouter un élément…", bullet }: {
  items: string[]; onChange: (items: string[]) => void;
  placeholder?: string; bullet?: React.ReactNode;
}) {
  const updateItem = (i: number, v: string) => {
    const next = [...items]; next[i] = v; onChange(next);
  };
  const removeItem = (i: number) => onChange(items.filter((_, j) => j !== i));
  const addItem = () => onChange([...items, ""]);

  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 group">
          {bullet && <span className="flex-shrink-0 mt-1">{bullet}</span>}
          <input
            type="text" value={item} placeholder={placeholder}
            onChange={(e) => updateItem(i, e.target.value)}
            className="flex-1 text-sm text-gray-700 bg-transparent border-0 border-b focus:outline-none transition-colors py-0.5"
            style={{ borderBottomColor: "#009ADE30" }}
            onFocus={(e) => (e.target.style.borderBottomColor = "#009ADE")}
            onBlur={(e) => (e.target.style.borderBottomColor = "#009ADE30")}
          />
          <button
            onClick={() => removeItem(i)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 flex-shrink-0 mt-0.5"
            title="Supprimer">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <button onClick={addItem}
        className="flex items-center gap-1 text-xs font-medium mt-1 transition-colors"
        style={{ color: "#009ADE" }}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Ajouter
      </button>
    </div>
  );
}

// ─── Tags éditables ────────────────────────────────────────────────────
function EditableTags({ tags, onChange, prefix = "" }: {
  tags: string[]; onChange: (tags: string[]) => void; prefix?: string;
}) {
  const [newTag, setNewTag] = useState("");
  const remove = (i: number) => onChange(tags.filter((_, j) => j !== i));
  const add = () => {
    const t = newTag.trim().replace(/^#/, "");
    if (t) { onChange([...tags, t]); setNewTag(""); }
  };
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {tags.map((t, i) => (
        <span key={i} className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded group"
          style={{ color: "#009ADE", background: "#E6F5FB" }}>
          {prefix}{t}
          <button onClick={() => remove(i)} className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400">
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}
      <input
        value={newTag} onChange={(e) => setNewTag(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        placeholder="+ tag"
        className="text-xs w-16 bg-transparent border-0 border-b focus:outline-none"
        style={{ color: "#009ADE", borderBottomColor: "#009ADE50" }}
      />
    </div>
  );
}

// ─── Aperçu + édition annonce ─────────────────────────────────────────
function AnnoncePreview({ annonce, onAnnonceChange, onDownload, isDownloading, onEmailClick }: {
  annonce: AnnonceGeneree;
  onAnnonceChange: (a: AnnonceGeneree) => void;
  onDownload: () => void;
  isDownloading: boolean;
  onEmailClick: () => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const { input, detailPoste, profilRecherche, informationsComplementaires } = annonce;

  // Helpers de mise à jour
  const upd = (patch: Partial<AnnonceGeneree>) => onAnnonceChange({ ...annonce, ...patch });
  const updInput = (patch: Partial<typeof input>) => upd({ input: { ...input, ...patch } });
  const updDetail = (patch: Partial<typeof detailPoste>) => upd({ detailPoste: { ...detailPoste, ...patch } });
  const updConditions = (patch: Partial<typeof detailPoste.conditions>) =>
    updDetail({ conditions: { ...detailPoste.conditions, ...patch } });
  const updProfil = (patch: Partial<typeof profilRecherche>) => upd({ profilRecherche: { ...profilRecherche, ...patch } });
  const updInfos = (patch: Partial<typeof informationsComplementaires>) =>
    upd({ informationsComplementaires: { ...informationsComplementaires, ...patch } });

  return (
    <div className="space-y-4">
      {/* Bandeau titre */}
      <div className="rounded-2xl overflow-hidden shadow-md"
        style={{ background: "linear-gradient(135deg, #004D71 0%, #009ADE 100%)" }}>
        <div className="px-8 py-6 text-center">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">Offre d'emploi — le CabRH</p>
          {editMode ? (
            <input
              type="text" value={input.intitule}
              onChange={(e) => updInput({ intitule: e.target.value })}
              className="text-3xl font-bold text-white bg-transparent border-0 border-b-2 border-white/40 focus:border-white focus:outline-none text-center w-full mb-3"
            />
          ) : (
            <h2 className="text-3xl font-bold text-white mb-3">{input.intitule}</h2>
          )}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {(informationsComplementaires.contrat || editMode) && (
              editMode ? (
                <input
                  value={informationsComplementaires.contrat}
                  onChange={(e) => updInfos({ contrat: e.target.value })}
                  placeholder="Type de contrat"
                  className="bg-white/20 text-white text-xs px-3 py-1 rounded-full border-0 focus:outline-none focus:bg-white/30 text-center w-32"
                />
              ) : (
                <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">{informationsComplementaires.contrat}</span>
              )
            )}
            {(informationsComplementaires.localisation || editMode) && (
              editMode ? (
                <input
                  value={informationsComplementaires.localisation}
                  onChange={(e) => updInfos({ localisation: e.target.value })}
                  placeholder="Localisation"
                  className="bg-white/20 text-white text-xs px-3 py-1 rounded-full border-0 focus:outline-none focus:bg-white/30 text-center w-40"
                />
              ) : (
                <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {informationsComplementaires.localisation}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* Barre d'outils édition */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-gray-400">
          {editMode ? "✏️ Mode édition — modifiez directement les champs" : "Relisez et exportez, ou activez le mode édition pour modifier le contenu"}
        </p>
        <button
          onClick={() => setEditMode(!editMode)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border"
          style={editMode
            ? { background: "#004D71", color: "white", borderColor: "#004D71" }
            : { background: "white", color: "#004D71", borderColor: "#009ADE60" }}>
          {editMode ? (
            <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Terminer</>
          ) : (
            <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>Modifier</>
          )}
        </button>
      </div>

      {/* S1 — En bref */}
      <PreviewSection num="01" title="En bref">
        {editMode ? (
          <EditableText
            value={annonce.descriptionCourte}
            onChange={(v) => upd({ descriptionCourte: v })}
            multiline placeholder="Accroche de l'annonce…"
            className="italic"
          />
        ) : (
          <p className="text-sm text-gray-700 italic leading-relaxed mb-3">{annonce.descriptionCourte}</p>
        )}
        <div className="mt-3">
          {editMode ? (
            <EditableTags
              tags={annonce.hashtags}
              onChange={(tags) => upd({ hashtags: tags })}
              prefix="#"
            />
          ) : (
            annonce.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {annonce.hashtags.map((h, i) => (
                  <span key={i} className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color: "#009ADE" }}>#{h}</span>
                ))}
              </div>
            )
          )}
        </div>
      </PreviewSection>

      {/* S2 — Entreprise */}
      <PreviewSection num="02" title="Notre client">
        {editMode ? (
          <EditableText
            value={annonce.entrepriseTexte}
            onChange={(v) => upd({ entrepriseTexte: v })}
            multiline placeholder="Texte de présentation de l'entreprise…"
          />
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed mb-3">{annonce.entrepriseTexte}</p>
        )}
        <div className="mt-3">
          {editMode ? (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Tags secteurs / chantiers</p>
              <EditableTags
                tags={detailPoste.typesChantiersListe}
                onChange={(tags) => updDetail({ typesChantiersListe: tags })}
              />
            </div>
          ) : (
            detailPoste.typesChantiersListe.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {detailPoste.typesChantiersListe.map((t, i) => (
                  <span key={i} className="text-xs font-medium px-3 py-1 rounded-full border"
                    style={{ background: "#E6F5FB", color: "#004D71", borderColor: "#009ADE40" }}>{t}</span>
                ))}
              </div>
            )
          )}
        </div>
      </PreviewSection>

      {/* S3 — Détail du poste */}
      <PreviewSection num="03" title="Détail du poste">
        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#004D71" }}>Missions</p>
        {editMode ? (
          <EditableList
            items={detailPoste.missions}
            onChange={(missions) => updDetail({ missions })}
            placeholder="Saisir une mission…"
            bullet={<span style={{ color: "#009ADE" }} className="font-bold text-sm">▸</span>}
          />
        ) : (
          detailPoste.missions.length > 0 && (
            <ul className="space-y-1.5 mb-4">
              {detailPoste.missions.map((m, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span style={{ color: "#009ADE" }} className="font-bold flex-shrink-0 mt-0.5">▸</span>{m}
                </li>
              ))}
            </ul>
          )
        )}

        <p className="text-xs font-semibold uppercase tracking-wide mb-2 mt-4" style={{ color: "#004D71" }}>Conditions</p>
        {editMode ? (
          <div className="space-y-3">
            {[
              { label: "Rémunération", key: "remuneration" as const },
              { label: "Avantages", key: "avantages" as const },
              { label: "Encadrement", key: "encadrement" as const },
            ].map(({ label, key }) => (
              <div key={key} className="flex items-start gap-3">
                <span className="text-gray-400 w-28 flex-shrink-0 text-xs font-semibold uppercase pt-1">{label}</span>
                <EditableText
                  value={detailPoste.conditions[key]}
                  onChange={(v) => updConditions({ [key]: v })}
                  placeholder={`${label}…`}
                />
              </div>
            ))}
          </div>
        ) : (
          (detailPoste.conditions.remuneration || detailPoste.conditions.avantages || detailPoste.conditions.encadrement) && (
            <div className="space-y-1">
              {detailPoste.conditions.remuneration && <div className="flex gap-3 text-sm"><span className="text-gray-400 w-28 flex-shrink-0 text-xs font-semibold uppercase">Rémunération</span><span className="text-gray-700">{detailPoste.conditions.remuneration}</span></div>}
              {detailPoste.conditions.avantages && <div className="flex gap-3 text-sm"><span className="text-gray-400 w-28 flex-shrink-0 text-xs font-semibold uppercase">Avantages</span><span className="text-gray-700">{detailPoste.conditions.avantages}</span></div>}
              {detailPoste.conditions.encadrement && <div className="flex gap-3 text-sm"><span className="text-gray-400 w-28 flex-shrink-0 text-xs font-semibold uppercase">Encadrement</span><span className="text-gray-700">{detailPoste.conditions.encadrement}</span></div>}
            </div>
          )
        )}
      </PreviewSection>

      {/* S4 — Profil recherché */}
      <PreviewSection num="04" title="Profil recherché">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(
            [
              { label: "Compétences", key: "competences" as const },
              { label: "Habilitations", key: "habilitations" as const },
              { label: "Qualités", key: "qualites" as const },
            ]
          ).map(({ label, key }) => (
            <div key={key}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{label}</p>
              {editMode ? (
                <EditableList
                  items={profilRecherche[key]}
                  onChange={(items) => updProfil({ [key]: items })}
                  placeholder={`Ajouter…`}
                  bullet={<span style={{ color: "#009ADE" }} className="text-sm">•</span>}
                />
              ) : (
                <ul className="space-y-1">
                  {profilRecherche[key].map((c, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-1.5">
                      <span style={{ color: "#009ADE" }} className="flex-shrink-0">•</span>{c}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </PreviewSection>

      {/* S5 — Infos complémentaires */}
      <PreviewSection num="05" title="Informations complémentaires">
        {editMode ? (
          <div className="space-y-3">
            {[
              { label: "Contrat", key: "contrat" as const },
              { label: "Localisation", key: "localisation" as const },
              { label: "Référence", key: "reference" as const },
            ].map(({ label, key }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-gray-400 w-28 flex-shrink-0 text-xs font-semibold uppercase">{label}</span>
                <EditableText
                  value={informationsComplementaires[key]}
                  onChange={(v) => updInfos({ [key]: v })}
                  placeholder={`${label}…`}
                />
              </div>
            ))}
            <div className="mt-2">
              <span className="text-gray-400 text-xs font-semibold uppercase block mb-1">Autres infos</span>
              <EditableText
                value={informationsComplementaires.autresInfos}
                onChange={(v) => updInfos({ autresInfos: v })}
                multiline placeholder="Informations pratiques supplémentaires…"
              />
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-3">
              {informationsComplementaires.contrat && <div className="flex gap-3 text-sm"><span className="text-gray-400 w-28 flex-shrink-0 text-xs font-semibold uppercase">Contrat</span><span className="text-gray-700">{informationsComplementaires.contrat}</span></div>}
              {informationsComplementaires.localisation && <div className="flex gap-3 text-sm"><span className="text-gray-400 w-28 flex-shrink-0 text-xs font-semibold uppercase">Localisation</span><span className="text-gray-700">{informationsComplementaires.localisation}</span></div>}
              {informationsComplementaires.reference && <div className="flex gap-3 text-sm"><span className="text-gray-400 w-28 flex-shrink-0 text-xs font-semibold uppercase">Référence</span><span className="text-gray-700">{informationsComplementaires.reference}</span></div>}
            </div>
            {informationsComplementaires.autresInfos && (
              <p className="text-sm text-gray-500 italic border-t border-gray-100 pt-3">{informationsComplementaires.autresInfos}</p>
            )}
          </>
        )}
      </PreviewSection>

      {/* Boutons export */}
      <div className="flex gap-3 flex-wrap">
        <button onClick={onEmailClick}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold border transition-all hover:shadow-md"
          style={{ color: "#004D71", borderColor: "#009ADE60", background: "#E6F5FB" }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Envoyer par email
        </button>
        <button onClick={onDownload} disabled={isDownloading}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl active:scale-95 disabled:opacity-60"
          style={{ background: isDownloading ? "#009ADE99" : "linear-gradient(135deg, #009ADE, #004D71)" }}>
          {isDownloading ? (
            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>Génération…</>
          ) : (
            <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Télécharger en Word</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Page principale ─────────────────────────────────────────────────
const EMPTY: AnnonceInput = {
  intitule: "", contrat: "", localisation: "", reference: "",
  remuneration: "", primeGD: "", encadrement: "",
  descriptionEntreprise: "", typesChantiersRaw: "",
  competences: "", habilitations: "", qualitesHumaines: "",
  infosComplementaires: "",
  fichePosteTexte: "",
  infosClient: "",
};

type Step = "form" | "loading" | "result" | "error";
type FormTab = "formulaire" | "client";

export default function AnnoncePage() {
  const [step, setStep] = useState<Step>("form");
  const [formTab, setFormTab] = useState<FormTab>("formulaire");
  const [input, setInput] = useState<AnnonceInput>(EMPTY);
  const [ficheFileName, setFicheFileName] = useState("");
  const [annonce, setAnnonce] = useState<AnnonceGeneree | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const set = (key: keyof AnnonceInput) => (v: string) =>
    setInput((p) => ({ ...p, [key]: v }));

  const handleFicheExtracted = (text: string, fileName: string) => {
    setInput((p) => ({ ...p, fichePosteTexte: text }));
    setFicheFileName(fileName);
  };

  const handleGenerate = useCallback(async () => {
    if (!input.intitule.trim()) {
      alert("Veuillez renseigner au minimum l'intitulé du poste.");
      return;
    }
    setStep("loading");
    const msgs = ["Analyse de la fiche de poste…", "Rédaction avec l'IA…", "Structuration en 5 sections…", "Finalisation…"];
    let i = 0; setLoadingMsg(msgs[0]);
    const t = setInterval(() => { i = (i + 1) % msgs.length; setLoadingMsg(msgs[i]); }, 2200);
    try {
      const res = await fetch("/api/generate-annonce", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      clearInterval(t);
      const data = await res.json();
      if (!res.ok || !data.success) { setErrorMsg(data.error || "Erreur."); setStep("error"); return; }
      setAnnonce(data.annonce);
      addToHistory({
        type: "annonce",
        title: data.annonce.input.intitule || "Annonce",
        subtitle: [data.annonce.input.contrat, data.annonce.input.localisation].filter(Boolean).join(" — "),
        data: data.annonce,
      });
      setStep("result");
    } catch { clearInterval(t); setErrorMsg("Impossible de contacter le serveur."); setStep("error"); }
  }, [input]);

  const handleSendEmail = useCallback(async (email: string) => {
    if (!annonce) return;
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: email, type: "annonce", annonce }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Erreur lors de l'envoi.");
  }, [annonce]);

  const handleDownload = useCallback(async () => {
    if (!annonce) return;
    setIsDownloading(true);
    try {
      // On envoie l'annonce complète (potentiellement modifiée manuellement)
      // L'API la convertit directement en DOCX sans passer par l'IA
      const res = await fetch("/api/generate-annonce", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ annonce, format: "docx" }),
      });
      if (!res.ok) { alert((await res.json()).error || "Erreur."); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Annonce_${annonce.input.intitule.replace(/[^a-zA-Z0-9À-ÿ]/g, "_").slice(0, 40)}.docx`;
      a.click(); URL.revokeObjectURL(url);
    } catch { alert("Erreur lors du téléchargement."); }
    finally { setIsDownloading(false); }
  }, [annonce]);

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
            <span className="text-xs font-semibold px-4 py-2 rounded-full"
              style={{ background: "#004D71", color: "white" }}>
              Générateur d&apos;Annonce
            </span>
            <Link href="/anonyme"
              className="text-xs font-medium px-4 py-2 rounded-full border transition-colors"
              style={{ color: "#004D71", borderColor: "#009ADE40", background: "white" }}>
              CV Anonyme
            </Link>
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
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10">

        {/* ── FORMULAIRE ── */}
        {step === "form" && (
          <div className="section-enter">
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: "#004D71" }}>Générateur d'Annonce</h1>
              <p className="text-gray-500 text-base max-w-xl mx-auto">
                Déposez la fiche de poste de votre client et complétez les informations — l'IA rédige une annonce professionnelle en 5 sections au format le CabRH.
              </p>
            </div>

            <div className="space-y-5">

              {/* ── Zone de dépôt fiche de poste ── */}
              <FichePosteDropzone
                onExtracted={handleFicheExtracted}
              />

              {/* ── Onglets Formulaire / Infos complémentaires client ── */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Tabs header */}
                <div className="flex border-b border-gray-100">
                  <button
                    onClick={() => setFormTab("formulaire")}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${formTab === "formulaire" ? "border-b-2 text-white" : "text-gray-500 hover:text-gray-700"}`}
                    style={formTab === "formulaire" ? { borderBottomColor: "#009ADE", background: "linear-gradient(135deg, #004D71, #009ADE)", color: "white" } : {}}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Formulaire
                  </button>
                  <button
                    onClick={() => setFormTab("client")}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors`}
                    style={formTab === "client" ? { borderBottom: "2px solid #009ADE", background: "linear-gradient(135deg, #004D71, #009ADE)", color: "white" } : { color: "#6B7280" }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Infos complémentaires client
                    {input.infosClient && (
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#009ADE" }} />
                    )}
                  </button>
                </div>

                {/* Tab content */}
                <div className="p-0">
                  {formTab === "formulaire" && (
                    <div className="space-y-0 divide-y divide-gray-50">
                      {/* Section 1 — Infos générales */}
                      <div className="px-6 py-5">
                        <h4 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: "#009ADE" }}>
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "#009ADE" }}>1</span>
                          Informations générales
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Field label="Intitulé du poste *" placeholder="ex : Conducteur de Travaux VRD" value={input.intitule} onChange={set("intitule")} />
                          <Field label="Type de contrat" placeholder="ex : CDI, CDD, Intérim…" value={input.contrat} onChange={set("contrat")} />
                          <Field label="Localisation" placeholder="ex : Lyon (69), région Auvergne-Rhône-Alpes" value={input.localisation} onChange={set("localisation")} />
                          <Field label="Référence interne" placeholder="ex : REF-2025-042" value={input.reference} onChange={set("reference")} />
                        </div>
                      </div>

                      {/* Section 2 — Conditions */}
                      <div className="px-6 py-5">
                        <h4 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: "#009ADE" }}>
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "#009ADE" }}>2</span>
                          Conditions du poste
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Field label="Rémunération" placeholder="ex : 45-55k€ brut/an selon profil" value={input.remuneration} onChange={set("remuneration")} />
                          <Field label="Primes / Avantages" placeholder="ex : prime de GD, véhicule de fonction, mutuelle…" value={input.primeGD} onChange={set("primeGD")} />
                          <div className="sm:col-span-2">
                            <Field label="Encadrement / Équipe" placeholder="ex : management de 5 personnes, rattaché au directeur travaux" value={input.encadrement} onChange={set("encadrement")} />
                          </div>
                        </div>
                      </div>

                      {/* Section 3 — Missions */}
                      <div className="px-6 py-5">
                        <h4 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: "#009ADE" }}>
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "#009ADE" }}>3</span>
                          Missions & Contexte
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Field label="Description de l'entreprise" placeholder="ex : PME de 80 personnes spécialisée dans les travaux de VRD, présente en région depuis 20 ans…" value={input.descriptionEntreprise} onChange={set("descriptionEntreprise")} multiline span2 />
                          <Field label="Types de chantiers / secteurs" placeholder="ex : VRD, terrassement, assainissement, voirie communale…" value={input.typesChantiersRaw} onChange={set("typesChantiersRaw")} hint="L'IA extraira des tags" multiline span2 />
                        </div>
                      </div>

                      {/* Section 4 — Profil */}
                      <div className="px-6 py-5">
                        <h4 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: "#009ADE" }}>
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "#009ADE" }}>4</span>
                          Profil recherché
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Field label="Compétences techniques" placeholder="ex : maîtrise AutoCAD, gestion planning, lecture de plans…" value={input.competences} onChange={set("competences")} multiline span2 />
                          <Field label="Habilitations / Certifications" placeholder="ex : AIPR, CACES, habilitation électrique B0…" value={input.habilitations} onChange={set("habilitations")} />
                          <Field label="Qualités humaines" placeholder="ex : rigueur, sens du terrain, leadership, autonomie…" value={input.qualitesHumaines} onChange={set("qualitesHumaines")} />
                        </div>
                      </div>

                      {/* Section 5 — Infos complémentaires */}
                      <div className="px-6 py-5">
                        <h4 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: "#009ADE" }}>
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "#009ADE" }}>5</span>
                          Informations complémentaires
                        </h4>
                        <div className="grid grid-cols-1 gap-4">
                          <Field label="Infos pratiques (optionnel)" placeholder="ex : déplacements à prévoir, prise de poste immédiate, permis B exigé…" value={input.infosComplementaires} onChange={set("infosComplementaires")} multiline />
                        </div>
                      </div>
                    </div>
                  )}

                  {formTab === "client" && (
                    <div className="px-6 py-6 space-y-4">
                      <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "#E6F5FB", border: "1px solid #009ADE30" }}>
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#009ADE" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Ces informations sont transmises à l'IA en contexte confidentiel pour enrichir l'annonce. Elles ne sont pas publiées telles quelles.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field
                          label="Nom du client (confidentiel — ne sera jamais publié)"
                          placeholder="ex : Entreprise Martin BTP — usage interne uniquement"
                          value={input.infosClient?.split("||")[0] || ""}
                          onChange={(v) => {
                            const parts = (input.infosClient || "").split("||");
                            parts[0] = v;
                            set("infosClient")(parts.join("||"));
                          }}
                        />
                        <Field
                          label="Secteur d'activité"
                          placeholder="ex : Travaux publics, Génie Civil, Second œuvre…"
                          value={input.infosClient?.split("||")[1] || ""}
                          onChange={(v) => {
                            const parts = (input.infosClient || "").split("||");
                            parts[1] = v;
                            set("infosClient")(parts.join("||"));
                          }}
                        />
                        <div className="sm:col-span-2">
                          <Field
                            label="Culture d'entreprise & valeurs"
                            placeholder="ex : Entreprise familiale, forte culture terrain, management bienveillant, turnover faible…"
                            value={input.infosClient?.split("||")[2] || ""}
                            onChange={(v) => {
                              const parts = (input.infosClient || "").split("||");
                              parts[2] = v;
                              set("infosClient")(parts.join("||"));
                            }}
                            multiline
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Field
                            label="Points différenciants de l'offre"
                            placeholder="ex : Véhicule de fonction dès l'embauche, flexibilité des horaires, projets d'envergure nationale…"
                            value={input.infosClient?.split("||")[3] || ""}
                            onChange={(v) => {
                              const parts = (input.infosClient || "").split("||");
                              parts[3] = v;
                              set("infosClient")(parts.join("||"));
                            }}
                            multiline
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Field
                            label="Message clé à faire passer"
                            placeholder="ex : On cherche quelqu'un de terrain, pas un gestionnaire de bureau. La autonomie est réelle dès le premier jour."
                            value={input.infosClient?.split("||")[4] || ""}
                            onChange={(v) => {
                              const parts = (input.infosClient || "").split("||");
                              parts[4] = v;
                              set("infosClient")(parts.join("||"));
                            }}
                            multiline
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Field
                            label="Contexte particulier (confidentiel)"
                            placeholder="ex : Remplacement d'un départ à la retraite, création de poste suite à une croissance externe, contexte urgent…"
                            value={input.infosClient?.split("||")[5] || ""}
                            onChange={(v) => {
                              const parts = (input.infosClient || "").split("||");
                              parts[5] = v;
                              set("infosClient")(parts.join("||"));
                            }}
                            multiline
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Indicateur fiche de poste chargée */}
              {ficheFileName && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium" style={{ background: "#E6F5FB", color: "#004D71", border: "1px solid #009ADE30" }}>
                  <svg className="w-4 h-4 flex-shrink-0" style={{ color: "#009ADE" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Fiche de poste chargée : <span className="font-bold">{ficheFileName}</span> — l'IA l'utilisera comme contexte
                </div>
              )}

              <button onClick={handleGenerate}
                className="w-full py-4 rounded-2xl text-base font-bold text-white shadow-lg hover:shadow-xl transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #009ADE, #004D71)" }}>
                ✨ Générer l'annonce avec l'IA
              </button>
            </div>
          </div>
        )}

        {/* ── CHARGEMENT ── */}
        {step === "loading" && (
          <div className="section-enter max-w-md mx-auto text-center py-20">
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full opacity-20 animate-spin"
                style={{ background: "conic-gradient(#009ADE, #004D71, #009ADE)" }} />
              <div className="absolute inset-2 rounded-full flex items-center justify-center"
                style={{ background: "white", boxShadow: "0 0 0 4px #009ADE20" }}>
                <span className="text-3xl">✨</span>
              </div>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "#004D71" }}>Rédaction en cours</h2>
            <p className="text-sm font-medium" style={{ color: "#009ADE" }}>{loadingMsg}</p>
          </div>
        )}

        {/* ── RÉSULTAT ── */}
        {step === "result" && annonce && (
          <div className="section-enter">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold" style={{ color: "#004D71" }}>Annonce générée ✓</h2>
                <p className="text-sm text-gray-500">Relisez et exportez en Word</p>
              </div>
              <button onClick={() => setStep("form")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors">
                ← Nouvelle annonce
              </button>
            </div>
            <AnnoncePreview
              annonce={annonce}
              onAnnonceChange={setAnnonce}
              onDownload={handleDownload}
              isDownloading={isDownloading}
              onEmailClick={() => setEmailModalOpen(true)}
            />
          </div>
        )}

        {/* ── ERREUR ── */}
        {step === "error" && (
          <div className="section-enter max-w-lg mx-auto text-center py-16">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center bg-red-50">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">Une erreur est survenue</h2>
            <p className="text-sm text-gray-600 mb-6">{errorMsg}</p>
            <button onClick={() => setStep("form")}
              className="px-6 py-3 rounded-xl font-semibold text-white shadow-md"
              style={{ background: "linear-gradient(135deg, #009ADE, #004D71)" }}>
              Réessayer
            </button>
          </div>
        )}
      </main>

      {/* Modal email */}
      <EmailModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        onSend={handleSendEmail}
        fileName={annonce ? `Annonce_${annonce.input.intitule.replace(/[^a-zA-Z0-9À-ÿ]/g, "_").slice(0, 40)}.docx` : "annonce.docx"}
      />

      <footer className="mt-auto py-6 text-center border-t"
        style={{ background: "white", borderColor: "#009ADE20" }}>
        <div className="flex items-center justify-center gap-2 mb-1">
          <CabrhLogo size="sm" />
        </div>
        <p className="text-xs text-gray-400">© {new Date().getFullYear()} le CabRH — Outil interne confidentiel</p>
      </footer>
    </div>
  );
}
