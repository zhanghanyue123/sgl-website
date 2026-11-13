ALTER TABLE support_contact_submissions
  ADD COLUMN attempts integer NOT NULL DEFAULT 1 CHECK (attempts BETWEEN 1 AND 3),
  ADD COLUMN retry_safe boolean NOT NULL DEFAULT false;

CREATE INDEX support_contact_submissions_retry_idx
  ON support_contact_submissions(status,retry_safe,updated_at)
  WHERE status='failed' AND retry_safe=true;
