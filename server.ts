import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini lazily if API key exists
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch (err) {
      console.warn("Failed to instantiate GoogleGenAI:", err);
    }
  }
  return aiClient;
}

// Fallback bank of offline jokes and fun facts for kids (in German)
const OFFLINE_ANNOUNCEMENTS = [
  "Wusstest du, dass Kühe beste Freunde haben und traurig werden, wenn sie getrennt sind?",
  "Warum tragen Bienen Kämme? Weil sie so viele Waben haben!",
  "Lustiger Fakt: Bananen sind ganz leicht radioaktiv, aber du müsstest 10 Millionen auf einmal essen, um ein Superheld zu werden!",
  "Sind wir schon da? Noch nicht ganz, aber unser Auto fährt gerade schneller als ein Gepard bergab!",
  "Warum konnte der Teddybär keinen Nachtisch mehr essen? Weil er schon komplett aus gestopft war!",
  "Spannender Fakt über unseren nächsten Halt: Hier gibt es das leckerste Riesen-Eis am Straßenrand!",
  "Warum kann man Atomen nicht vertrauen? Weil sie einfach alles ausmachen!",
  "Wusstest du, dass Seeotter beim Schlafen Händchen halten, damit sie nicht wegtreiben?",
  "Wie nennt man einen dicken Schriftsteller? Ein Schwergewicht der Literatur!",
  "Lustiger Fakt: Flamingos sind nur rosa, weil sie so viele kleine Krebse und Garnelen fressen!",
  "Warum schläft das Fahrrad an der Wand? Weil es einfach zu müde war!",
  "Wusstest du, dass Katzen Süßes gar nicht schmecken können? Das heißt: Mehr Eis für dich!",
  "Wie nennt man einen schlafenden Stier? Eine Rinder-Matratze!",
  "Auto-Regel Nr. 1: Den Kühen auf der Wiese zu winken bringt 100% mehr Glück auf der Fahrt!",
  "Warum war das Mathebuch so traurig? Weil es einfach zu viele Probleme hatte!",
  "Wusstest du, dass Faultiere unter Wasser länger die Luft anhalten können als Delphine?",
  "Wie nennt man einen sauberen Saurier? Einen Picobello-Saurus!",
  "Lustiger Fakt: Wombat-Kot ist perfekt würfelförmig, damit er auf Hügeln nicht wegrollt!",
  "Schau mal aus dem Fenster! Die Bäume winken uns zu, während wir vorbeifahren!"
];

