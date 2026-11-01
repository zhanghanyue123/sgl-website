# SGL Website Content Audit

Audit date: 2026-11-02  
Website: https://www.theseagulllabs.com  
Editorial master language: English  
Status: Report only. No website copy, translations, layout, images, or behavior were changed. No deployment was performed.

## Owner clarification received after the audit

The following owner-provided facts supersede cautious assumptions made during the initial repository-only review:

- Seagull Station is a real operating physical location. Its verified coffee, beverage, retail and community activities must be preserved.
- SGL's original character IP, narrative experiences, city missions and AR interactions are intentional long-term product directions. Copy must distinguish live, in-development and conceptual features rather than removing this identity.
- SGL has an established history involving product development, photography, exhibitions, cycling culture, overseas activity and Station.
- Legitimate products, event photographs, historical archives and character assets must remain preserved even when their public wording needs correction.
- The Seagull Labs was founded on June 9, 2023. SGL participated in ISPO Shanghai and the Shanghai International Bicycle Exhibition in 2025; Seagull Station began operating in October 2025; SGL returned to the Shanghai bicycle exhibition in 2026.
- The SGL WeChat Mini Program launched in June 2026. Individual functions still need feature-level status labels. AR interactions remain in development with a planned, non-guaranteed release in early 2027.
- The verified Station address is `China, Shanghai, Pudong New Area, Jinyan Road & Dongxiu Road Plaza, L1` / `上海市浦东新区锦延路东绣路广场 L1`. Hours, coordinates, telephone and postal code remain unconfirmed.
- Chrissy Ti uses a titanium alloy frame; the other Chrissy models use aluminum alloy frames. Positively identified 451 models are complete bicycles, but the current product data does not identify which listings are 451.
- Mainland China payments support WeChat Pay and Alipay through SGL's confirmed sales process. International website checkout uses Stripe when the deployed integration is enabled; the current code does not include website-native WeChat Pay or Alipay endpoints.
- Pickle, Fries, Oreo and Bagel are the current public cast and now have owner-approved English biographies. Tangyuan and Pizza remain preserved historical/internal records.

The proposed English master in docs/ENGLISH_EDITORIAL_MASTER.md incorporates these clarifications.

## Classification

- **ERROR** — incorrect, broken, placeholder, or clearly misplaced content.
- **DUPLICATE** — unnecessary repetition of editorial content.
- **REWRITE** — awkward, generic, unclear, or inconsistent wording.
- **VERIFY** — a factual claim that cannot be confirmed from the approved material currently in the repository.
- **OK** — suitable as published or supported by the available source material.

Verification labels used below:

- **Verified in project** — supported by the current code, product record, supplied image, poster, or another inspectable project asset.
- **Visually verified** — the image and its caption or product type correspond.
- **Owner confirmation required** — the repository does not contain enough approved evidence to publish the claim as fact.
- **Operational confirmation required** — depends on current inventory, payment, location, opening-hour, delivery, or channel configuration.

## Executive findings

1. The most urgent public content problem is the product catalogue. Four public bicycle records contain explicit Shopify-import placeholder copy, five handlebar bags share an unedited keyword fragment, and three safety accessories share a broken keyword list. Several titles and slugs are inconsistent.
2. Home, About, Station, Events, Universe, Contact, and the footer repeat the same “city system / future mini program missions” story. It obscures each page's purpose and presents future concepts as current services.
3. The Events page mixes documented exhibitions and photographs with undated template event cards. The exhibition images support ISPO Shanghai 2025 and a Shanghai bicycle exhibition dated May 5–8, 2026, but the generic event records do not contain enough evidence to be presented as actual events.
4. The character source is inconsistent. The Universe page uses Pickle, Fries, Oreo, and Bagel, while data/characters.ts defines Pickle, Tangyuan, and Pizza. Fries and Oreo have no English or Chinese descriptions.
5. Station food, repair, route support, member points, missions, address, and opening hours are not supported by a canonical operations record. The visual gallery is correctly paired with its captions, but service claims require confirmation.
6. The App page is the appropriate home for future-product language because it labels itself as a concept and identifies preview content as sample content. Other pages should describe only current, verified experiences.
7. Shipping copy is cautious and useful. It is the strongest current source for purchasing and fulfilment language, although the live payment state still needs operational confirmation.
8. There is no standalone Community page. Community material currently lives on Events and Station. This is acceptable if intentional, but navigation and future translations should use one consistent definition.

