import { NextRequest } from "next/server";
import { openai } from "../../../lib/openai";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as unknown as File | null;
    if (!file) return new Response(JSON.stringify({ error: "Missing file" }), { status: 400 });
    const arrayBuffer = await file.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    const uploaded = await openai.files.create({ file: await toReadable(file.name, buf), purpose: "file_search" });
    return Response.json({ file_id: uploaded.id, filename: file.name, bytes: buf.length });
  } catch (e: any) { return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500 }); }
}
async function toReadable(filename: string, buf: Buffer) {
  const { Readable } = await import("stream");
  const stream = Readable.from(buf);
  (stream as any).path = filename;
  return stream as unknown as File;
}
