import Anthropic from "@anthropic-ai/sdk";

export interface CVAnonymise {
  // Contenu nettoyé — sans aucune donnée personnelle
  titreProfessionnel: string;
  profil: string;          // résumé/accroche si présent
  formations: {
    diplome: string;
    etablissement: string;
    annee: string;
  }[];
  experiences: {
    intitule: string;
    entreprise: string;   // on garde l'entreprise (pas une donnée perso)
    periode: string;
    missions: string[];
  }[];
  competences: string[];
  langues: string[];
  logiciels: string[];
  certifications: string[];
  autresInfos: string;     // autres éléments utiles non classés
}

const SYSTEM = `Tu es un assistant RH du cabinet le CabRH.
Tu analyses des CV et tu extrais leur contenu en supprimant TOUTES les données personnelles identifiantes.
Tu réponds UNIQUEMENT en JSON valide, sans texte avant ou après.`;

const PROMPT = (cvText: string) => `Voici le texte brut d'un CV :

---
${cvText}
---

Analyse ce CV et retourne un JSON structuré en supprimant OBLIGATOIREMENT et INTÉGRALEMENT :
- Le nom et le prénom du candidat (remplace par rien, n'indique pas "Nom supprimé")
- L'adresse complète (rue, ville, code postal, pays)
- Le numéro de téléphone
- L'adresse email
- Les liens LinkedIn, GitHub, portfolio personnels, ou tout autre URL personnelle
- La date de naissance, l'âge, la photo

Conserve tout le reste : formations, expériences, compétences, langues, logiciels, certifications.

Pour les expériences : garde le nom de l'entreprise et le poste occupé (ce ne sont pas des données personnelles du candidat).
Pour la période des expériences : garde les années (ex: "2019 – 2022") mais supprime les mois si seuls ils permettent d'identifier.

Retourne ce JSON :
{
  "titreProfessionnel": "ex: Conducteur de Travaux VRD | Ingénieur BTP | ...",
  "profil": "texte de l'accroche ou résumé si présent, sinon chaîne vide",
  "formations": [
    { "diplome": "...", "etablissement": "...", "annee": "..." }
  ],
  "experiences": [
    {
      "intitule": "Intitulé du poste",
      "entreprise": "Nom de l'entreprise",
      "periode": "2019 – 2022",
      "missions": ["Mission 1", "Mission 2"]
    }
  ],
  "competences": ["...", "..."],
  "langues": ["Français (natif)", "Anglais (courant)", "..."],
  "logiciels": ["AutoCAD", "Excel", "..."],
  "certifications": ["AIPR", "CACES R482", "..."],
  "autresInfos": "Toute autre information utile non classée (permis B, mobilité, etc.)"
}`;

export async function anonymiserCV(cvText: string): Promise<CVAnonymise> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: "claude-sonnet-4-0",
    max_tokens: 4096,
    system: SYSTEM,
    messages: [{ role: "user", content: PROMPT(cvText) }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("Pas de réponse de Claude");

  let json = textBlock.text.trim().replace(/^```json?\n?/i, "").replace(/\n?```$/i, "").trim();

  try {
    return JSON.parse(json) as CVAnonymise;
  } catch {
    throw new Error(`Erreur de parsing JSON : ${json.slice(0, 200)}`);
  }
}
