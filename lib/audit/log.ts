import { createAdminClient, createClient } from "@/lib/supabase/server";

type AuditInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  summary?: string;
  metadata?: Record<string, unknown>;
  actorId?: string;
};

export async function writeAuditLog(input: AuditInput) {
  try {
    let actorId = input.actorId;
    if (!actorId) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      actorId = user?.id;
    }
    if (!actorId) return;

    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      actor_id: actorId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      summary: input.summary ?? null,
      metadata: input.metadata ?? {},
    });
  } catch {
    // Audit must never break primary flows.
  }
}
