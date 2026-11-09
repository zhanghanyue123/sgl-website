import { randomUUID } from "node:crypto";
import { getDb, toJson } from "@/lib/admin/db";
import { contactSubmissionHash, type ContactDeliveryResult, type ContactSubmission } from "./contact";

export async function reserveContactSubmission(input: ContactSubmission) {
  const id = randomUUID();
  const hash = contactSubmissionHash(input);
  const rows = await getDb()<Array<{ id: string; status: string }>>`INSERT INTO support_contact_submissions
    (id,idempotency_key,content_hash,name,email,subject,message,locale,status)
    VALUES(${id},${input.idempotencyKey},${hash},${input.name},${input.email},${input.subject},${input.message},${input.locale},'pending')
    ON CONFLICT(idempotency_key) DO UPDATE SET updated_at=support_contact_submissions.updated_at
    RETURNING id,status`;
  const record = rows[0];
  return { id: record.id, status: record.status, created: record.id === id };
}

export async function recordContactDelivery(id: string, result: ContactDeliveryResult) {
  const db = getDb();
  await db.begin(async (tx) => {
    await tx`UPDATE support_contact_submissions SET status='sent',provider_message_id=${result.providerMessageId},sent_at=now(),updated_at=now() WHERE id=${id} AND status='pending'`;
    await tx`INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,after_data) VALUES(${randomUUID()},NULL,'support.contact.sent','support_contact_submission',${id},${tx.json(toJson({ mode: result.mode, target: 'hello_mailbox' }))})`;
  });
}

export async function recordContactFailure(id: string, errorCode: string) {
  await getDb()`UPDATE support_contact_submissions SET status='failed',last_error_code=${errorCode.slice(0,80)},updated_at=now() WHERE id=${id} AND status='pending'`;
}