## Source-of-truth register

| Subject | Current evidence | Decision |
|---|---|---|
| Public product list and USD prices | data/products.ts and the current storefront filter | Use as the working catalogue, but confirm inventory, specifications, variants, and sale status before describing them as available. |
| Three-pair sock set | User-supplied set and individual product images; price supplied as USD 35 | Verified for product type, quantity, designs, and price. Size, fibre content, care, fit, and country of origin remain unverified. |
| Exhibitions | Event photographs and poster artwork | ISPO Shanghai 2025 is visually supported. The bicycle exhibition artwork shows Shanghai and May 5–8, 2026; confirm the exact official English event name before final copy. |
| Community images | Event and Station image assets | Captions are visually accurate. Exact dates, participant names, collaborators, and locations are not encoded in the assets. |
| Brand history | About page copy only | No independent approved history record was found. “Began as…” must remain flagged until confirmed. |
| Station services | Station page copy and photographs | Drinks and community gathering are visually supported. Food menu, repair basics, route information, address, hours, and pickup procedure require confirmation. |
| Character canon | Universe page conflicts with data/characters.ts | Owner must confirm the canonical cast, names, roles, and stories before cleanup or translation. |
| Mini program | App concept page and repeated aspirational copy | Treat as a concept/in-development experience unless a live product and approved feature list are supplied. |
| Contact channels | Public email and linked Instagram/YouTube | Email and linked social handles are present in the project. Confirm the WeChat handle and monitored response channels. |
| Checkout and payment | Shipping page, cart components, and environment-controlled payment code | Confirm the live deployment setting. Public policy currently says online card checkout is unavailable. |
| Stockists and wholesale | Stockists page | No public stockist list is supplied. Keep enquiry language; do not imply stores or regions that are not documented. |

## Page and component audit

### Homepage — /

| Section/component | Original text | Class | Proposed correction | Reason | Verification status |
|---|---|---:|---|---|---|
| Hero description | “SGL is a city station for riding, coffee, light food, daily goods, community events and playful check-in missions.” | VERIFY | “SGL brings together cycling goods, station life and community moments in Shanghai.” | The current sentence presents food and missions as established services. The shorter version uses only broadly supported subjects. | Station location and exact offer still need owner confirmation. |
| Chinese hero paragraph | “SGL 把日常运动变成一套可以被参与的生活系统。” | DUPLICATE | Translate the approved English hero after English sign-off. | It repeats the “system” claim and should not become an independent source. | Translation deferred. |
| Station cards | “Park loops, city routes, night rides and check-in missions”; “Coffee, drinks, light food…”; “future real-world mini game.” | VERIFY | Keep Ride and Refuel limited to confirmed activities; move all mini-game language to /app. | Current and future services are mixed together. | Owner confirmation required for routes, food, and check-ins. |
| Event cards | Century Park Ride / Night Ride & Beer / West Bund Pop-up with seasonal labels | VERIFY | Replace with confirmed event records, or use a neutral link: “See documented exhibitions and community moments.” | data/events.ts contains undated template summaries, not verifiable event records. | Owner confirmation required. |
| Shop introduction | “Everyday products for city riding, park loops, station stops and small adventures.” | OK | No substantive correction required. | Clear and appropriate for the homepage. | Verified as general editorial description. |
| Station System artwork | “Goods, rides, coffee, routes.” and the live product count | OK | Keep, provided “coffee” remains a current Station offer. | Compact navigation-oriented copy; count is data-driven. | Product count verified; Station offer requires operational confirmation. |

### About — /about

