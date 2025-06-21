addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

// made by https://t.me/Ashlynn_Repository — updated for Zero Creations
class Chataibot {
  constructor() {
    this.apiUrl = "https://chataibot.ru/api/promo-chat/messages";
    this.headers = {
      "Content-Type": "application/json", 
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
      "Referer": "https://chataibot.ru/app/free-chat",
      "Accept": "application/json"
    };
  }

  async chat({ prompt, messages = [], ...rest }) {
    try {
      const messagesToSend = messages.length
        ? [...messages, { role: "user", content: prompt }]
        : [{ role: "user", content: prompt }];

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          messages: messagesToSend,
          ...rest
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chataibot API error: ${response.status} ${response.statusText}. Response: ${errorText.slice(0, 100)}...`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Expected JSON response, got ${contentType}: ${text.slice(0, 100)}...`);
      }

      const data = await response.json();
      if (!data.answer) {
        return {
          result: "No response content received",
          join: "https://t.me/zerocreations"
        };
      }

      return {
        result: data.answer,
        join: "https://t.me/zerocreations"
      };

    } catch (error) {
      return {
        result: `Failed to retrieve response: ${error.message}`,
        join: "https://t.me/zerocreations"
      };
    }
  }
}

async function handleRequest(request) {
  try {
    let params;
    if (request.method === "GET") {
      const url = new URL(request.url);
      params = {
        prompt: url.searchParams.get("question"),
        messages: url.searchParams.get("messages")
          ? JSON.parse(url.searchParams.get("messages"))
          : []
      };
    } else if (request.method === "POST") {
      const contentType = request.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        return new Response(JSON.stringify({ error: "Content-Type must be application/json" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      params = await request.json();
    } else {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!params.prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const api = new Chataibot();
    const response = await api.chat(params);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message || "Internal Server Error",
      join: "https://t.me/zerocreations"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
