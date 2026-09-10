import { getAuthUser } from "@/lib/auth/session";
import { loadPlayerProgress } from "@/lib/game";
import GamePlayClient from "./GamePlayClient";

export const metadata = {
  title: "Play STAND FIRM | Harvest Souls",
  description: "Play the STAND FIRM village adventure.",
};

export default async function GamePlayPage() {
  const user = await getAuthUser();
  const progress = user ? await loadPlayerProgress(user.id) : null;

  return (
    <div className="container mx-auto max-w-5xl px-2 py-4 sm:px-4 sm:py-8">
      <GamePlayClient initialProgress={progress} authenticated={Boolean(user)} />
    </div>
  );
}
