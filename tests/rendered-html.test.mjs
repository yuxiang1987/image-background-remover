import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("static export contains the finished product page", async () => {
  const html = await readFile(new URL("../out/index.html", import.meta.url), "utf8");
  assert.match(html, /Free Image Background Remover/);
  assert.match(html, /Drop your image here/);
  assert.match(html, /How it works/);
  assert.doesNotMatch(html, /codex-preview/);
});