// API Route for Kid Road Trip Announcements
app.post("/api/announcement", async (req, res) => {
  try {
    const { nextPlace, destination, type } = req.body;
    const ai = getGeminiClient();

    if (ai) {
      const prompt = `Erstelle GENAU EINEN kurzen Satz auf Deutsch für ein Kind auf einer Autoreise (Roadtrip).
Fokus: ${type === 'fact' ? 'Interessanter Ort-Fakt oder überraschender Fakt' : 'Lustiger Kinderwitz oder witziger Spruch'}.
Nächster Ort in der Nähe: ${nextPlace || "der nächste Ort"}.
Reiseziel: ${destination || "unser Zielort"}.
Richtlinien: MUSS genau EIN Satz auf Deutsch sein (maximal 20 Wörter). Sehr lustig, kindgerecht (5-12 Jahre), klingt wie ein begeisterter Kinder-Radio-Moderator. Keine Anführungszeichen um den Text.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          temperature: 0.9,
        },
      });

      const text = response.text?.trim();
      if (text) {
        return res.json({ text, source: "ai" });
      }
    }
  } catch (error: any) {
    const isQuotaErr = error?.status === 429 || String(error).includes("quota") || String(error).includes("429");
    if (!isQuotaErr) {
      console.log("Announcement AI fallback used:", error?.message || error);
    }
  }

  // Fallback if AI is offline or quota limit reached
  const randomIndex = Math.floor(Math.random() * OFFLINE_ANNOUNCEMENTS.length);
  return res.json({ text: OFFLINE_ANNOUNCEMENTS[randomIndex], source: "offline" });
});

// API Route for Leo AI Backseat Assistant
app.post("/api/leo-assistant", async (req, res) => {
  try {
    const { message, tripInfo } = req.body;
    const ai = getGeminiClient();

    if (ai) {
      const systemPrompt = `Du bist "Leo", ein fröhlicher, sehr schlauer und lustiger Löwe / Kinder-Auto-Assistent auf einer Urlaubs-Autofahrt!
Du sprichst direkt mit Kindern im Auto auf Deutsch.
Aktuelle Fahrt-Infos:
- Ziel: ${tripInfo?.destination || "ein tolles Urlaubsziel"}
- Noch verbleibend: ca. ${tripInfo?.remainingMiles || "ein paar"} km
- Fahrzeug: ${tripInfo?.vehicleName || "unser Auto"}

Richtlinien:
- Antworte immer auf DEUTSCH.
- Sei freundlich, begeistert, hilfsbereit und voller Humors (1-3 kurze Sätze).
- Wenn das Kind Witze, Fragen über Tiere, das Ziel, Spiele oder die Fahrt stellt, antworte präzise und lustig.
- Verwende gelegentlich passende Emojis (🦁, 🚗, ⭐️, 🎉, 🍦).
- Keine lange Belehrung, kurz und knapp für Kinder.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `${systemPrompt}\n\nKind fragt: "${message}"`,
        config: {
          temperature: 0.8,
        },
      });

      const reply = response.text?.trim();
      if (reply) {
        return res.json({ reply, source: "ai" });
      }
    }
  } catch (error: any) {
    const isQuotaErr = error?.status === 429 || String(error).includes("quota") || String(error).includes("429");
    if (!isQuotaErr) {
      console.log("Leo Assistant AI fallback used:", error?.message || error);
    }
  }

  // Fallback offline responses for Leo
  const lowerMsg = (req.body.message || "").toLowerCase();
  let fallbackReply = "Hallo! Ich bin Leo, dein Reise-Löwe! Wir fahren zusammen an ein super Ziel! 🦁🚗";

  if (lowerMsg.includes("witz") || lowerMsg.includes("lustig")) {
    fallbackReply = "Warum tragen Bienen Kämme? Weil sie so viele Waben haben! Haha! 🐝🦁";
  } else if (lowerMsg.includes("da") || lowerMsg.includes("dauert") || lowerMsg.includes("zeit")) {
    fallbackReply = `Wir sind schon gut unterwegs! Nicht mehr lange, dann sind wir da! 🏁`;
  } else if (lowerMsg.includes("wer bist du")) {
    fallbackReply = "Ich bin Leo, dein Schlauer Co-Pilot & Reise-Löwe! Du kannst mich alles fragen! 🦁✨";
  } else if (lowerMsg.includes("hunger") || lowerMsg.includes("essen") || lowerMsg.includes("eis")) {
    fallbackReply = "Mmmmh, Eis! Ausschau halten nach der nächsten Raststätte für ein Rieseneis! 🍦😋";
  }

  return res.json({ reply: fallbackReply, source: "offline" });
});

