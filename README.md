# SGL Site From Shopify Export

This is the independent SGL website starter rebuilt from the Shopify export.

Imported data:

- 30 products from `products_export_1.csv`
- Theme visual reference from Shopify Ride theme export
- Colors adjusted from the Shopify theme: black / graphite / acid green / cyan / cream

## Run locally

```bash
cd sgl-site-from-shopify
npm install
npm run dev
```

Open http://localhost:3000

## Important

Product images are currently using Shopify CDN URLs when available. Before canceling Shopify permanently, download all product images into `public/products` and update `data/products.ts` to local paths.

## Main files

- `data/products.ts` — imported Shopify products
- `app/page.tsx` — home page
- `app/shop/page.tsx` — product catalog
- `app/shop/[slug]/page.tsx` — product detail
- `components/BuyButton.tsx` — replace temporary Shopify links with Taobao / Mini Program / WeChat links


## Node version

Use Node.js 18.17+ or Node.js 20+. If your local machine still shows Node 16, run `nvm install 20 && nvm use 20` before `npm install`.
