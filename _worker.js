export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ── Bitly URL Shortener ──────────────────────
    if (request.method === "POST" && url.pathname === "/api/shorten") {
      const { url: longUrl } = await request.json();
      const bitlyRes = await fetch("https://api-ssl.bitly.com/v4/shorten", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.BITLY_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ long_url: longUrl })
      });
      const data = await bitlyRes.json();
      return Response.json({ short: data.link || longUrl });
    }

    // ── Buffer Poster ────────────────────────────
    if (request.method === "POST" && url.pathname === "/api/post") {
      const { caption, image_url, channelIds } = await request.json();
      for (const channelId of channelIds) {
        await fetch("https://api.buffer.com", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.BUFFER_KEY}`
          },
          body: JSON.stringify({
            query: `
              mutation {
                createPost(input: {
                  text: ${JSON.stringify(caption)},
                  channelId: "${channelId}",
                  schedulingType: automatic,
                  mode: now,
                  assets: [{ url: ${JSON.stringify(image_url)}, type: image }]
                }) {
                  ... on PostActionSuccess { post { id } }
                  ... on MutationError { message }
                }
              }
            `
          })
        });
      }
      return new Response("OK", { status: 200 });
    }

    // with this:
return env.ASSETS.fetch(request);
  }
};
