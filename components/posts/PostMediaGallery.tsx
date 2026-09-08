import Image from "next/image";
import { parseVideoUrl } from "@/lib/media/videoUrl";

export type PostMediaItem = {
  id: string;
  url: string;
  type?: string | null;
  caption?: string | null;
  thumbnail_url?: string | null;
};

function isVideo(item: PostMediaItem) {
  const t = (item.type || "").toUpperCase();
  if (t === "VIDEO") return true;
  return /\.(mp4|webm|mov)(\?|$)/i.test(item.url);
}

function isDirectImageUrl(url: string) {
  return /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url);
}

export default function PostMediaGallery({
  items,
  className = "",
}: {
  items: PostMediaItem[];
  className?: string;
}) {
  if (!items.length) return null;

  const single = items.length === 1;
  const grid =
    items.length === 2
      ? "grid-cols-2"
      : items.length === 3
        ? "grid-cols-2 sm:grid-cols-3"
        : "grid-cols-2 sm:grid-cols-3";

  return (
    <div className={`mt-3 ${className}`}>
      <div className={`grid ${grid} gap-2`}>
        {items.map((item) => {
          const parsed = parseVideoUrl(item.url);
          const useEmbed =
            parsed &&
            (parsed.provider === "facebook" || parsed.provider === "youtube") &&
            !!parsed.embedUrl;
          const isFbPost = parsed?.provider === "facebook" && parsed.facebookKind === "post";
          // Post embeds (multi-photo) need more height than 16:9 video.
          const frameClass = single
            ? isFbPost
              ? "col-span-full min-h-[28rem] sm:min-h-[32rem]"
              : "col-span-full aspect-video max-h-[28rem]"
            : isFbPost
              ? "col-span-full min-h-[24rem] sm:col-span-2 sm:min-h-[28rem]"
              : "aspect-square";

          return (
            <div
              key={item.id}
              className={`relative overflow-hidden rounded-xl bg-slate-900 ${frameClass}`}
            >
              {useEmbed ? (
                <iframe
                  title={item.caption || parsed.label || "Media"}
                  src={parsed.embedUrl}
                  className="h-full w-full bg-white"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                />
              ) : isVideo(item) ? (
                <video
                  src={item.url}
                  controls
                  playsInline
                  className="h-full w-full object-contain bg-black"
                  poster={item.thumbnail_url || undefined}
                />
              ) : isDirectImageUrl(item.url) || item.thumbnail_url ? (
                <Image
                  src={item.thumbnail_url || item.url}
                  alt={item.caption || "Post photo"}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 600px"
                />
              ) : (
                <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-2 p-4 text-center">
                  <p className="text-sm text-slate-300">Media preview unavailable</p>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-emerald-300 underline"
                  >
                    Open original
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
