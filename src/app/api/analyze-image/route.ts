import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const maxDuration = 60;

const PROMPT = `Tu analyses une photo d'un tableau blanc de planification de cours de kitesurf/wingfoil.

RÈGLES STRICTES:
1. Chaque ligne correspond à un moniteur et une session.
2. Le nom du moniteur = UNIQUEMENT le premier prénom visible dans la cellule. Ignore les ajouts comme "+Paul" ou "/ Marie".
3. Pour compter les stagiaires : compte UNIQUEMENT les prénoms de personnes (noms français courants).
   IGNORE ABSOLUMENT ces éléments qui ne sont PAS des stagiaires :
   - Niveaux : DEB, WAT, B1, B1+, B3, B3+, J, J+, et toute combinaison de lettres/chiffres/symboles (ex: "B1+", "J+3")
   - La colonne "W" ou tout marqueur "W" — ignore-la complètement, elle ne signifie pas wingfoil
   - Cases vides, tirets, croix
4. L'heure de fin = heure de début + 3h30 (calcule-la toi-même).
5. Discipline : "kite" ou "wing" selon le contexte visible (section du tableau, titre de colonne, etc.).
   Si ambigu, utilise "kite" par défaut.

Retourne UNIQUEMENT ce JSON (aucun texte avant ou après) :
{
  "sessions": [
    {
      "instructor": "prénom principal uniquement",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "studentCount": 0,
      "discipline": "kite"
    }
  ],
  "issues": []
}`;

interface RawSession {
  instructor?: string;
  startTime?: string | null;
  endTime?: string | null;
  studentCount?: number | null;
  discipline?: "kite" | "wing";
}

export async function POST(request: Request) {
  const { image, mimeType = "image/jpeg" } = await request.json();

  if (!image) {
    return Response.json({ error: "Image requise" }, { status: 400 });
  }

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: image,
              },
            },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ error: "Réponse invalide", raw: text }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]) as {
      sessions: RawSession[];
      issues: string[];
    };

    // Normalize sessions
    const sessions = (result.sessions ?? []).map((s) => ({
      instructor: s.instructor ?? "Inconnu",
      startTime: s.startTime ?? "09:00",
      endTime: s.endTime ?? "12:30",
      studentCount: typeof s.studentCount === "number" ? s.studentCount : 0,
      discipline: s.discipline === "wing" ? "wing" : "kite",
    }));

    return Response.json({ sessions, issues: result.issues ?? [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("analyze-image error:", msg);
    return Response.json({ error: `Analyse échouée : ${msg}` }, { status: 500 });
  }
}
