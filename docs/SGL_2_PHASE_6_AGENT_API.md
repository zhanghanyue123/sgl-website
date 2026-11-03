# SGL 2.0 Phase 6 — Retail Agent API readiness

Phase 6 adds an API surface dedicated to trusted retail agents. It is separate from customer and administrator routes under `/api/agent/v1`.

## Authentication and scopes

Bearer tokens are stored only as SHA-256 hashes and are bound to an active client, expiry and explicit scopes. Create a token once with:

```bash
ADMIN_EMAIL=owner@example.com \
AGENT_NAME="Retail assistant" \
AGENT_SCOPES="catalog:read,inventory:read,orders:read,fulfillment:read,analytics:read,actions:read,inventory:propose,shipping:propose,content:propose" \
npm run agent:create-token
```

The token is printed once. Revoke a client or token in the database when access should end. `pricing:propose` and `refund:propose` are deliberately separate and should not be granted by default.

## Endpoints

- `GET /api/agent/v1/catalog`
- `GET /api/agent/v1/inventory`
- `GET /api/agent/v1/orders` (operational order data without customer contact or address data)
- `GET /api/agent/v1/fulfillment`
- `GET /api/agent/v1/analytics`
- `GET|POST /api/agent/v1/actions`

All authenticated calls are recorded in `agent_audit_logs`.

## Approval boundary

Agent actions create pending proposals only. Supported proposals are inventory adjustments, shipment preparation, localized content updates, price changes and refunds. They never mutate inventory, products, payments or fulfillment.

Owners and administrators review proposals in `/admin/agent-actions`. Approval records intent and an audit event; it does not execute the operation. An authorized administrator must still use the existing inventory, product, shipping or payment workflow. Refund execution is not implemented, so an agent cannot trigger a financial action.

Before production use, apply migration `0004_agent_api.sql`, provision the minimum scopes needed, set a short expiry and establish a token revocation procedure.
