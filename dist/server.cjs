var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var aiClient = null;
function getGeminiClient() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new import_genai.GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
    } catch (err) {
      console.warn("Failed to instantiate GoogleGenAI:", err);
    }
  }
  return aiClient;
}
var OFFLINE_ANNOUNCEMENTS = [
  "Wusstest du, dass K\xFChe beste Freunde haben und traurig werden, wenn sie getrennt sind?",
  "Warum tragen Bienen K\xE4mme? Weil sie so viele Waben haben!",
  "Lustiger Fakt: Bananen sind ganz leicht radioaktiv, aber du m\xFCsstest 10 Millionen auf einmal essen, um ein Superheld zu werden!",
  "Sind wir schon da? Noch nicht ganz, aber unser Auto f\xE4hrt gerade schneller als ein Gepard bergab!",
  "Warum konnte der Teddyb\xE4r keinen Nachtisch mehr essen? Weil er schon komplett aus gestopft war!",
  "Spannender Fakt \xFCber unseren n\xE4chsten Halt: Hier gibt es das leckerste Riesen-Eis am Stra\xDFenrand!",
  "Warum kann man Atomen nicht vertrauen? Weil sie einfach alles ausmachen!",
  "Wusstest du, dass Seeotter beim Schlafen H\xE4ndchen halten, damit sie nicht wegtreiben?",
  "Wie nennt man einen dicken Schriftsteller? Ein Schwergewicht der Literatur!",
  "Lustiger Fakt: Flamingos sind nur rosa, weil sie so viele kleine Krebse und Garnelen fressen!",
  "Warum schl\xE4ft das Fahrrad an der Wand? Weil es einfach zu m\xFCde war!",
  "Wusstest du, dass Katzen S\xFC\xDFes gar nicht schmecken k\xF6nnen? Das hei\xDFt: Mehr Eis f\xFCr dich!",
  "Wie nennt man einen schlafenden Stier? Eine Rinder-Matratze!",
  "Auto-Regel Nr. 1: Den K\xFChen auf der Wiese zu winken bringt 100% mehr Gl\xFCck auf der Fahrt!",
  "Warum war das Mathebuch so traurig? Weil es einfach zu viele Probleme hatte!",
  "Wusstest du, dass Faultiere unter Wasser l\xE4nger die Luft anhalten k\xF6nnen als Delphine?",
  "Wie nennt man einen sauberen Saurier? Einen Picobello-Saurus!",
  "Lustiger Fakt: Wombat-Kot ist perfekt w\xFCrfelf\xF6rmig, damit er auf H\xFCgeln nicht wegrollt!",
  "Schau mal aus dem Fenster! Die B\xE4ume winken uns zu, w\xE4hrend wir vorbeifahren!"
];
app.post("/api/announcement", async (req, res) => {
  try {
    const { nextPlace, destination, type } = req.body;
    const ai = getGeminiClient();
    if (ai) {
      const prompt = `Erstelle GENAU EINEN kurzen Satz auf Deutsch f\xFCr ein Kind auf einer Autoreise (Roadtrip).
Fokus: ${type === "fact" ? "Interessanter Ort-Fakt oder \xFCberraschender Fakt" : "Lustiger Kinderwitz oder witziger Spruch"}.
N\xE4chster Ort in der N\xE4he: ${nextPlace || "der n\xE4chste Ort"}.
Reiseziel: ${destination || "unser Zielort"}.
Richtlinien: MUSS genau EIN Satz auf Deutsch sein (maximal 20 W\xF6rter). Sehr lustig, kindgerecht (5-12 Jahre), klingt wie ein begeisterter Kinder-Radio-Moderator. Keine Anf\xFChrungszeichen um den Text.`;
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          temperature: 0.9
        }
      });
      const text = response.text?.trim();
      if (text) {
        return res.json({ text, source: "ai" });
      }
    }
  } catch (error) {
    const isQuotaErr = error?.status === 429 || String(error).includes("quota") || String(error).includes("429");
    if (!isQuotaErr) {
      console.log("Announcement AI fallback used:", error?.message || error);
    }
  }
  const randomIndex = Math.floor(Math.random() * OFFLINE_ANNOUNCEMENTS.length);
  return res.json({ text: OFFLINE_ANNOUNCEMENTS[randomIndex], source: "offline" });
});
app.post("/api/leo-assistant", async (req, res) => {
  try {
    const { message, tripInfo } = req.body;
    const ai = getGeminiClient();
    if (ai) {
      const systemPrompt = `Du bist "Leo", ein fr\xF6hlicher, sehr schlauer und lustiger L\xF6we / Kinder-Auto-Assistent auf einer Urlaubs-Autofahrt!
Du sprichst direkt mit Kindern im Auto auf Deutsch.
Aktuelle Fahrt-Infos:
- Ziel: ${tripInfo?.destination || "ein tolles Urlaubsziel"}
- Noch verbleibend: ca. ${tripInfo?.remainingMiles || "ein paar"} km
- Fahrzeug: ${tripInfo?.vehicleName || "unser Auto"}

Richtlinien:
- Antworte immer auf DEUTSCH.
- Sei freundlich, begeistert, hilfsbereit und voller Humors (1-3 kurze S\xE4tze).
- Wenn das Kind Witze, Fragen \xFCber Tiere, das Ziel, Spiele oder die Fahrt stellt, antworte pr\xE4zise und lustig.
- Verwende gelegentlich passende Emojis (\u{1F981}, \u{1F697}, \u2B50\uFE0F, \u{1F389}, \u{1F366}).
- Keine lange Belehrung, kurz und knapp f\xFCr Kinder.`;
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `${systemPrompt}

Kind fragt: "${message}"`,
        config: {
          temperature: 0.8
        }
      });
      const reply = response.text?.trim();
      if (reply) {
        return res.json({ reply, source: "ai" });
      }
    }
  } catch (error) {
    const isQuotaErr = error?.status === 429 || String(error).includes("quota") || String(error).includes("429");
    if (!isQuotaErr) {
      console.log("Leo Assistant AI fallback used:", error?.message || error);
    }
  }
  const lowerMsg = (req.body.message || "").toLowerCase();
  let fallbackReply = "Hallo! Ich bin Leo, dein Reise-L\xF6we! Wir fahren zusammen an ein super Ziel! \u{1F981}\u{1F697}";
  if (lowerMsg.includes("witz") || lowerMsg.includes("lustig")) {
    fallbackReply = "Warum tragen Bienen K\xE4mme? Weil sie so viele Waben haben! Haha! \u{1F41D}\u{1F981}";
  } else if (lowerMsg.includes("da") || lowerMsg.includes("dauert") || lowerMsg.includes("zeit")) {
    fallbackReply = `Wir sind schon gut unterwegs! Nicht mehr lange, dann sind wir da! \u{1F3C1}`;
  } else if (lowerMsg.includes("wer bist du")) {
    fallbackReply = "Ich bin Leo, dein Schlauer Co-Pilot & Reise-L\xF6we! Du kannst mich alles fragen! \u{1F981}\u2728";
  } else if (lowerMsg.includes("hunger") || lowerMsg.includes("essen") || lowerMsg.includes("eis")) {
    fallbackReply = "Mmmmh, Eis! Ausschau halten nach der n\xE4chsten Rastst\xE4tte f\xFCr ein Rieseneis! \u{1F366}\u{1F60B}";
  }
  return res.json({ reply: fallbackReply, source: "offline" });
});
var FAMOUS_DESTINATIONS = {
  "disneyland": { lat: 33.8121, lng: -117.919, name: "Disneyland, Anaheim", stateOrCountry: "Kalifornien", funFact: "Zuhause von Micky Maus und leckeren warmen Churros!" },
  "europapark": { lat: 48.2689, lng: 7.7217, name: "Europa-Park Rust", stateOrCountry: "Deutschland", funFact: "Deutschlands gr\xF6\xDFter Freizeitpark mit spektakul\xE4ren Achterbahnen!" },
  "neuschwanstein": { lat: 47.5576, lng: 10.7498, name: "Schloss Neuschwanstein", stateOrCountry: "Bayern", funFact: "Das echte M\xE4rchenschloss, das als Vorbild f\xFCr Disney diente!" },
  "berlin": { lat: 52.52, lng: 13.405, name: "Berlin (Fernsehturm)", stateOrCountry: "Deutschland", funFact: "Der Berliner Fernsehturm ist 368 Meter hoch und hat eine drehbare Kugel!" },
  "m\xFCnchen": { lat: 48.1351, lng: 11.582, name: "M\xFCnchen (Englischer Garten)", stateOrCountry: "Bayern", funFact: "Hier surfen die Leute mitten in der Stadt auf der Eisbach-Welle!" },
  "hamburg": { lat: 53.5511, lng: 9.9937, name: "Hamburg (Speicherstadt)", stateOrCountry: "Deutschland", funFact: "Hamburg hat mehr Br\xFCcken als Venedig und Amsterdam zusammen!" },
  "alpen": { lat: 47.5667, lng: 12, name: "Alpen (Zugspitze)", stateOrCountry: "Deutschland / \xD6sterreich", funFact: "Der h\xF6chste Berg Deutschlands mit Schnee sogar im Sommer!" },
  "nordsee": { lat: 54.3, lng: 8.5, name: "Nordsee & Watt", stateOrCountry: "Deutschland", funFact: "Bei Ebbe kannst du mitten auf dem Meeresboden spazieren gehen!" },
  "paris": { lat: 48.8566, lng: 2.3522, name: "Paris (Eiffelturm)", stateOrCountry: "Frankreich", funFact: "Der Eiffelturm wird im Sommer bis zu 15 cm h\xF6her, weil sich Metall bei Hitze ausdehnt!" },
  "wien": { lat: 48.2082, lng: 16.3738, name: "Wien (Prater)", stateOrCountry: "\xD6sterreich", funFact: "Das Riesenrad im Prater dreht sich schon seit \xFCber 120 Jahren!" },
  "oma": { lat: 50.1109, lng: 8.6821, name: "Omas Keks-Haus", stateOrCountry: "Sonnental", funFact: "Ber\xFChmt f\xFCr unendlich viele Schokokekse und warme Umarmungen!" }
};
app.get("/api/search-place", async (req, res) => {
  const query = (req.query.q || "").trim().toLowerCase();
  if (!query) {
    return res.json({ results: [] });
  }
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
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=4`;
    const apiRes = await fetch(nomUrl, {
      headers: { "User-Agent": "iPadKidRoadTripApp/1.0" }
    });
    if (apiRes.ok) {
      const data = await apiRes.json();
      const formatted = data.map((item) => ({
        name: item.display_name.split(",")[0],
        stateOrCountry: item.display_name.split(",").slice(1, 3).join(",").trim(),
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        funFact: `Awesome destination! Get ready for a thrilling adventure to ${item.display_name.split(",")[0]}!`
      }));
      if (formatted.length > 0) {
        return res.json({ results: formatted });
      }
    }
  } catch (err) {
    console.warn("Nominatim search offline or failed:", err);
  }
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
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`iPad Driving App for Kids running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