| Section/component | Original text | Class | Proposed correction | Reason | Verification status |
|---|---|---:|---|---|---|
| Page heading | “Seagull Station is a city system for small adventures.” | DUPLICATE | “The Seagull Labs connects products, cycling and shared city life.” | Distinguishes About from the homepage and avoids treating a metaphor as a fact. | Proposed language uses visible project themes only. |
| Brand history | “SGL began as a product and riding culture project, then gradually grew into…” | VERIFY | Retain only after supplying an approved founding/history record. Interim: “SGL brings together products, riding culture and Station-led community activity.” | The chronology is not supported elsewhere in the project. | Owner confirmation required. |
| Principles | “Move through the city”; “Build from real places”; “Make daily life playable.” | REWRITE | Keep the first two after factual review. Replace the third with a present-tense principle based on confirmed work, or label it as a future direction. | The third principle turns purchases and check-ins into a game and duplicates app strategy. | Partial confirmation required. |
| Brand Structure | “Goods, station, community and future app.” plus the mini-program system paragraph | DUPLICATE | Remove future-product mechanics from About. Summarize the roles of goods, Station, and community in two factual sentences. | This belongs on /app and repeats Station, Events, and Universe. | App concept is verified; live system is not. |
| Anniversary image and night-ride film | “One year anniversary”; “Night ride film” | OK | Keep. Add dates only when confirmed. | Images match the labels; no unsupported date is currently added. | Visually verified. |
| What We Make | “Bags, socks, caps, riding accessories, station goods and future seasonal drops…” | REWRITE | “Bags, socks, caps, riding accessories and small goods for everyday movement.” | Removes speculative “future drops” and matches the public catalogue. | Verified from current catalogue. |
| What We Build | “A playable city layer” and “member cards, character missions, route check-ins…” | DUPLICATE | Move this concept to /app, clearly labelled as in development. Replace with an approved brand identity paragraph. | Repeats speculative product mechanics. | Owner confirmation required. |

### Shop — /shop

| Section/component | Original text | Class | Proposed correction | Reason | Verification status |
|---|---|---:|---|---|---|
| English introduction | “SGL goods for city riding, park loops, station stops and everyday movement…” | OK | Keep, with “frames, bags, wearables and accessories” aligned to the final catalogue taxonomy. | Clear collection-focused copy. | Verified from public categories. |
| Chinese purchasing statement | “商品购买入口将陆续接入淘宝、小程序与门店客服。” | VERIFY | Translate the approved current ordering method only. Suggested interim: “Contact SGL to confirm stock, payment and delivery.” | It promises Taobao and mini-program channels that are not documented as live. | Operational confirmation required. |
| Category labels | Frames / Bags & Carry / Wear & Ride / Accessories / Coffee & Refuel | REWRITE | Adopt one title-case taxonomy and use it consistently in data, cards, metadata, and translations. | Current source casing and category mapping are inconsistent. | Catalogue structure verified. |
| After Dark editorial card | “Night routes. Small wheels. Ride after sunset. Refuel at the station.” | OK | Keep. | The image shows a rider and small-wheel bicycle at night. | Visually verified. |

### Product detail template — /shop/[slug]

| Section/component | Original text | Class | Proposed correction | Reason | Verification status |
|---|---|---:|---|---|---|
| Placeholder fallback | “{Product} from The Seagull Labs {category} collection. Contact SGL for available options and product details.” | REWRITE | Use approved, product-specific descriptions. Keep the fallback only as a temporary safety net. | It prevents raw Shopify placeholders from rendering but remains generic and harms product clarity and SEO. | Product-specific facts required. |
| Filtered details | Import and variant notes are hidden at render time | ERROR | Remove editorial placeholders from the source records and replace them with verified specifications. | Hidden bad data remains the source for metadata, maintenance, and future localization. | Verified in data/products.ts. |
| Price and purchase note | “Prices are shown in USD. Delivery costs are confirmed separately.” | OK | Keep and align with /shipping. | Clear and cautious. | Verified in code; live checkout state still operational. |
| Product structured data | Offer contains price and currency but no availability state | VERIFY | Add availability only from live inventory truth; otherwise avoid implying in-stock status. | Search engines may interpret an Offer as purchasable even when stock and checkout are not confirmed. | Operational confirmation required. |

### Station — /station

