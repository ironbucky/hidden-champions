import { AuditLogger } from "./interfaces";
import { createServiceRoleClient } from "./supabase/serviceRole";

export class AuditLoggerImpl implements AuditLogger {
  async log({
    actorUserId,
    action,
    targetType,
    targetId,
    before,
    after,
  }: {
    actorUserId: string | null;
    action: string;
    targetType: string;
    targetId: string | null;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
  }): Promise<{ error: Error | null }> {
    const client = createServiceRoleClient();
    const { error } = await client.from("audit_log").insert({
      actor_user_id: actorUserId,
      action,
      target_type: targetType,
      target_id: targetId,
      before: before ?? null,
      after: after ?? null,
    });

    return { error: error ? new Error(error.message) : null };
  }
}

export const auditLogger = new AuditLoggerImpl();
