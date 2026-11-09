CREATE TABLE public_rate_limit_buckets (
  bucket_key text PRIMARY KEY,
  request_count integer NOT NULL DEFAULT 1,
  reset_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (length(bucket_key) BETWEEN 8 AND 160),
  CHECK (request_count >= 1)
);

CREATE INDEX public_rate_limit_buckets_reset_idx
  ON public_rate_limit_buckets(reset_at);