| Section/component | Original text | Class | Proposed correction | Reason | Verification status |
|---|---|---:|---|---|---|
| Hero description | “SGL Station is a city refuel point combining riding culture, coffee, light food, station goods, events and future mini program missions.” | VERIFY | “SGL Station is a Shanghai gathering point for drinks, SGL goods and community activity.” | Removes unverified food and product-system claims while preserving the visually supported role. | Confirm exact location wording and current offer. |
| Coffee & Drinks | “Coffee, craft drinks, seasonal specials…” | VERIFY | Publish a concise current offer from an approved menu. | Photos show drinks, but do not verify every product category or seasonality. | Operational confirmation required. |
| Light Food | “Sandwiches, fries, small plates…” | VERIFY | Replace with a current menu summary or remove until confirmed. | No menu source was found. | Owner confirmation required. |
| Ride Support | “water, rest, repair basics, route information and community ride support.” | VERIFY | List only services confirmed by Station staff. | Repair and route support are operational claims. | Owner confirmation required. |
| Check-in System | “Future mini program missions, park loops, member points…” | DUPLICATE | Move to /app and label as an in-development concept. | Repeats speculative content and distracts from the physical Station. | App concept verified; live availability not verified. |
| Station Logic / Future System / Coming Next | “From one store to a playable city network” and future feature list | DUPLICATE | Replace with verified practical information: address, opening hours, current menu/services, pickup procedure, and event contact. | Visitors need usable Station information; strategic product copy belongs elsewhere. | Address/hours/services required. |
| Station gallery captions | Evening refuel / On tap / At the counter / A fresh pour / A little pause / Better together | OK | Keep. | Every caption corresponds to the inspected image. | Visually verified. |
| Station Stories image | “Meet at the Station” character scene | OK | Keep as a clearly labelled illustration, without implying a photographed location. | The image is character artwork set at an SGL kiosk. | Visually verified as illustration. |

### Events and Community — /events

| Section/component | Original text | Class | Proposed correction | Reason | Verification status |
|---|---|---:|---|---|---|
| Hero | “SGL events connect city riding… and future mini program missions.” | DUPLICATE | “SGL events bring together community rides, Station gatherings, exhibitions and outdoor pop-ups.” | Keeps the page focused on documented events and removes app strategy. | Supported by inspected photographs; exact event names still require confirmation. |
| Calendar introduction | “Anniversary moments, night rides and the next reasons to meet at the station.” | REWRITE | “Posters and announcements from SGL rides, gatherings and pop-ups.” | More precise and avoids implying a complete chronological calendar. | Verified as a poster gallery. |
| Calendar posters | West Bund 2026; Night Ride & Beer; Autumn Day; Coffee; Craft Beer | VERIFY | Preserve the artwork. Add structured dates/locations only after matching each poster to an approved event record. | Several posters contain text, but the page has no canonical event record or archival status. | Manual event confirmation required. |
| Exhibition section | “From ISPO Shanghai 2025 to the 2026 Shanghai International Bicycle Exhibition.” | VERIFY | “SGL at ISPO Shanghai 2025 and a Shanghai bicycle exhibition, May 5–8, 2026.” Use the official 2026 English event name once confirmed. | Participation and dates are visually supported; exact naming should match the organiser. | Partially visually verified. |
| Community Moments gallery | Eight short captions | OK | Keep. Add dates, collaborators, or locations only from approved event records. | Captions accurately describe the images without inventing details. | Visually verified. |
| Event format cards | Century Park Ride / Beer After Ride / SGL Pop-up Station | VERIFY | Convert to actual event entries with date, place, collaborator, and archival/upcoming status, or relabel as “Formats” without implying past events. | Current copy reads as real events but contains generic dates such as “Seasonal.” | Owner confirmation required. |
| Event System | “Later, each event can connect to the mini program…” | DUPLICATE | Remove from Events and keep future registration/reward concepts on /app. | Internal product strategy is misplaced on a public event archive. | In-development concept only. |
| Coming Soon | Future system CTA | REWRITE | Use a factual CTA: “Follow SGL channels for confirmed dates and routes.” | More useful and avoids promising unapproved features. | Contact channels verified. |

### SGL Universe — /universe

| Section/component | Original text | Class | Proposed correction | Reason | Verification status |
|---|---|---:|---|---|---|
| Canonical character list | Page: Pickle, Fries, Oreo, Bagel. Data file: Pickle, Tangyuan, Pizza. | ERROR | Choose one approved character source and make the page, data, metadata, alt text, and translations derive from it. | Two incompatible casts create factual and localization errors. | Owner decision required. |
| Fries record | Role “薯条”; empty English and Chinese descriptions | ERROR | Add an approved English name, role, and short character story, then translate from that master. | Public character card is incomplete. | Owner content required. |
| Oreo record | Role “奥利奥”; empty English and Chinese descriptions | ERROR | Add an approved English name, role, and short character story, then translate from that master. | Public character card is incomplete. | Owner content required. |
| Pickle and Bagel stories | Detailed personality and story descriptions | VERIFY | Keep only after confirming these are approved character biographies. | Images support the character identity, but not the written canon. | Owner confirmation required. |
| Hero universe claim | “built from characters, routes, check-ins, member cards, goods, events and real places…” | DUPLICATE | Focus on the characters and illustrated stories. Move membership and check-in mechanics to /app. | Keeps Universe editorial rather than product-strategy focused. | Character names/canon require confirmation. |
| “Real-world mini game” section | Characters become member-card types, task guides, rewards and product lines | VERIFY | Label as “Concept direction” or remove until approved. | Describes future mechanics as a planned system without a product source. | Owner confirmation required. |

