import Image from "next/image";

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
        {items.map((item) => (
          <div
            key={item.id}
            className={`relative overflow-hidden rounded-xl bg-slate-900 ${
              single ? "col-span-full aspect-video max-h-[28rem]" : "aspect-square"
            }`}
          >
            {isVideo(item) ? (
              <video
                src={item.url}
                controls
                playsInline
                className="h-full w-full object-contain bg-black"
                poster={item.thumbnail_url || undefined}
              />
            ) : (
              <Image
                src={item.url}
                alt={item.caption || "Post photo"}
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
