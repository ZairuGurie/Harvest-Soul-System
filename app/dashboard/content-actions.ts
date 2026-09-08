"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit/log";
import {
  collectMediaFiles,
  removeStoragePaths,
  uploadPostMediaFiles,
} from "@/lib/media/upload";
import { isAcceptedVideoUrl, resolveVideoUrl } from "@/lib/media/videoUrl";

export type ContentState = { error?: string; success?: string } | null;

function captionTitle(caption: string, hasPhoto: boolean, hasVideo: boolean) {
  const line = caption.split(/\r?\n/).map((s) => s.trim()).find(Boolean) || "";
  if (line) return line.length > 80 ? `${line.slice(0, 77)}…` : line;
  if (hasVideo && !hasPhoto) return "Video post";
  if (hasPhoto) return "Photo post";
  return "Update";
}

export async function createPost(_prev: ContentState, formData: FormData): Promise<ContentState> {
  const user = await requireStaff();
  const titleInput = String(formData.get("title") || "").trim();
  const caption = String(formData.get("content") || formData.get("caption") || "").trim();
  const status = String(formData.get("status") || "PUBLISHED");

  const publishStatus = status === "DRAFT" ? "DRAFT" : "PUBLISHED";

  // Prefer pre-uploaded media JSON (signed or proxy upload — never overwrites prior objects).
  let uploads: {
    url: string;
    storagePath: string;
    type: "PHOTO" | "VIDEO";
    mimeType?: string;
    fileName?: string;
    fileSizeBytes?: number;
  }[] = [];
  const mediaJson = String(formData.get("media_json") || "").trim();
  if (mediaJson) {
    try {
      const parsed = JSON.parse(mediaJson) as {
        url?: string;
        storagePath?: string;
        type?: string;
        mimeType?: string;
        fileName?: string;
        fileSizeBytes?: number;
      }[];
      uploads = (parsed ?? [])
        .filter((u) => u.url && u.storagePath && (u.type === "PHOTO" || u.type === "VIDEO"))
        .map((u) => ({
          url: u.url as string,
          storagePath: u.storagePath as string,
          type: u.type as "PHOTO" | "VIDEO",
          mimeType: u.mimeType,
          fileName: u.fileName,
          fileSizeBytes: u.fileSizeBytes,
        }));
    } catch {
      return { error: "Invalid media payload." };
    }
  } else {
    const files = collectMediaFiles(formData);
    const result = await uploadPostMediaFiles(files, user.id);
    if (result.error) return { error: result.error };
    uploads = result.uploads;
  }

  if (!caption && uploads.length === 0) {
    return { error: "Add a caption or attach at least one photo/video." };
  }

  const hasPhoto = uploads.some((u) => u.type === "PHOTO");
  const hasVideo = uploads.some((u) => u.type === "VIDEO");
  const title = titleInput || captionTitle(caption, hasPhoto, hasVideo);
  const excerpt = caption ? (caption.length > 160 ? `${caption.slice(0, 157)}…` : caption) : null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("posts")
    .insert({
      author_id: user.id,
      title,
      excerpt,
      content: caption || title,
      status: publishStatus,
      published_at: publishStatus === "PUBLISHED" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error) {
    // Clean up ONLY newly uploaded objects from this request.
    await removeStoragePaths(uploads.map((u) => u.storagePath), user.id);
    return { error: error.message };
  }

  if (uploads.length > 0) {
    const mediaRows = uploads.map((u) => ({
      uploaded_by: user.id,
      post_id: data.id,
      title,
      url: u.url,
      type: u.type,
      caption: caption || null,
      storage_path: u.storagePath,
      visibility: "PUBLIC",
      thumbnail_url: u.type === "PHOTO" ? u.url : null,
      mime_type: u.mimeType ?? null,
      file_size_bytes: u.fileSizeBytes ?? null,
      original_filename: u.fileName ?? null,
    }));

    let { error: mediaError } = await admin.from("media").insert(mediaRows);
    if (mediaError && /mime_type|file_size_bytes|original_filename|schema cache|column/i.test(mediaError.message)) {
      const basicRows = mediaRows.map(
        ({ mime_type: _m, file_size_bytes: _f, original_filename: _o, ...rest }) => rest
      );
      const retry = await admin.from("media").insert(basicRows);
      mediaError = retry.error;
    }
    if (mediaError) {
      await removeStoragePaths(uploads.map((u) => u.storagePath), user.id);
      await admin.from("posts").delete().eq("id", data.id);
      if (/post_id/i.test(mediaError.message)) {
        return {
          error:
            "Database needs the post media migration. Run supabase/migrations/20260304120000_post_media.sql in the Supabase SQL Editor, then try again.",
        };
      }
      return { error: mediaError.message };
    }
  }

  await writeAuditLog({
    actorId: user.id,
    action: "create",
    entityType: "post",
    entityId: data.id,
    summary: `Created post with ${uploads.length} media: ${title}`,
    metadata: { mediaCount: uploads.length, hasPhoto, hasVideo },
  });

  revalidatePath("/dashboard/posts");
  revalidatePath("/dashboard/media");
  revalidatePath("/");
  revalidatePath("/posts");
  return {
    success:
      uploads.length > 0
        ? `Published with ${uploads.length} photo/video attachment${uploads.length === 1 ? "" : "s"}.`
        : "Post created.",
  };
}

export async function deletePost(formData: FormData) {
  const user = await requireStaff();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const admin = createAdminClient();
  const { data: mediaRows } = await admin
    .from("media")
    .select("id, storage_path")
    .eq("post_id", id);

  const paths = (mediaRows ?? [])
    .map((m) => m.storage_path as string | null)
    .filter((p): p is string => typeof p === "string" && p.length > 0 && !/^https?:\/\//i.test(p));

  await removeStoragePaths(paths);
  if ((mediaRows ?? []).length > 0) {
    await admin.from("media").delete().eq("post_id", id);
  }

  const { error } = await admin.from("posts").delete().eq("id", id);
  if (!error) {
    await writeAuditLog({
      actorId: user.id,
      action: "delete",
      entityType: "post",
      entityId: id,
      summary: "Deleted post",
    });
  }
  revalidatePath("/dashboard/posts");
  revalidatePath("/dashboard/media");
  revalidatePath("/");
  revalidatePath("/posts");
}

export async function createAnnouncement(
  _prev: ContentState,
  formData: FormData
): Promise<ContentState> {
  const user = await requireStaff();
  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const publishDate = String(formData.get("publish_date") || "") || new Date().toISOString().slice(0, 10);

  if (!title || !content) return { error: "Title and content are required." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("announcements")
    .insert({
      title,
      content,
      publish_date: publishDate,
      status: "PUBLISHED",
      priority: "NORMAL",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await writeAuditLog({
    actorId: user.id,
    action: "create",
    entityType: "announcement",
    entityId: data.id,
    summary: `Created announcement: ${title}`,
  });

  revalidatePath("/dashboard/announcements");
  revalidatePath("/announcements");
  revalidatePath("/");
  return { success: "Announcement published." };
}

export async function deleteAnnouncement(formData: FormData) {
  const user = await requireStaff();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const admin = createAdminClient();
  const { error } = await admin.from("announcements").delete().eq("id", id);
  if (!error) {
    await writeAuditLog({
      actorId: user.id,
      action: "delete",
      entityType: "announcement",
      entityId: id,
      summary: "Deleted announcement",
    });
  }
  revalidatePath("/dashboard/announcements");
  revalidatePath("/announcements");
  revalidatePath("/");
}

export async function createEvent(_prev: ContentState, formData: FormData): Promise<ContentState> {
  const user = await requireStaff();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const eventDate = String(formData.get("event_date") || "");
  const startTime = String(formData.get("start_time") || "") || null;
  const location = String(formData.get("location") || "").trim() || null;

  if (!title || !eventDate) return { error: "Title and date are required." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("events")
    .insert({
      title,
      description: description || null,
      event_date: eventDate,
      start_time: startTime,
      location,
      visibility: "PUBLIC",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await writeAuditLog({
    actorId: user.id,
    action: "create",
    entityType: "event",
    entityId: data.id,
    summary: `Created event: ${title}`,
  });

  revalidatePath("/dashboard/events");
  revalidatePath("/events");
  revalidatePath("/");
  return { success: "Event created." };
}

export async function deleteEvent(formData: FormData) {
  const user = await requireStaff();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const admin = createAdminClient();
  const { error } = await admin.from("events").delete().eq("id", id);
  if (!error) {
    await writeAuditLog({
      actorId: user.id,
      action: "delete",
      entityType: "event",
      entityId: id,
      summary: "Deleted event",
    });
  }
  revalidatePath("/dashboard/events");
  revalidatePath("/events");
  revalidatePath("/");
}

export async function createSermon(_prev: ContentState, formData: FormData): Promise<ContentState> {
  const user = await requireStaff();
  const title = String(formData.get("title") || "").trim();
  const speaker = String(formData.get("speaker") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const sermonDate = String(formData.get("sermon_date") || "") || null;
  const videoUrlRaw = String(formData.get("video_url") || "").trim();

  if (!title) return { error: "Title is required." };

  let videoUrl = videoUrlRaw || null;
  if (videoUrl) {
    if (!isAcceptedVideoUrl(videoUrl)) {
      return {
        error:
          "Video link not recognized. Paste a Facebook video/share/reel link, YouTube link, or upload an MP4/WebM file.",
      };
    }
    videoUrl = await resolveVideoUrl(videoUrl);
  }

  const admin = createAdminClient();

  // Never auto-feature on create — uploading must not replace the Featured Sermon.
  // If no featured sermon exists yet, leave featured empty until staff clicks "Set featured".
  const payload = {
    title,
    speaker: speaker || null,
    description: description || null,
    sermon_date: sermonDate,
    video_url: videoUrl,
    visibility: "PUBLIC",
    is_featured: false,
  };

  let { data, error } = await admin.from("sermons").insert(payload).select("id").single();

  if (error && /is_featured|schema cache|column .* does not exist/i.test(error.message)) {
    const { is_featured: _f, ...withoutFeatured } = payload;
    const fallback = await admin.from("sermons").insert(withoutFeatured).select("id").single();
    data = fallback.data;
    error = fallback.error;
    if (!error) {
      await writeAuditLog({
        actorId: user.id,
        action: "create",
        entityType: "sermon",
        entityId: data!.id,
        summary: `Created sermon: ${title} (is_featured column missing — run media storage migration)`,
      });
      revalidatePath("/dashboard/sermons");
      revalidatePath("/sermons");
      revalidatePath("/");
      return {
        success:
          "Sermon created. Run supabase/migrations/20260908120000_media_storage_improvements.sql to enable sticky Featured Sermon.",
      };
    }
  }

  if (error || !data) return { error: error?.message || "Could not create sermon." };

  await writeAuditLog({
    actorId: user.id,
    action: "create",
    entityType: "sermon",
    entityId: data.id,
    summary: `Created sermon: ${title}`,
  });

  revalidatePath("/dashboard/sermons");
  revalidatePath("/sermons");
  revalidatePath("/");
  return { success: "Sermon created. Use “Set featured” to show it on the landing page." };
}

/** Explicit Featured Sermon — does NOT delete the previous featured sermon. */
export async function setFeaturedSermon(formData: FormData) {
  const user = await requireStaff();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const admin = createAdminClient();
  await admin.from("sermons").update({ is_featured: false }).eq("is_featured", true);
  const { error } = await admin.from("sermons").update({ is_featured: true }).eq("id", id);

  if (!error) {
    await writeAuditLog({
      actorId: user.id,
      action: "update",
      entityType: "sermon",
      entityId: id,
      summary: "Set featured sermon",
    });
  }

  revalidatePath("/dashboard/sermons");
  revalidatePath("/sermons");
  revalidatePath("/");
}

export async function deleteSermon(formData: FormData) {
  const user = await requireStaff();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const admin = createAdminClient();
  const { error } = await admin.from("sermons").delete().eq("id", id);
  if (!error) {
    await writeAuditLog({
      actorId: user.id,
      action: "delete",
      entityType: "sermon",
      entityId: id,
      summary: "Deleted sermon",
    });
  }
  revalidatePath("/dashboard/sermons");
  revalidatePath("/sermons");
  revalidatePath("/");
}

export async function createMedia(_prev: ContentState, formData: FormData): Promise<ContentState> {
  const user = await requireStaff();
  const title = String(formData.get("title") || "").trim();
  const url = String(formData.get("url") || "").trim();
  const type = String(formData.get("type") || "PHOTO");
  const caption = String(formData.get("caption") || "").trim() || null;

  if (!title || !url) return { error: "Title and media URL are required." };
  if (type !== "PHOTO" && type !== "VIDEO") return { error: "Invalid media type." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("media")
    .insert({
      uploaded_by: user.id,
      title,
      url,
      type,
      caption,
      storage_path: url,
      visibility: "PUBLIC",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await writeAuditLog({
    actorId: user.id,
    action: "create",
    entityType: "media",
    entityId: data.id,
    summary: `Uploaded ${type.toLowerCase()}: ${title}`,
  });

  revalidatePath("/dashboard/media");
  revalidatePath("/");
  return { success: "Media uploaded." };
}

export async function deleteMedia(formData: FormData) {
  const user = await requireStaff();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const admin = createAdminClient();
  const { error } = await admin.from("media").delete().eq("id", id);
  if (!error) {
    await writeAuditLog({
      actorId: user.id,
      action: "delete",
      entityType: "media",
      entityId: id,
      summary: "Deleted media",
    });
  }
  revalidatePath("/dashboard/media");
  revalidatePath("/");
}

const CHURCH_BIRTHDAYS_HINT =
  "Run this SQL in Supabase → SQL Editor: supabase/migrations/20260304150000_church_birthdays.sql";

function isMissingChurchBirthdaysError(message: string) {
  return /church_birthdays|schema cache|relation .* does not exist/i.test(message);
}

export async function createChurchBirthday(
  _prev: ContentState,
  formData: FormData
): Promise<ContentState> {
  const user = await requireStaff();
  const displayName = String(formData.get("display_name") || "").trim();
  const birthday = String(formData.get("birthday") || "").trim();
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!displayName || !birthday) {
    return { error: "Name and birthday date are required." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("church_birthdays")
    .insert({
      display_name: displayName,
      birthday,
      notes,
      is_active: true,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    if (isMissingChurchBirthdaysError(error.message)) {
      return { error: `Birthday table is missing. ${CHURCH_BIRTHDAYS_HINT}` };
    }
    return { error: error.message };
  }

  await writeAuditLog({
    actorId: user.id,
    action: "create",
    entityType: "church_birthday",
    entityId: data.id,
    summary: `Added birthday for ${displayName}`,
  });

  revalidatePath("/dashboard/birthdays");
  revalidatePath("/");
  return { success: `Birthday saved for ${displayName}.` };
}

export async function updateChurchBirthday(
  _prev: ContentState,
  formData: FormData
): Promise<ContentState> {
  const user = await requireStaff();
  const id = String(formData.get("id") || "").trim();
  const displayName = String(formData.get("display_name") || "").trim();
  const birthday = String(formData.get("birthday") || "").trim();
  const notes = String(formData.get("notes") || "").trim() || null;
  const isActive = String(formData.get("is_active") || "true") !== "false";

  if (!id || !displayName || !birthday) {
    return { error: "Name and birthday date are required." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("church_birthdays")
    .update({
      display_name: displayName,
      birthday,
      notes,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    if (isMissingChurchBirthdaysError(error.message)) {
      return { error: `Birthday table is missing. ${CHURCH_BIRTHDAYS_HINT}` };
    }
    return { error: error.message };
  }

  await writeAuditLog({
    actorId: user.id,
    action: "update",
    entityType: "church_birthday",
    entityId: id,
    summary: `Updated birthday for ${displayName}`,
  });

  revalidatePath("/dashboard/birthdays");
  revalidatePath("/");
  return { success: "Birthday updated." };
}

export async function deleteChurchBirthday(formData: FormData) {
  const user = await requireStaff();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const admin = createAdminClient();
  const { error } = await admin.from("church_birthdays").delete().eq("id", id);
  if (!error) {
    await writeAuditLog({
      actorId: user.id,
      action: "delete",
      entityType: "church_birthday",
      entityId: id,
      summary: "Deleted church birthday",
    });
  }
  revalidatePath("/dashboard/birthdays");
  revalidatePath("/");
}

const SONGS_HINT =
  "Run this SQL in Supabase → SQL Editor: supabase/migrations/20260304160000_worship_songs.sql";

function isMissingSongsError(message: string) {
  return /songs|schema cache|column .* does not exist|relation .* does not exist/i.test(message);
}

export async function createWorshipSong(
  _prev: ContentState,
  formData: FormData
): Promise<ContentState> {
  const user = await requireStaff();
  const title = String(formData.get("title") || "").trim();
  const artist = String(formData.get("artist") || "").trim() || null;
  const lyrics = String(formData.get("lyrics") || "").trim() || null;
  const categoryRaw = String(formData.get("category") || "WORSHIP").trim().toUpperCase();
  const category = categoryRaw === "PRAISE" ? "PRAISE" : "WORSHIP";
  const isFeatured = String(formData.get("is_featured") || "") === "true";
  const source = String(formData.get("source") || "upload").trim().toLowerCase();
  const videoUrl = String(formData.get("video_url") || "").trim() || null;
  const audioUrl = String(formData.get("audio_url") || "").trim() || null;
  const videoStoragePath = String(formData.get("video_storage_path") || "").trim() || null;
  const audioStoragePath = String(formData.get("audio_storage_path") || "").trim() || null;

  if (!title) return { error: "Title is required." };

  const isYoutube = source === "youtube";
  if (isYoutube) {
    const { parseVideoUrl } = await import("@/lib/media/videoUrl");
    const parsed = parseVideoUrl(videoUrl);
    if (!videoUrl || !parsed || parsed.provider !== "youtube") {
      return { error: "A valid YouTube URL is required." };
    }
  } else if (!videoUrl || !audioUrl) {
    return { error: "Upload a video so MP3 audio can be generated." };
  }

  const admin = createAdminClient();

  if (isFeatured) {
    await admin.from("songs").update({ is_featured: false }).eq("is_featured", true);
  }

  const { data, error } = await admin
    .from("songs")
    .insert({
      title,
      artist,
      lyrics,
      category,
      video_url: videoUrl,
      audio_url: isYoutube ? null : audioUrl,
      video_storage_path: isYoutube ? null : videoStoragePath,
      audio_storage_path: isYoutube ? null : audioStoragePath,
      is_featured: isFeatured,
      visibility: "PUBLIC",
      created_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    if (isMissingSongsError(error.message)) {
      return { error: `Worship table is missing columns. ${SONGS_HINT}` };
    }
    return { error: error.message };
  }

  await writeAuditLog({
    actorId: user.id,
    action: "create",
    entityType: "song",
    entityId: data.id,
    summary: isYoutube
      ? `Published ${category.toLowerCase()} (YouTube): ${title}`
      : `Published ${category.toLowerCase()}: ${title}`,
  });

  revalidatePath("/dashboard/worship");
  revalidatePath("/songs");
  revalidatePath("/");
  return {
    success: isYoutube
      ? `${category === "PRAISE" ? "Praise" : "Worship"} published from YouTube (no storage used).`
      : `${category === "PRAISE" ? "Praise" : "Worship"} published with MP3 audio.`,
  };
}

export async function setFeaturedWorshipSong(formData: FormData) {
  const user = await requireStaff();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const admin = createAdminClient();
  await admin.from("songs").update({ is_featured: false }).eq("is_featured", true);
  const { error } = await admin
    .from("songs")
    .update({ is_featured: true, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (!error) {
    await writeAuditLog({
      actorId: user.id,
      action: "update",
      entityType: "song",
      entityId: id,
      summary: "Set featured worship song",
    });
  }
  revalidatePath("/dashboard/worship");
  revalidatePath("/songs");
  revalidatePath("/");
}

export async function deleteWorshipSong(formData: FormData) {
  const user = await requireStaff();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const admin = createAdminClient();
  const { data } = await admin
    .from("songs")
    .select("video_storage_path, audio_storage_path")
    .eq("id", id)
    .maybeSingle();

  const { error } = await admin.from("songs").delete().eq("id", id);
  if (!error) {
    const paths = [data?.video_storage_path, data?.audio_storage_path].filter(
      (p): p is string => !!p
    );
    if (paths.length) {
      const { removeWorshipStoragePaths } = await import("@/lib/media/worship");
      await removeWorshipStoragePaths(paths);
    }
    await writeAuditLog({
      actorId: user.id,
      action: "delete",
      entityType: "song",
      entityId: id,
      summary: "Deleted worship song",
    });
  }
  revalidatePath("/dashboard/worship");
  revalidatePath("/songs");
  revalidatePath("/");
}