### App concept — /app

| Section/component | Original text | Class | Proposed correction | Reason | Verification status |
|---|---|---:|---|---|---|
| Page status | “App concept”; “Mini program preview”; “A look at the experience in development.” | OK | Keep prominently visible. | Correctly distinguishes concept work from a live service. | Verified in page copy. |
| Preview disclaimer | “Preview screens use sample content. Station menu prices shown in CNY.” | OK | Keep. Add a “not currently available” statement if the mini program is not public. | Clear disclosure for sample content. | Availability confirmation required. |
| Feature narratives | Routes, checkpoints, rewards, character-led missions | VERIFY | Keep as concept descriptions only; avoid guarantees, launch dates, or current-service language. | This is the correct page for aspirational product storytelling. | Concept status verified; scope not approved. |

### Contact — /contact

| Section/component | Original text | Class | Proposed correction | Reason | Verification status |
|---|---|---:|---|---|---|
| Contact introduction | Orders, pickup, events, collaborations, wholesale and community rides | VERIFY | Keep only the enquiry types the team currently handles. | These are service promises. | Operational confirmation required. |
| WeChat | “seagulllabs” | VERIFY | Confirm the exact searchable WeChat ID and whether it is monitored for orders. | No linked or independent source is present. | Owner confirmation required. |
| Station card | “Seagull Station” with services but no address or hours | ERROR | Add confirmed address, opening hours, map/contact action, and visit disclaimer; otherwise direct visitors to contact before visiting. | The page invites visits without enough practical information. | Owner information required. |
| Fast Order | “preferred payment method” | REWRITE | “Send the product, option, quantity, and destination. SGL will confirm stock, total, payment, and delivery.” | Aligns with the cautious Shipping policy and avoids implying selectable payment methods. | Supported by /shipping. |
| Collaboration | Broad list of accepted partnership types | VERIFY | Confirm which collaborations are currently open; otherwise use “For collaboration enquiries, send a short proposal…” | Avoids promising categories the team may not support. | Owner confirmation required. |

### Stockists / wholesale — /stockists

| Section/component | Original text | Class | Proposed correction | Reason | Verification status |
|---|---|---:|---|---|---|
| Intro | “bringing The Seagull Labs to your neighbourhood.” | REWRITE | “Contact SGL for current retail availability or wholesale enquiries.” | More direct and less generic. | Enquiry email verified. |
| Seagull Station | “Please confirm the collection address, opening times and your item before visiting.” | OK | Keep until public location details are approved. | Correctly avoids publishing unknown operational details. | Operational confirmation still required. |
| Stockist directory | “Our public stockist directory is being prepared.” | VERIFY | Keep only if a directory is actively planned; otherwise say “No public stockist directory is currently available.” | “Being prepared” is a roadmap claim. | Owner confirmation required. |
| Wholesale CTA | Requests store, location, website, and products of interest | OK | Keep. | Clear and useful for buyer enquiries. | Verified as an enquiry workflow. |

### Sales, shipping and returns — /shipping

| Section/component | Original text | Class | Proposed correction | Reason | Verification status |
|---|---|---:|---|---|---|
| Ordering and availability | Confirm stock and payment before paying; cart does not reserve stock | OK | Keep. | Accurate, cautious, and consistent with the current enquiry flow. | Verify against live inventory process. |
| Prices and payment | USD prices; delivered total separate; online card checkout unavailable | VERIFY | Keep if the live payment environment is disabled. Update immediately if Stripe is enabled. | Policy must match the deployed checkout. | Operational confirmation required. |
| Delivery and international orders | Quote-based, no published destination/rate list | OK | Keep until a formal delivery table exists. | Avoids invented markets, rates, and timeframes. | Operationally cautious. |
| Returns | Request terms and instructions before returning | OK | Keep, subject to legal review for target markets. | Clear process without fabricating a universal policy. | Legal/operational review recommended. |

### Cart — /cart and checkout result — /checkout/success

