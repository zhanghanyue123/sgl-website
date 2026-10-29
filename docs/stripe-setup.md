# Stripe / OPS 接口接入指南

当前状态：接口已实现，默认关闭正式结账。未连接真实 Stripe 账户或腾讯云 OPS；不能仅填 Stripe 密钥就直接收款。必须先完成以下 OPS 合同、价格/库存/运费和测试验收。

## 网站接口

- `POST /api/checkout`：官网购物车调用。`Origin` 必须匹配 `SITE_URL`，`Idempotency-Key` 为 16–100 位字母、数字、下划线或连字符。请求示例：`{"items":[{"slug":"seat-bag","variant":0,"quantity":1}]}`。不接收浏览器价格。成功返回 `{"url":"https://checkout.stripe.com/..."}`；未开通返回 503。
- `POST /api/stripe/webhook`：接收 Stripe 原始请求体和 `Stripe-Signature`。验签通过后转发到 OPS；只有收到持久化确认才返回成功，OPS 离线返回 503 供 Stripe 重试。
- `/checkout/success`：中性的支付返回页，不以跳转判定付款成功，不自动清空购物车。

## Vercel 环境变量

参考仓库根目录 `.env.example`，不要把真实密钥提交到 Git。

|变量|用途|
|---|---|
|STORE_CHECKOUT_ENABLED|默认 false，全部测试通过后设 true|
|NEXT_PUBLIC_STORE_CHECKOUT_ENABLED|默认 false；全部测试通过后设 true 并重新部署，显示支付按钮|
|SITE_URL|正式站点 origin，例如 https://www.theseagulllabs.com|
|STRIPE_SECRET_KEY|先使用 sk_test_ 测试密钥|
|STRIPE_WEBHOOK_SECRET|该 webhook 的 whsec_ 签名密钥|
|STRIPE_ALLOW_LIVE|默认 false，真实商户审核及验收后才设 true|
|OPS_STORE_API_URL|专用 HTTPS 商店 API 前缀，不是 127.0.0.1 或后台页面|
|OPS_STORE_API_TOKEN|专用服务端凭据，不要复用前端可见的管理员令牌|

没有客户端 Stripe 公钥要求：使用 Stripe 托管 Checkout 跳转。

## OPS 需要实现的三个接口（尚未部署）

所有请求均带 `Authorization: Bearer ...` 和 `Idempotency-Key`。请只给此令牌商店接口权限，配合持久化限流及访问日志。

### POST /checkout/quotes

接收 `items: [{slug, options: [{name,value}], quantity}]` 和 `cartHash`。OPS 必须通过 slug + options 找到稳定 SKU，用当前有效的商品、库存、币种和 Stripe Price ID 建立订单报价并原子预留库存。不能信任客户端或网站历史库存。相同幂等键同一请求返回相同订单；参数不同返回 409。

响应示例（整数均为币种最小单位）：

```json
{
  "orderId": "sgl_order_123",
  "expiresAt": 1900000000,
  "currency": "usd",
  "amountTotal": 3500,
  "shippingRateId": "shr_REPLACE",
  "shippingAmount": 500,
  "allowedCountries": ["US"],
  "lines": [{"priceId":"price_REPLACE","quantity":1,"unitAmount":3000}]
}
```

`expiresAt` 须为请求时未来 30 分钟至 24 小时内的 Unix 秒，并配合定时释放预留库存；示例时间不可直接用于生产。价格必须是一次性、固定金额，暂不支持附加税、自适应定价、折扣、多配送费选项。当前网站展示人民币历史目录；改为美元/欧元前必须同步前台价格，不能只换货币符号。运费须在 Stripe 创建固定 Shipping Rate，与 OPS 报价一致。允许国家要符合真实发货能力。商品税务设置需由商户完成；该接口不计算税。

### POST /checkout/sessions

接收 `{orderId, sessionId, amountTotal, currency}`。将 Stripe Session 与已持久化订单绑定，验证金额币种，不允许将不同 Session 绑定到已付款订单。同一 Session 重试须幂等。成功返回 JSON。

### POST /payments/stripe/events

接收经过网站验签的完整 Stripe Event。只接受授权的服务端请求。处理事件和记录 event.id 须在数据库事务中完成；重复事件必须返回同一成功确认。

成功响应：`{"eventId":"evt_...","persisted":true}`。**只有持久保存或已处理过的事件才能返回这个确认。**

处理：`checkout.session.completed`、`checkout.session.async_payment_succeeded`、`checkout.session.async_payment_failed`、`checkout.session.expired`、`charge.refunded`、`charge.dispute.created`、`charge.dispute.closed`。

- 付款只认有效事件中 `payment_status=paid`，并核对关联订单、Session、币种和金额。
- 事件可能先于 Session 绑定到达：用 `metadata.ops_order_id` 和 `client_reference_id` 定位原始报价并一致性验证，或持久化待重试队列；不能丢弃。
- 防止乱序事件把已付款订单降回未付款；维护退款和争议独立状态。
- 支付失败/到期释放库存，成功扣减只能一次，部分/全额退款需分别记录。
- 客户、收货地址从支付事件或 Stripe 服务端读取后存入 OPS，不应通过公开查询接口暴露。

## 验证

`npm run test:store`：输入验证、重复规格、金额核对、关闭状态、跨来源请求、签名篡改、OPS 保存失败及重试。

接入真实测试环境后还必须验证：跳转支付成功、取消、库存不足、报价过期、重复/乱序事件、退款、断网恢复与履约。当前自动测试不声称真实扣款、库存事务或 OPS 后台已完成。

官方参考：https://docs.stripe.com/api/checkout/sessions/create 和 https://docs.stripe.com/events/manage-webhook-endpoints
