import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

function resolveFfmpegPath(): string {
  const binary = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";

  // Resolve from the real project folder. Turbopack rewrites require("ffmpeg-static")
  // to a virtual "\ROOT\node_modules\..." path that spawn cannot execute (ENOENT).
  const local = path.join(process.cwd(), "node_modules", "ffmpeg-static", binary);
  if (existsSync(local)) return local;

  // Optional: ffmpeg installed system-wide
  return "ffmpeg";
}

function runFfmpeg(args: string[]): Promise<void> {
  const bin = resolveFfmpegPath();
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, args, {
      windowsHide: true,
      shell: false,
    });
    let stderr = "";
    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    proc.on("error", (err) => {
      reject(
        new Error(
          `Could not start FFmpeg at "${bin}": ${err.message}. Run: npm install ffmpeg-static`
        )
      );
    });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg failed (code ${code}). ${stderr.slice(-500)}`));
    });
  });
}

function extensionForMime(mime: string, fileName: string) {
  if (mime.includes("webm")) return ".webm";
  if (mime.includes("quicktime") || mime.includes("mov")) return ".mov";
  if (mime.includes("mp4") || mime.includes("mpeg")) return ".mp4";
  const fromName = path.extname(fileName).toLowerCase();
  return fromName || ".mp4";
}

/**
 * Convert a video buffer to MP3 audio using the bundled ffmpeg binary.
 */
export async function convertVideoBufferToMp3(
  videoBuffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<{ mp3: Buffer }> {
  const id = randomUUID();
  const workDir = path.join(tmpdir(), "harvest-worship");
  await mkdir(workDir, { recursive: true });

  const inputPath = path.join(workDir, `${id}${extensionForMime(mimeType, fileName)}`);
  const outputPath = path.join(workDir, `${id}.mp3`);

  try {
    await writeFile(inputPath, videoBuffer);

    await runFfmpeg([
      "-y",
      "-i",
      inputPath,
      "-vn",
      "-acodec",
      "libmp3lame",
      "-q:a",
      "2",
      "-ar",
      "44100",
      "-ac",
      "2",
      outputPath,
    ]);

    const mp3 = await readFile(outputPath);
    if (!mp3.length) {
      throw new Error("MP3 conversion produced an empty file.");
    }

    return { mp3 };
  } finally {
    await Promise.allSettled([unlink(inputPath), unlink(outputPath)]);
  }
}