| Section/component | Original text | Class | Proposed correction | Reason | Verification status |
|---|---|---:|---|---|---|
| Cart notices | USD, shipping confirmed separately, inventory confirmed before payment, cart does not reserve stock | OK | Keep aligned with /shipping. | Clear and consistent. | Live payment state still requires confirmation. |
| Language mixture | English interface with some Chinese explanatory text | REWRITE | Finish the English master first, then provide complete locale versions instead of mixing languages in one view. | Required for the later multilingual implementation. | Translation deferred. |
| Checkout result | States the page is not proof of payment | OK | Keep. | Prevents a misleading confirmation state. | Verified in current flow. |

### Header, footer, metadata and reusable components

| Section/component | Original text | Class | Proposed correction | Reason | Verification status |
|---|---|---:|---|---|---|
| Header navigation | Shop, Station, Events, Universe, App, About, Stockists, Sales & Shipping | OK | Keep; decide whether “Community” requires its own route before localization. | Navigation is clear and all links resolve to public sections. | Verified in project. |
| Footer description | “SGL is a city station for riding, coffee, light food, goods, events, characters and future check-in missions.” | DUPLICATE | “SGL makes cycling goods and shares Station life, events and city stories.” | Removes speculative services and repeated homepage copy. | Final wording depends on approved brand definition. |
| Footer social links | Email, YouTube, Instagram | OK | Keep after confirming channel ownership and monitoring. | Links are explicit and useful. | Present in project; ownership not independently verified. |
| Page metadata | Several titles/descriptions repeat Station services, future systems, or unverified event names | VERIFY | Rewrite each title and description from the approved page master after factual cleanup. | Search snippets must not preserve claims removed from visible copy. | Deferred until English sign-off. |
| Sitemap and canonical URLs | Public pages and public product routes are included | OK | Keep; regenerate only if routes or product visibility changes. | Technical SEO structure is present. | Verified in code. |
| Product cards/purchase components | Draw directly from product records | OK | Preserve the component behavior; correct the source records. | One source correction will propagate consistently. | Verified in code. |

## Public product audit

The proposed descriptions below intentionally avoid materials, dimensions, fit, water resistance, reflectivity performance, component standards, or origin unless the current project contains evidence. They are safe editorial directions, not final specifications.

