import http from "node:http";

const port = Number.parseInt(process.env.PORT || "8080", 10);

const server = http.createServer((req, res) => {
  if (req.url === "/healthz") {
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    res.end("ok");
    return;
  }

  res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
  res.end("prism-worker placeholder\n");
});

server.listen(port, () => {
  console.log(`prism-worker listening on :${port}`);
});

// Placeholder loop. Real queue processing added in Epic 3 (BullMQ).
setInterval(() => {
  console.log("prism-worker heartbeat");
}, 60_000);

