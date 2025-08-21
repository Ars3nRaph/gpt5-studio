import { NextRequest } from "next/server";
import { openai } from "../../../lib/openai";
import { sseHeaders, writeEvent } from "../../../lib/sse";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const { messages = [], attachments = [], devMode = false, useCodeInterpreter = false, model = "gpt-5" } = await req.json();
  const input = messages.map((m: any) => ({ role: m.role, content: m.content }));
  const tools: any[] = [];
  if (attachments?.length) tools.push({ type: "file_search" });
  if (useCodeInterpreter) tools.push({ type: "code_interpreter" });
  const atts = attachments?.map((a: any) => ({ file_id: a.file_id, tools: [{ type: "file_search" }] })) ?? [];
  if (devMode) input.unshift({ role: "system", content: "Tu es un assistant de développement. Fournis des fichiers complets et prêts à exécuter." });
  const stream = await openai.responses.stream({ model, input, tools, attachments: atts, stream: true });
  const rs = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      controller.enqueue(enc.encode(writeEvent({ type: "response.started" })));
      try { for await (const event of stream) controller.enqueue(enc.encode(writeEvent(event))); }
      catch (e: any) { controller.enqueue(enc.encode(writeEvent({ type: "error", error: String(e?.message || e) }))); }
      finally { controller.enqueue(enc.encode(writeEvent({ type: "response.completed" }))); controller.close(); }
    }
  });
  return new Response(rs, { headers: sseHeaders() });
}