| URL | Product | Class | Original problem | Proposed correction | Verification status |
|---|---|---:|---|---|---|
| /shop/sgl-three-pair-sock-set | SGL Three-Pair Sock Set — $35 | OK / VERIFY | Core copy is accurate, but size, materials, care, and fit are missing. | Keep: “A coordinated set of three SGL sock designs for everyday movement and riding.” Add specifications only from supplier data. | Product type, set quantity, designs, and price visually/user verified. |
| /shop/sgl-house-blend-01 | SGL House Blend 01 — 450g — $18 | VERIFY | Origins, altitude, roast, and tasting notes are specific factual claims. | Retain only after label/roaster confirmation; otherwise limit copy to verified net weight and approved roast profile. | Owner/supplier confirmation required. |
| /shop/seagull-cap-khaki-brown | Sea Gull Cap — Khaki / Brown — $50 | DUPLICATE / VERIFY | Same one-line description as the other colourways; no size, fabric, closure, or care details. | Treat as one cap family with colour variants if the construction is identical. | Image/title likely aligned; specifications required. |
| /shop/seagull-cap-lavender | Sea Gull Cap — Lavender — $50 | DUPLICATE / VERIFY | Same as above. | Same family description, with Lavender as the colour. | Specifications required. |
| /shop/seagull-cap-black-grey | Sea Gull Cap — Black / Grey — $50 | DUPLICATE / VERIFY | Same as above. | Same family description, with Black / Grey as the colour. | Specifications required. |
| /shop/chrissy | Chrissy — $899 | ERROR | Public source contains “from the original Shopify catalog” and “replace this copy.” | “Chrissy bicycle/frame by The Seagull Labs. Contact SGL for the current build, sizes, colours and availability.” Use “bicycle” or “frame” only after confirming what the price includes. | Image aligns; product configuration required. |
| /shop/chrissy-team | Chrissy Team — $2,299 | ERROR | Same placeholder and imported-variant language. | Product-specific bicycle/frame description after confirming material, geometry, included components, sizes, and colourways. | Image aligns; specifications required. |
| /shop/chrissy-special | Chrissy Special — $1,299 | ERROR | Same placeholder and imported-variant language. | Product-specific bicycle/frame description after confirming the difference from Chrissy and Chrissy Team. | Image aligns; specifications required. |
| /shop/seat-bag | Seat Bag — $30 | REWRITE / VERIFY | Generic “city riding, station stops, travel…” template; “Type: bags” is not useful. | “A compact SGL bag designed to mount beneath a bicycle saddle.” Add attachment, dimensions, capacity, and material only when confirmed. | Product type visually verified. |
| /shop/sports-bandana-outdoor-magic-scarf | Sports Bandana \| Outdoor Magic Scarf — $20 | REWRITE | Awkward title and generic movement copy. | Preferred title: “SGL Sports Bandana” or “SGL Neck Gaiter,” after owner naming decision. Describe only the printed wearable shown. | Product image visually verified; canonical name required. |
| /shop/bike-cover | Bike Cover M — $30 | REWRITE / VERIFY | Generic bag template; size “M” and fit are unexplained. | “SGL Bike Cover — M.” Add compatible bicycle dimensions, material, closure, and storage method from supplier data. | Cover type visually verified; size/fit unverified. |
| /shop/reveal-shoe-sack | Shoe Sack for Sport Shoes / Shoe Box — $15 | REWRITE | Awkward slash title and generic carry template. | “SGL Shoe Bag” or approved product name. “A zippered SGL bag for carrying a pair of shoes.” | Bag type visually verified; capacity and construction require confirmation. |
| /shop/cycling-leg-strap-pant-strap | Cycling leg Strap ｜ Pant Strap — $13 | ERROR | Broken keyword string: “Safety at Night High Quality Material Highly Reflective Wide Application.” | Preferred title: “SGL Cycling Trouser Strap.” “A wraparound strap that keeps a trouser cuff close to the leg while riding.” Add reflectivity only after testing/spec confirmation. | Form and use visually supported; performance claims unverified. |
| /shop/reflective-gear-safety-reflector-baby-seagull | Reflective Gear \| Safety Reflector Baby Seagull — $8 | ERROR | Same broken keyword string plus source placeholders. | Preferred title: “Baby Seagull Reflector.” “A Baby Seagull-shaped hanging accessory for bags or keys.” Use “reflective” only after material confirmation. | Shape/type visually verified; safety performance unverified. |
| /shop/pin | Three Seagulls Pin — $13 | ERROR | Description incorrectly claims “safer, lighter… city movement”; import placeholders remain. | “A set of three Seagull character pins on a presentation card.” Confirm whether USD 13 covers the set. | Set of three visually verified; material/size unverified. |
| /shop/handlebar-bags-purple | Handlebar Bags Purple — $50 | ERROR / DUPLICATE | Plural title and broken keyword fragment; water-resistance claim unverified. | “SGL Handlebar Bag — Purple.” “A compact drawcord bag designed to mount at the bicycle handlebar, with side mesh pockets visible in the product image.” | Product and colour visually verified; material/performance unverified. |
| /shop/handlebar-bags-reflect-grey | Handlebar Bags  Grey/Orange — $55 | ERROR / DUPLICATE | Double space, plural title, same fragment as all colourways. | “SGL Handlebar Bag — Grey / Orange.” Use one family description and verified variant-specific facts. | Product and colour visually verified. |
| /shop/handleber-bags-red | Handlebar Bags Red — $50 | ERROR / DUPLICATE | Typo in slug, plural title, same fragment. | “SGL Handlebar Bag — Red.” Preserve the current URL with a redirect if the slug is corrected. | Product and colour visually verified. |
| /shop/handleber-bags-grey | Handlebar Bags Grey — $50 | ERROR / DUPLICATE | Typo in slug, plural title, same fragment. | “SGL Handlebar Bag — Grey.” Preserve the current URL with a redirect if the slug is corrected. | Product and colour visually verified. |
| /shop/handlebar-bags | Handlebar Bags Black — $55 | ERROR / DUPLICATE | Plural title, same fragment, generic slug differs from the variant family. | “SGL Handlebar Bag — Black.” Normalize the family and variant structure after URL review. | Product and colour visually verified. |
| /shop/chrissy1 | Chrissy Ti — $1,999 | ERROR | Shopify placeholder and non-descriptive slug. | Product-specific titanium bicycle/frame description after confirming material, what is included, sizes, geometry, and variants. Preserve or redirect the current URL if renamed. | Bicycle image visually verified; “Ti” material and offer details require confirmation. |
| /shop/cover | Reflective Gear \| Safety Reflector Biking — $13 | ERROR | Broken safety keyword list, source placeholders, and non-descriptive slug. | Preferred title: “SGL Bicycle Reflector” or owner-approved name. Describe the illustrated hanging accessory without safety-performance claims until verified. | Bicycle illustration accessory visually verified; performance unverified. |

