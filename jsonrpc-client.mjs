#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { createConnection } from "node:net";

const values = {};
for (let index = 2; index < process.argv.length; index += 2) {
  const flag = process.argv[index];
  const value = process.argv[index + 1];
  if (!["--goal", "--session-id"].includes(flag) || value === undefined) throw new Error("usage: rook-benchmark-jsonrpc --goal <text> --session-id <id>");
  values[flag] = value;
}
if (typeof values["--goal"] !== "string" || !values["--session-id"]) throw new Error("goal and session id are required");
const host = process.env.ROOK_BENCHMARK_TOOL_HOST;
const port = Number(process.env.ROOK_BENCHMARK_TOOL_PORT);
if (!/^rook-target-[a-f0-9]{12}$/.test(host ?? "") || !Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error("trusted JSON-RPC endpoint is not configured");
}

const id = randomUUID();
const request = `${JSON.stringify({
  jsonrpc: "2.0",
  id,
  method: "invoke",
  params: { goal: values["--goal"], session_id: values["--session-id"] },
})}\n`;
const socket = createConnection({ host, port });
let bytes = 0;
let text = "";
const fail = (message) => { socket.destroy(); process.stderr.write(`${message}\n`); process.exitCode = 1; };
socket.setTimeout(5000, () => fail("JSON-RPC target timed out"));
socket.once("error", (error) => fail(`JSON-RPC target connection failed: ${error.message}`));
socket.once("connect", () => socket.write(request));
socket.on("data", (chunk) => {
  bytes += chunk.length;
  if (bytes > 1024 * 1024) return fail("JSON-RPC target response exceeds 1 MiB");
  text += chunk.toString("utf8");
  const newline = text.indexOf("\n");
  if (newline < 0) return;
  if (text.slice(newline + 1).trim() !== "") return fail("JSON-RPC target returned more than one line");
  let response;
  try { response = JSON.parse(text.slice(0, newline)); } catch { return fail("JSON-RPC target returned invalid JSON"); }
  if (response?.jsonrpc !== "2.0" || response.id !== id) return fail("JSON-RPC target returned a mismatched response");
  if (response.error !== undefined) return fail(`JSON-RPC target error: ${JSON.stringify(response.error)}`);
  if (!("result" in response)) return fail("JSON-RPC target response has no result");
  socket.destroy();
  process.stdout.write(`${JSON.stringify(response.result)}\n`);
});
socket.once("end", () => {
  if (process.exitCode === undefined && !text.includes("\n")) fail("JSON-RPC target closed before one complete line");
});
