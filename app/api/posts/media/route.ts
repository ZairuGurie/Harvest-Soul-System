import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/roles";
import {
  collectMediaFiles,
  removeStoragePaths,
  uploadPostMediaFiles,
  type UploadedMedia,
} from "@/lib/media/upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user || !isStaff(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload form data." }, { status: 400 });
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
  await removeStoragePaths(paths);
  return NextResponse.json({ ok: true });
}
