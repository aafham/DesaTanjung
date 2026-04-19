export function createTinyPng(name = "receipt-proof.png") {
  return {
    name,
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9sXx5wAAAABJRU5ErkJggg==",
      "base64",
    ),
  };
}
