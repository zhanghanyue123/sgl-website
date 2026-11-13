import { randomUUID } from "node:crypto";
import { getDb, toJson } from "@/lib/admin/db";
import { contactSubmissionHash, type ContactDeliveryResult, type ContactSubmission } from "./contact";

export async function reserveContactSubmission(input: ContactSubmission) {
  const id = randomUUID();
  const hash = contactSubmissionHash(input);
  const db = getDb();
  const rows = await db<Array<{ id: string; status: string }>>`INSERT INTO support_contact_submissions
    (id,idempotency_key,content_hash,name,email,subject,message,locale,status)
    VALUES(${id},${input.idempotencyKey},${hash},${input.name},${input.email},${input.subject},${input.message},${input.locale},'pending')
    ON CONFLICT(idempotency_key) DO NOTHING
    RETURNING id,status`;
  if (rows[0]) return { id: rows[0].id, status: rows[0].status, created: true };
  const retried = await db<Array<{ id: string; status: string }>>`UPDATE support_contact_submissions SET
    status='pending',attempts=attempts+1,last_error_code=NULL,updated_at=now()
    WHERE idempotency_key=${input.idempotencyKey} AND content_hash=${hash} AND status='failed'
      AND retry_safe=true AND attempts<3
    RETURNING id,status`;
  if (retried[0]) return { id: retried[0].id, status: retried[0].status, created: true };
  const existing = await db<Array<{ id: string; status: string }>>`SELECT id,status FROM support_contact_submissions WHERE idempotency_key=${input.idempotencyKey}`;
  return { id: existing[0].id, status: existing[0].status, created: false };
}

export async function recordContactDelivery(id: string, result: ContactDeliveryResult) {
  const db = getDb();
  await db.begin(async (tx) => {
    await tx`UPDATE support_contact_submissions SET status='sent',provider_message_id=${result.providerMessageId},sent_at=now(),updated_at=now() WHERE id=${id} AND status='pending'`;
    await tx`INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,after_data) VALUES(${randomUUID()},NULL,'support.contact.sent','support_contact_submission',${id},${tx.json(toJson({ mode: result.mode, target: 'hello_mailbox' }))})`;
  });
}

export async function recordContactFailure(id: string, errorCode: string, retrySafe = false) {
  await getDb()`UPDATE support_contact_submissions SET status='failed',last_error_code=${errorCode.slice(0,80)},retry_safe=${retrySafe},updated_at=now() WHERE id=${id} AND status='pending'`;
}
