8
async function testStatic() {
    const url = "http://localhost:3000/libraries/openscad.zip";
    console.log("Fetching:", url);
    try {
        const res = await fetch(url);
        console.log("Status:", res.status);
        console.log("Type:", res.headers.get("content-type"));
        console.log("Length:", res.headers.get("content-length"));
        if (res.ok) {
            const buffer = await res.arrayBuffer();
            console.log("Buffer size:", buffer.byteLength);
            const header = new Uint8Array(buffer.slice(0, 4));
            console.log("Header:", header); // Should be PK.. (50 4B 03 04)
        }
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}
testStatic();
