import { getStore } from "@netlify/blobs";

// This function backs the mahjong scorekeeper's online sync.
// It stores one JSON blob per game code in a Netlify Blobs store
// called "mahjong-games". No database or external service needed --
// Netlify Blobs is built into your Netlify site once functions are enabled.
//
// GET  /api/game?code=ABC123   -> returns the saved game state (404 if none)
// POST /api/game?code=ABC123   -> saves the game state (body = JSON state)

export default async (req, context) => {
  const url = new URL(req.url);
  const rawCode = url.searchParams.get("code") || "";
  const code = rawCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);

  if (!code) {
    return new Response(JSON.stringify({ error: "Missing or invalid game code" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const store = getStore("mahjong-games");

  if (req.method === "GET") {
    const data = await store.get(code, { type: "json" });
    if (!data) {
      return new Response(JSON.stringify({ error: "Game not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    await store.setJSON(code, body);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config = {
  path: "/api/game"
};
