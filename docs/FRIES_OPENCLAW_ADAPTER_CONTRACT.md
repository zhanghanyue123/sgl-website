# Fries OpenClaw Adapter Contract

```text
Global website Fries widget
  -> Vercel /api/support/*
  -> HTTPS Fries Adapter
  -> Tencent Cloud OpenClaw agent `fries`
  -> WireGuard
  -> RackNerd Model Gateway
  -> Gemini / DeepSeek
```

The browser keeps calling the existing Website API. It never receives Adapter, OpenClaw, Model Gateway or provider credentials.

## Request

`POST SGL_FRIES_ADAPTER_URL` with `Authorization: Bearer ...`, `Content-Type: application/json` and `Idempotency-Key: requestId`.

```json
{
  "schemaVersion": "sgl.fries.adapter.request.v1",
  "requestId": "uuid",
  "agent": "fries",
  "task": "structured_generation",
  "input": {
    "name": "sgl_public_support_answer",
    "system": "trusted Fries system instruction",
    "prompt": "PII-redacted conversation and approved evidence",
    "schema": { "type": "object" }
  }
}
```

The Adapter accepts only the configured `fries` agent and `structured_generation` task. It must reject shell commands, model overrides, filesystem paths, arbitrary agents and delivery/channel parameters.

## Response

```json
{
  "schemaVersion": "sgl.fries.adapter.response.v1",
  "requestId": "same uuid",
  "status": "completed",
  "agent": "fries",
  "output": { "answer": "..." }
}
```

The Adapter validates the final OpenClaw answer against the supplied JSON Schema and caches the completed response by idempotency key. Existing public knowledge grounding, PII redaction, prompt-injection handling, shared rate limiting, human takeover and audit persistence remain on the Website side.

Production requirements: HTTPS, a dedicated token stored only in server environments, bounded request/response sizes, timeout, bounded retry, idempotency, and no redirects. OpenClaw alone owns the WireGuard and Model Gateway path.
