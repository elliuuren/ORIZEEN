export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ── Bitly URL Shortener ──────────────────────
    if (request.method === "POST" && url.pathname === "/api/shorten") {
      try {
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
      } catch (e) {
        return Response.json({ short: null, error: e.message }, { status: 500 });
      }
    }

    // ── Buffer Poster ────────────────────────────
    if (request.method === "POST" && url.pathname === "/api/post") {
      try {
        const { caption, image_url, channelIds } = await request.json();
        const results = [];
        for (const channelId of channelIds) {
          const res = await fetch("https://api.buffer.com", {
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
          const data = await res.json();
          results.push({ channelId, data });
        }
        return Response.json({ success: true, results });
      } catch (e) {
        return Response.json({ success: false, error: e.message }, { status: 500 });
      }
    }

    // ── Serve static assets ──────────────────────
    return env.ASSETS.fetch(request);
  }
};
