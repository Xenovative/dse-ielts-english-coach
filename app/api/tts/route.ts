import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getSession } from "@/lib/auth/session";
import { ok, unauthorized, fail, handleUnknownError } from "@/lib/utils/api";
import { checkRateLimit, clientKey } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";

const MAX_CHARS = 2500;

/**
 * POST /api/tts { text }
 * Generates (and caches) spoken audio with free edge-tts for the coach avatar.
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const rl = checkRateLimit(clientKey(req, "tts"));
    if (!rl.allowed) return fail("rate_limited", "Too many requests", 429);

    const body = await req.json();
    const text = String(body?.text ?? "").trim();
    if (!text) return fail("bad_request", "text is required", 400);
    if (text.length > MAX_CHARS) {
      return fail("too_long", `text exceeds ${MAX_CHARS} characters`, 400);
    }

    const hash = createHash("sha1").update(text).digest("hex").slice(0, 24);
    const dir = path.join(process.cwd(), "public", "tts");
    await fs.mkdir(dir, { recursive: true });
    const filename = `${hash}.mp3`;
    const filePath = path.join(dir, filename);
    const url = `/tts/${filename}`;

    try {
      await fs.access(filePath);
      return ok({ url, cached: true });
    } catch {
      /* generate */
    }

    const python = path.join(process.cwd(), ".venv-tts", "bin", "python");
    await runEdgeTts(python, text, filePath);

    return ok({ url, cached: false });
  } catch (err) {
    return handleUnknownError(err);
  }
}

function runEdgeTts(python: string, text: string, outPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = `
import asyncio, sys
import edge_tts

async def main():
    text = sys.argv[1]
    out = sys.argv[2]
    communicate = edge_tts.Communicate(text, "en-GB-SoniaNeural")
    await communicate.save(out)

asyncio.run(main())
`;
    const child = spawn(python, ["-c", script, text, outPath], {
      cwd: process.cwd(),
    });
    let err = "";
    child.stderr.on("data", (d) => {
      err += String(d);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(err || `edge-tts exited ${code}`));
    });
  });
}