// Geocoding helper route with offline cache for common famous road trip destinations
const FAMOUS_DESTINATIONS: Record<string, { lat: number; lng: number; name: string; stateOrCountry: string; funFact: string }> = {
  "disneyland": { lat: 33.8121, lng: -117.9190, name: "Disneyland, Anaheim", stateOrCountry: "Kalifornien", funFact: "Zuhause von Micky Maus und leckeren warmen Churros!" },
  "europapark": { lat: 48.2689, lng: 7.7217, name: "Europa-Park Rust", stateOrCountry: "Deutschland", funFact: "Deutschlands größter Freizeitpark mit spektakulären Achterbahnen!" },
  "neuschwanstein": { lat: 47.5576, lng: 10.7498, name: "Schloss Neuschwanstein", stateOrCountry: "Bayern", funFact: "Das echte Märchenschloss, das als Vorbild für Disney diente!" },
  "berlin": { lat: 52.5200, lng: 13.4050, name: "Berlin (Fernsehturm)", stateOrCountry: "Deutschland", funFact: "Der Berliner Fernsehturm ist 368 Meter hoch und hat eine drehbare Kugel!" },
  "münchen": { lat: 48.1351, lng: 11.5820, name: "München (Englischer Garten)", stateOrCountry: "Bayern", funFact: "Hier surfen die Leute mitten in der Stadt auf der Eisbach-Welle!" },
  "hamburg": { lat: 53.5511, lng: 9.9937, name: "Hamburg (Speicherstadt)", stateOrCountry: "Deutschland", funFact: "Hamburg hat mehr Brücken als Venedig und Amsterdam zusammen!" },
  "alpen": { lat: 47.5667, lng: 12.0000, name: "Alpen (Zugspitze)", stateOrCountry: "Deutschland / Österreich", funFact: "Der höchste Berg Deutschlands mit Schnee sogar im Sommer!" },
  "nordsee": { lat: 54.3000, lng: 8.5000, name: "Nordsee & Watt", stateOrCountry: "Deutschland", funFact: "Bei Ebbe kannst du mitten auf dem Meeresboden spazieren gehen!" },
  "paris": { lat: 48.8566, lng: 2.3522, name: "Paris (Eiffelturm)", stateOrCountry: "Frankreich", funFact: "Der Eiffelturm wird im Sommer bis zu 15 cm höher, weil sich Metall bei Hitze ausdehnt!" },
  "wien": { lat: 48.2082, lng: 16.3738, name: "Wien (Prater)", stateOrCountry: "Österreich", funFact: "Das Riesenrad im Prater dreht sich schon seit über 120 Jahren!" },
  "oma": { lat: 50.1109, lng: 8.6821, name: "Omas Keks-Haus", stateOrCountry: "Sonnental", funFact: "Berühmt für unendlich viele Schokokekse und warme Umarmungen!" }
};

app.get("/api/search-place", async (req, res) => {
  const query = (req.query.q as string || "").trim().toLowerCase();
  if (!query) {
    return res.json({ results: [] });
  }

  // Check built-in famous places first
  const match = Object.entries(FAMOUS_DESTINATIONS).find(([key]) => key.includes(query) || query.includes(key));
  if (match) {
    return res.json({
      results: [{
        name: match[1].name,
        stateOrCountry: match[1].stateOrCountry,
        lat: match[1].lat,
        lng: match[1].lng,
        funFact: match[1].funFact
      }]
    });
  }

  // Try OpenStreetMap Nominatim for live lookup if online
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=4`;
    const apiRes = await fetch(nomUrl, {
      headers: { "User-Agent": "iPadKidRoadTripApp/1.0" }
    });
    if (apiRes.ok) {
      const data = await apiRes.json();
      const formatted = data.map((item: any) => ({
        name: item.display_name.split(',')[0],
        stateOrCountry: item.display_name.split(',').slice(1, 3).join(',').trim(),
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        funFact: `Awesome destination! Get ready for a thrilling adventure to ${item.display_name.split(',')[0]}!`
      }));
      if (formatted.length > 0) {
        return res.json({ results: formatted });
      }
    }
  } catch (err) {
    console.warn("Nominatim search offline or failed:", err);
  }

  // Fallback default coordinates if offline search misses
  return res.json({
    results: [{
      name: query.charAt(0).toUpperCase() + query.slice(1),
      stateOrCountry: "Road Trip Route",
      lat: 36.1699,
      lng: -115.1398,
      funFact: `Exciting trip ahead to ${query}!`
    }]
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`iPad Driving App for Kids running on http://localhost:${PORT}`);
  });
}

startServer();
