import Anthropic from "@anthropic-ai/sdk";

export interface CandidatInfo {
  nom: string;
  prenom: string;
  poste: string;
  residence: string;
  nationalite: string;
  formation: string;
  experience: string;
  competences: string;
  salaireMarchePoste: string;
  disponibiliteEntretien: string;
  disponibiliteDemarrage: string;
}

export interface CompteRendu {
  candidat: CandidatInfo;
  dateGeneration: string;
  fichePosteFournie: boolean; // indique si une fiche de poste a été utilisée
}

const SYSTEM_PROMPT = `Tu es un consultant RH senior du cabinet le CabRH.
À partir du texte brut d'un CV, tu extrais les informations structurées du candidat pour rédiger un compte rendu d'entretien professionnel.
Tu réponds UNIQUEMENT en JSON valide, sans texte avant ou après.`;

const USER_PROMPT = (cvText: string, fichePoste?: string) => `Voici le texte brut d'un CV :

---
${cvText}
---
${fichePoste ? `
Et voici la fiche de poste / description du poste ciblé par le candidat :

---
${fichePoste.slice(0, 4000)}
---

IMPORTANT : Utilise cette fiche de poste pour :
- Adapter la rédaction de l'expérience en mettant en avant ce qui correspond aux exigences du poste
- Rédiger les compétences en ciblant celles recherchées dans l'offre
- Identifier les points forts ET les éventuels écarts du candidat par rapport au poste
- Estimer le salaire marché en lien avec ce poste précis et cette localisation
` : ""}

Génère un compte rendu d'entretien au format JSON suivant. Respecte scrupuleusement ces règles :

1. **nom / prenom** : nom et prénom du candidat tels qu'ils apparaissent.
2. **poste** : intitulé du poste visé${fichePoste ? " (utilise l'intitulé exact de la fiche de poste si cohérent)" : " ou du dernier poste occupé si non précisé"}.
3. **residence** : ville et pays de résidence du candidat (ex: "Paris, France"). Écris "Non précisée" si absent.
4. **nationalite** : nationalité du candidat. Si non mentionnée, mets "Française".
5. **formation** : liste des diplômes avec établissement et année d'obtention, du plus récent au plus ancien. Format : "Diplôme - Établissement (Année)".
6. **experience** : rédige un texte en prose de 5 à 8 phrases, DES EXPÉRIENCES LES PLUS ANCIENNES AUX PLUS RÉCENTES. ${fichePoste ? "Met en avant les expériences les plus pertinentes pour le poste ciblé." : "Valorise le parcours du candidat en lien avec le poste visé."} Mentionne les responsabilités clés, les secteurs, les évolutions. Sois professionnel et engageant.
7. **competences** : résumé en 3 à 5 phrases des compétences clefs développées${fichePoste ? ", en priorité celles qui correspondent aux exigences de la fiche de poste" : " (techniques, outils, soft skills)"}.
8. **salaireMarchePoste** : salaire MOYEN DU MARCHÉ pour ${fichePoste ? "ce poste précis selon la fiche fournie" : "le type de poste visé"}. Format : "Entre X et Y k€ brut annuel".
9. **disponibiliteEntretien** : disponibilité pour un entretien telle qu'indiquée dans le CV, ou "Immédiate" si non précisée.
10. **disponibiliteDemarrage** : disponibilité pour un démarrage telle qu'indiquée dans le CV, ou "À définir" si non précisée.

Réponds uniquement avec ce JSON :

{
  "candidat": {
    "nom": "...",
    "prenom": "...",
    "poste": "...",
    "residence": "...",
    "nationalite": "...",
    "formation": "...",
    "experience": "...",
    "competences": "...",
    "salaireMarchePoste": "...",
    "disponibiliteEntretien": "...",
    "disponibiliteDemarrage": "..."
  }
}`;

export async function generateCompteRendu(
  cvText: string,
  fichePoste?: string
): Promise<CompteRendu> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-0",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: USER_PROMPT(cvText, fichePoste) }],
  });

  const response = await stream.finalMessage();

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Aucune réponse textuelle reçue de Claude");
  }

  let jsonText = textBlock.text.trim();
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```json?\n?/, "").replace(/\n?```$/, "").trim();
  }

  let parsed: { candidat: CandidatInfo };
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(`Impossible de parser la réponse de Claude : ${jsonText.slice(0, 200)}`);
  }

  return {
    candidat: parsed.candidat,
    fichePosteFournie: !!fichePoste,
    dateGeneration: new Date().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
  };
}