## Image and caption verification

| Page/asset group | Result | Notes |
|---|---|---|
| Station drink gallery | OK | All six captions accurately describe their photographs. |
| Events — ISPO | OK / VERIFY | Booth image visibly includes ISPO China 2025 branding. Confirm the official event naming used in English. |
| Events — 2026 bicycle exhibition | OK / VERIFY | Booth and visitor images match an SGL cycling exhibition; supplied artwork shows Shanghai and May 5–8, 2026. Confirm the organiser's exact official English title. |
| Events — Community Moments | OK | Captions accurately describe the visible activity without inventing dates or names. |
| About anniversary artwork | OK | Artwork clearly states “1 Year Anniversary.” The precise anniversary date is not encoded in page content. |
| About night-ride video | OK | The label “Night ride film” matches the supplied media. |
| Shop After Dark image | OK | Shows a rider with a bicycle beneath a street light at night. |
| Public product images | OK / VERIFY | All inspected images correspond to the broad product type and colour. Technical properties and included components cannot be inferred from images. |

## Exact and near-duplicate content

| Duplicate group | Scope | Recommended resolution |
|---|---|---|
| “city station / city system / keep the city moving” | Home, About, Station, Contact, Footer | Keep one concise brand introduction on Home. Give About a factual identity/history role, Station practical visitor information, Contact an action-oriented role, and Footer a short neutral summary. |
| “future mini program missions / member points / check-ins / rewards” | Home, About, Station, Events, Universe, Footer | Centralize on /app as a clearly labelled concept. Remove or soften elsewhere unless a feature is currently live. |
| Cap description | Three cap colourways | Use a shared family description plus colour variants if construction is identical. |
| Handlebar-bag description | Five handlebar-bag colourways | Use one verified family description and normalized variant names. |
| Safety keyword description | Trouser strap and two hanging reflectors | Replace with separate product-specific descriptions. Do not reuse safety/performance claims without evidence. |
| Shopify archive placeholder | Chrissy, Chrissy Team, Chrissy Special, Chrissy Ti | Replace at the source with verified model-specific content. |
| Generic event formats | Home event cards and Events format cards | Replace with one canonical event dataset containing title, date, location, type, status, description, and media. |

## Information required before factual cleanup

1. Approved two- to four-sentence SGL history: founding year, original focus, when Station opened, and what is current today.
2. Canonical Station address, map link, opening hours, current menu categories, pickup process, and actual rider services.
3. Canonical character list and approved biographies for Pickle, Fries, Oreo, Bagel, Tangyuan, and Pizza; identify which characters are active or retired.
4. Approved event register with official title, date, venue/location, collaborators, status, and matching images/posters.
5. Product specification sheet for every public product, especially bicycles, caps, coffee, bags, safety accessories, and sizing.
6. Current public sales flow: card checkout status, payment currencies/methods, delivery regions, stock truth, station pickup, and return terms.
7. Confirmed retail/wholesale channels, WeChat ID, and any active stockists.
8. Mini-program status and approved feature wording: concept, development, beta, or live.

## Safe correction plan after approval

1. Remove public placeholder and import language from product source records.
2. Correct unambiguous grammar, spacing, singular/plural product titles, and keyword fragments without adding specifications.
3. Replace repeated future-system language outside /app with concise, factual page-specific copy.
4. Consolidate event records into one canonical dataset and keep unverified records out of public event listings.
5. Consolidate characters into one canonical dataset; do not delete unique characters until the owner confirms the active cast.
6. Update visible page copy, metadata, structured data, and reusable footer copy from the same approved English source.
7. Review the corrected English site page by page before creating Simplified Chinese, Japanese, or Korean translations.
8. After translation, run missing-string, duplicate, terminology, metadata, image-caption, link, and language-switch QA.

## Release gate

No editorial cleanup should be deployed until the owner confirms the factual review items above or explicitly approves neutral interim wording. The current report does not authorize a deployment.
