import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/roles";
import {
  collectMediaFiles,
  preparePostMediaSignedUpload,
  removeStoragePaths,
  uploadPostMediaFiles,
  type UploadedMedia,
} from "@/lib/media/upload";
import { formatBytesLabel, getMaxUploadBytes } from "@/lib/media/limits";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user || !isStaff(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";

  // Direct-to-Storage prepare: JSON body { fileName, mimeType, fileSize }
  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as {
      fileName?: string;
      mimeType?: string;
      fileSize?: number;
      mode?: string;
    } | null;

    if (body?.mode === "sign" || (body?.fileName && body?.mimeType != null && body?.fileSize != null)) {
      const prepared = await preparePostMediaSignedUpload(
        user.id,
        String(body.fileName || ""),
        String(body.mimeType || ""),
        Number(body.fileSize || 0)
      );
      if ("error" in prepared) {
        return NextResponse.json({ error: prepared.error }, { status: 400 });
      }
      return NextResponse.json({
        upload: prepared.upload,
        maxBytes: getMaxUploadBytes(),
        maxLabel: formatBytesLabel(getMaxUploadBytes()),
      });
    }
    return NextResponse.json({ error: "Invalid prepare payload." }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      {
        error: `Invalid upload form data. File may exceed server limit (max ${formatBytesLabel(getMaxUploadBytes())}). Try a smaller file or use signed upload.`,
      },
      { status: 400 }
    );
  }

  const files = collectMediaFiles(formData);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided." }, { status: 400 });
  }

  const { uploads, error } = await uploadPostMediaFiles(files, user.id);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json({ uploads: uploads as UploadedMedia[] });
}

export async function DELETE(request: Request) {
  const user = await getAuthUser();
  if (!user || !isStaff(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { paths?: string[] } | null;
  const paths = body?.paths ?? [];
  // Only delete objects under this staff user's prefix (no arbitrary path wipe).
  await removeStoragePaths(paths, user.id);
  return NextResponse.json({ ok: true });
}
