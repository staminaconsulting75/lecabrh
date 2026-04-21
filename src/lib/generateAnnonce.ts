import Anthropic from "@anthropic-ai/sdk";

export interface AnnonceInput {
  // Infos générales
  intitule: string;
  contrat: string;
  localisation: string;
  reference: string;
  // Conditions
  remuneration: string;
  primeGD: string;
  encadrement: string;
  // Contexte entreprise
  descriptionEntreprise: string;
  typesChantiersRaw: string;
  // Profil
  competences: string;
  habilitations: string;
  qualitesHumaines: string;
  // Infos complémentaires libres
  infosComplementaires: string;
  // Fiche de poste client (texte extrait du document glissé)
  fichePosteTexte?: string;
  // Informations complémentaires client (saisie libre)
  infosClient?: string;
}

export interface AnnonceGeneree {
  input: AnnonceInput;

  // Section 1 — Accroche
  descriptionCourte: string;   // ~200 caractères max
  hashtags: string[];          // ex: ["#BTP", "#ConducteurDeTravaux", ...]

  // Section 2 — Entreprise
  entrepriseTexte: string;     // commence par "le CabRH, cabinet de recrutement..."

  // Section 3 — Détail du poste
  detailPoste: {
    missions: string[];
    conditions: {
      remuneration: string;
      avantages: string;
      encadrement: string;
    };
    typesChantiersListe: string[];
  };

  // Section 4 — Profil recherché
  profilRecherche: {
    competences: string[];
    habilitations: string[];
    qualites: string[];
  };

  // Section 5 — Informations complémentaires
  informationsComplementaires: {
    contrat: string;
    localisation: string;
    reference: string;
    autresInfos: string;
  };

  dateGeneration: string;
}

export async function generateAnnonce(input: AnnonceInput): Promise<AnnonceGeneree> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Tu es un expert en recrutement pour le cabinet le CabRH, spécialisé dans les secteurs du BTP, du génie civil et des travaux publics.
À partir des informations brutes ci-dessous, génère une annonce de recrutement structurée en 5 sections.

RÈGLE FONDAMENTALE — ANONYMAT CLIENT : Le nom de la structure cliente (raison sociale, enseigne, marque) ne doit JAMAIS apparaître dans l'annonce générée, quelle que soit la section. Seuls le secteur d'activité, la taille, la région géographique et les spécialités métier peuvent être mentionnés.

INFORMATIONS FOURNIES :
---
Intitulé : ${input.intitule || "Non précisé"}
Contrat : ${input.contrat || "Non précisé"}
Localisation : ${input.localisation || "Non précisé"}
Référence : ${input.reference || "Non précisé"}
Rémunération : ${input.remuneration || "Non précisé"}
Avantages / Primes : ${input.primeGD || "Non précisé"}
Encadrement : ${input.encadrement || "Non précisé"}
Description entreprise : ${input.descriptionEntreprise || "Non précisé"}
Types de chantiers / secteurs : ${input.typesChantiersRaw || "Non précisé"}
Compétences : ${input.competences || "Non précisé"}
Habilitations : ${input.habilitations || "Non précisé"}
Qualités humaines : ${input.qualitesHumaines || "Non précisé"}
Infos complémentaires : ${input.infosComplementaires || ""}
---
${input.fichePosteTexte ? `
FICHE DE POSTE CLIENT (document fourni — extrais-en les informations manquantes) :
---
${input.fichePosteTexte.slice(0, 5000)}
---
` : ""}${input.infosClient ? `
INFORMATIONS COMPLÉMENTAIRES CLIENT :
---
${input.infosClient}
---
` : ""}
CONSIGNES PAR SECTION :

1. **descriptionCourte** : phrase d'accroche percutante, 180 caractères maximum (sans les hashtags), idéale pour LinkedIn ou un job board. Valorise le poste et le secteur.

2. **hashtags** : liste de 6 à 10 hashtags pertinents liés au poste, au secteur, aux compétences. Format sans #, ex: ["BTP", "ConducteurDeTravaux", "Recrutement"]. Mélange hashtags métier + secteur + généralistes.

3. **entrepriseTexte** : commence OBLIGATOIREMENT par "le CabRH, cabinet de recrutement et d'approche directe, recrute pour son client " puis décrit l'entreprise cliente en 3-4 phrases valorisantes (secteur, taille, positionnement, culture). Max 80 mots.
   RÈGLE ABSOLUE : ne jamais mentionner le nom de la structure cliente, ni dans cette section ni dans aucune autre. Le nom de l'entreprise cliente doit rester strictement confidentiel. Tu peux mentionner le secteur d'activité, la taille, la région, les spécialités — mais jamais la raison sociale ou l'enseigne.

4. **detailPoste** :
   - missions : liste de 6 à 8 missions clés, verbes à l'infinitif, courtes et concrètes
   - conditions.remuneration : reformule proprement
   - conditions.avantages : reformule proprement (prime, véhicule, etc.)
   - conditions.encadrement : reformule proprement
   - typesChantiersListe : extrais les types de chantiers/secteurs sous forme de tags courts (2-4 mots max)

5. **profilRecherche** :
   - competences : 4-7 compétences techniques reformulées
   - habilitations : liste des certifications (tableau vide si aucune)
   - qualites : 3-5 qualités humaines reformulées

6. **informationsComplementaires** :
   - contrat : reformule proprement
   - localisation : reformule proprement
   - reference : tel quel
   - autresInfos : synthèse courte d'infos utiles non couvertes ailleurs (mobilité, déplacements, prise de poste, process de recrutement…). Max 2 phrases. Vide si rien à ajouter.

Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte avant ou après :
{
  "descriptionCourte": "...",
  "hashtags": ["...", "..."],
  "entrepriseTexte": "le CabRH, cabinet de recrutement et d'approche directe, recrute pour son client ...",
  "detailPoste": {
    "missions": ["...", "..."],
    "conditions": {
      "remuneration": "...",
      "avantages": "...",
      "encadrement": "..."
    },
    "typesChantiersListe": ["...", "..."]
  },
  "profilRecherche": {
    "competences": ["...", "..."],
    "habilitations": ["...", "..."],
    "qualites": ["...", "..."]
  },
  "informationsComplementaires": {
    "contrat": "...",
    "localisation": "...",
    "reference": "...",
    "autresInfos": "..."
  }
}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-0",
    max_tokens: 2500,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "{}";
  const jsonStr = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  const p = JSON.parse(jsonStr);

  const dateGeneration = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return {
    input,
    descriptionCourte: p.descriptionCourte || "",
    hashtags: p.hashtags || [],
    entrepriseTexte: p.entrepriseTexte || "",
    detailPoste: {
      missions: p.detailPoste?.missions || [],
      conditions: {
        remuneration: p.detailPoste?.conditions?.remuneration || input.remuneration,
        avantages:    p.detailPoste?.conditions?.avantages    || input.primeGD,
        encadrement:  p.detailPoste?.conditions?.encadrement  || input.encadrement,
      },
      typesChantiersListe: p.detailPoste?.typesChantiersListe || [],
    },
    profilRecherche: {
      competences:  p.profilRecherche?.competences  || [],
      habilitations: p.profilRecherche?.habilitations || [],
      qualites:     p.profilRecherche?.qualites      || [],
    },
    informationsComplementaires: {
      contrat:      p.informationsComplementaires?.contrat      || input.contrat,
      localisation: p.informationsComplementaires?.localisation || input.localisation,
      reference:    p.informationsComplementaires?.reference    || input.reference,
      autresInfos:  p.informationsComplementaires?.autresInfos  || "",
    },
    dateGeneration,
  };
}
