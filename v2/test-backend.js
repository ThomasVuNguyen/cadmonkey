const STREAM_URL = "https://thomas-15--cadmonkey-chat-chat-stream.modal.run";

async function testBackend() {
    console.log("Testing backend:", STREAM_URL);
    try {
        const response = await fetch(STREAM_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: "a cube" }),
        });

        if (!response.ok) {
            console.error("Backend response error:", response.status, response.statusText);
        } else {
            console.log("Backend response OK:", response.status);
            const text = await response.text();
            console.log("Response length:", text.length);
            console.log("Preview:", text.substring(0, 100));
        }
    } catch (err) {
        console.error("Backend fetch failed:", err);
    }
}

testBackend();
