import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/roles";
import {
  removeWorshipStoragePaths,
  uploadWorshipVideoAndConvert,
} from "@/lib/media/worship";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || !isStaff(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Invalid upload form data. The file may be too large for the server." },
        { status: 400 }
      );
    }

    const file = formData.get("video");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Choose a worship video to upload." }, { status: 400 });
    }

    const { result, error } = await uploadWorshipVideoAndConvert(file, user.id);
    if (error || !result) {
      return NextResponse.json({ error: error || "Upload failed." }, { status: 400 });
    }

    return NextResponse.json({ upload: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected upload error.";
    console.error("[worship/upload]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getAuthUser();
  if (!user || !isStaff(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { paths?: string[]; bucket?: string }
    | null;
  await removeWorshipStoragePaths(body?.paths ?? [], body?.bucket);
  return NextResponse.json({ ok: true });
}
