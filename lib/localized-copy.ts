import type { Locale } from "@/lib/i18n";
import type { Product } from "@/data/products";

type LocalizedPage = { title: string; description: string; eyebrow: string; heading: string; intro: string; secondary: string };

export const pageCopy: Record<Exclude<Locale, "en">, Record<string, LocalizedPage>> = {
  "zh-CN": {
    home: { title: "The Seagull Labs｜骑行产品、Station 与城市故事", description: "探索 SGL 产品、骑行文化、原创角色、上海 Seagull Station 与社群生活。", eyebrow: "城市骑行 / Station 好物 / 小小冒险", heading: "Seagull Station，让城市继续向前。", intro: "The Seagull Labs 将产品设计、骑行文化、影像、原创角色与上海真实运营的 Seagull Station 连接在一起。这里有咖啡、饮品、商品、活动和社群生活。", secondary: "SGL 微信小程序已于 2026 年 6 月上线；AR 互动正在开发中，计划于 2027 年初发布。" },
    about: { title: "关于 The Seagull Labs｜品牌历史与骑行文化", description: "了解 SGL 从产品、影像与骑行文化，走向展会、实体 Station 与数字互动体验的历程。", eyebrow: "关于 SGL", heading: "从产品、影像、骑行与真实地点中生长。", intro: "SGL 成立于 2023 年 6 月 9 日，从原创产品、影像和骑行文化出发，逐步参与行业展会，并在上海建立 Seagull Station。", secondary: "2026 年 6 月，SGL 微信小程序上线。原创角色、城市任务与 AR 互动继续拓展这个真实城市世界。" },
    station: { title: "上海 Seagull Station｜咖啡、骑行与社群", description: "到访上海浦东 Seagull Station：咖啡、饮品、SGL 商品、骑行文化与社群活动的真实空间。", eyebrow: "Seagull Station", heading: "为穿行城市的人准备的一处小站。", intro: "Seagull Station 是上海真实运营的实体空间，连接咖啡与饮品、零售商品、骑行社群、活动和聚会。", secondary: "地址：上海市浦东新区锦延路东绣路广场 L1。到访前请确认当日营业时间与商品库存。" },
    events: { title: "SGL 活动｜骑行、展会与 Station 聚会", description: "查看 SGL 的展会记录、社群骑行、户外快闪、Station 聚会与活动海报。", eyebrow: "SGL 活动", heading: "骑行、喝一杯、见面、留下记录。", intro: "SGL 的活动把城市骑行、咖啡饮品、Station 商品、展会与真实地点中的相聚连接起来。", secondary: "SGL 于 2025 年参加 ISPO Shanghai 和上海国际自行车展，并于 2026 年第二次参加上海自行车展。" },
    universe: { title: "SGL Universe｜原创角色与城市故事", description: "认识 Pickle、Fries、Oreo 与 Bagel，进入连接产品、地点与城市故事的 SGL 角色世界。", eyebrow: "SGL Universe", heading: "藏在日常移动里的可玩世界。", intro: "SGL Universe 从原创角色、产品、影像、路线、活动与城市中的真实地点生长出来。", secondary: "小程序已于 2026 年 6 月上线。AR 互动仍在开发中，计划于 2027 年初发布。" },
    app: { title: "SGL 微信小程序｜城市任务与 AR 路线图", description: "了解 2026 年 6 月上线的 SGL 微信小程序，以及持续开发中的角色任务与 AR 互动。", eyebrow: "SGL 微信小程序", heading: "你的城市，你的下一场小冒险。", intro: "SGL 微信小程序已于 2026 年 6 月正式上线，把 Station、商品、角色和城市体验连接在一起。", secondary: "不同功能处于不同阶段。AR 互动正在开发中，计划于 2027 年初发布，具体时间取决于开发与测试。" },
    contact: { title: "联系 The Seagull Labs｜订单与合作", description: "联系 SGL 咨询商品、配送、Station 到访、批发、活动与合作。", eyebrow: "联系 SGL", heading: "订单、自提、活动与合作。", intro: "可通过 hello@theseagulllabs.com 联系 SGL，咨询商品库存、国际订单、Station 自提、展会、社群骑行与品牌合作。", secondary: "Seagull Station：上海市浦东新区锦延路东绣路广场 L1。到访前请确认营业时间。" },
    stockists: { title: "SGL 零售渠道与批发合作", description: "咨询 SGL 当前零售渠道、上海 Station 自提、批发及零售合作。", eyebrow: "寻找 SGL", heading: "零售渠道", intro: "浏览官网商品并联系 SGL 确认库存、配送及上海 Station 自提。", secondary: "目前没有公开的零售商目录。商店与生活方式空间可发送所在地、网站和感兴趣的产品进行合作咨询。" },
    shipping: { title: "销售、配送与退换｜The Seagull Labs", description: "了解 SGL 的库存确认、付款、国际配送、Station 自提与售后支持。", eyebrow: "顾客信息", heading: "销售、配送与退换", intro: "网站价格以美元显示。国际订单在在线结账开启时通过 Stripe 安全卡支付；中国大陆订单由 SGL 确认后支持微信支付和支付宝。", secondary: "运费、税费、库存与发货时间需按订单确认。购物车不会预留库存。" },
    cart: { title: "购物车｜The Seagull Labs", description: "查看 SGL 购物车并在可用时进入安全结账。", eyebrow: "SGL 商店", heading: "购物车", intro: "价格以美元显示，运费和库存将在付款前确认。", secondary: "中国大陆订单可联系 SGL 使用微信支付或支付宝；国际在线结账由 Stripe 提供支持。" },
    success: { title: "订单状态｜The Seagull Labs", description: "查看 SGL 订单返回状态。", eyebrow: "订单状态", heading: "订单已接收", intro: "此页面仅表示结账返回已收到，不代表付款已经确认。", secondary: "请以支付确认和 SGL 的订单通知为准。" }
  },
  "ja-JP": {
    home: { title: "The Seagull Labs｜サイクリング用品、Station、都市の物語", description: "SGLのプロダクト、サイクリングカルチャー、キャラクター、上海のSeagull Stationとコミュニティを紹介します。", eyebrow: "都市のライド / Stationグッズ / 小さな冒険", heading: "Seagull Stationが、街の動きをつないでいく。", intro: "The Seagull Labsは、プロダクトデザイン、サイクリングカルチャー、写真、オリジナルキャラクター、上海で実際に営業するSeagull Stationをつなぎます。", secondary: "SGL WeChatミニプログラムは2026年6月に公開。AR体験は開発中で、2027年初頭の公開を予定しています。" },
    about: { title: "The Seagull Labsについて｜ブランドの歩み", description: "プロダクト、写真、サイクリングカルチャーから展示会、Station、デジタル体験へ広がるSGLの歩み。", eyebrow: "SGLについて", heading: "プロダクト、写真、ライド、実在する場所から育ったブランド。", intro: "SGLは2023年6月9日に設立され、オリジナルプロダクト、写真、サイクリングカルチャーから展示会と上海のSeagull Stationへ発展しました。", secondary: "2026年6月にWeChatミニプログラムを公開。キャラクター、都市ミッション、AR体験が次の章をつくります。" },
    station: { title: "Seagull Station上海｜コーヒー、ライド、コミュニティ", description: "上海・浦東のSeagull Station。コーヒー、ドリンク、SGLグッズ、サイクリングカルチャー、イベントが集まる実店舗です。", eyebrow: "Seagull Station", heading: "街を移動する人のための、小さな停留所。", intro: "Seagull Stationは上海で実際に営業する場所です。コーヒーとドリンク、リテール、サイクリングコミュニティ、イベントがひとつにつながります。", secondary: "所在地：中国・上海市浦東新区、錦延路と東繡路の交差点広場 L1。営業時間と在庫は来店前にご確認ください。" },
    events: { title: "SGLイベント｜ライド、展示会、Stationの集まり", description: "SGLの展示会、コミュニティライド、ポップアップ、Stationイベントとポスターアーカイブ。", eyebrow: "SGLイベント", heading: "走る、飲む、出会う、記録する。", intro: "SGLのイベントは、都市のライド、コーヒー、Stationグッズ、展示会、リアルな場所で過ごす時間をつなぎます。", secondary: "SGLは2025年にISPO Shanghaiと上海国際自転車展へ参加し、2026年に同自転車展へ2回目の出展を行いました。" },
    universe: { title: "SGL Universe｜オリジナルキャラクターと都市の物語", description: "Pickle、Fries、Oreo、Bagelがプロダクト、場所、都市の物語をつなぐSGL Universe。", eyebrow: "SGL Universe", heading: "日々の移動の中に隠れた、遊べる世界。", intro: "SGL Universeは、オリジナルキャラクター、プロダクト、写真、ルート、イベント、都市の実在する場所から育ちます。", secondary: "ミニプログラムは2026年6月に公開。AR体験は開発中で、2027年初頭の公開を予定しています。" },
    app: { title: "SGL WeChatミニプログラム｜都市ミッションとAR", description: "2026年6月公開のSGL WeChatミニプログラムと、開発中のキャラクターミッション、AR体験。", eyebrow: "SGL WeChatミニプログラム", heading: "あなたの街。次の小さな冒険。", intro: "SGL WeChatミニプログラムは2026年6月に公開され、Station、グッズ、キャラクター、都市体験をつなぎます。", secondary: "機能ごとに開発状況は異なります。AR体験は開発中で、テストを経て2027年初頭の公開を予定しています。" },
    contact: { title: "The Seagull Labsへのお問い合わせ", description: "商品、配送、Station訪問、卸売、イベント、コラボレーションについてSGLへお問い合わせください。", eyebrow: "SGLへ連絡", heading: "注文、受取、イベント、コラボレーション。", intro: "hello@theseagulllabs.com まで、在庫、海外注文、Station受取、展示会、コミュニティライド、ブランド協業についてお問い合わせください。", secondary: "Seagull Station：中国・上海市浦東新区、錦延路と東繡路の交差点広場 L1。来店前に営業時間をご確認ください。" },
    stockists: { title: "SGL取扱店・卸売のお問い合わせ", description: "現在の販売状況、上海Station受取、卸売・小売パートナーについてお問い合わせください。", eyebrow: "SGLを探す", heading: "取扱店", intro: "オンラインコレクションをご覧いただき、在庫、配送、上海Station受取についてSGLへご確認ください。", secondary: "公開中の取扱店一覧はありません。販売店の所在地、ウェブサイト、希望商品を添えてお問い合わせください。" },
    shipping: { title: "販売・配送・返品｜The Seagull Labs", description: "在庫確認、支払い、海外配送、Station受取、返品サポートについて。", eyebrow: "お客様情報", heading: "販売・配送・返品", intro: "価格は米ドル表示です。オンライン決済が有効な場合、海外注文はStripeによる安全なカード決済を利用できます。中国本土の注文はSGL確認後、WeChat PayまたはAlipayに対応します。", secondary: "送料、税金、在庫、発送時期は注文ごとに確認します。カート追加では在庫は確保されません。" },
    cart: { title: "カート｜The Seagull Labs", description: "SGLのカートを確認し、利用可能な場合は安全な決済へ進みます。", eyebrow: "SGLショップ", heading: "ショッピングカート", intro: "価格は米ドル表示です。送料と在庫は支払い前に確認されます。", secondary: "中国本土ではSGLへ連絡してWeChat PayまたはAlipayを利用できます。海外オンライン決済はStripeが処理します。" },
    success: { title: "注文状況｜The Seagull Labs", description: "SGL注文の戻り状況を確認します。", eyebrow: "注文状況", heading: "注文を受け付けました", intro: "このページは決済画面から戻ったことを示すもので、支払い完了の証明ではありません。", secondary: "支払い確認とSGLからの注文通知をご確認ください。" }
  },
  "ko-KR": {
    home: { title: "The Seagull Labs｜사이클링 굿즈, Station, 도시 이야기", description: "SGL 제품, 사이클링 문화, 캐릭터, 상하이 Seagull Station과 커뮤니티를 만나보세요.", eyebrow: "도시 라이딩 / Station 굿즈 / 작은 모험", heading: "Seagull Station이 도시의 움직임을 이어갑니다.", intro: "The Seagull Labs는 제품 디자인, 사이클링 문화, 사진, 오리지널 캐릭터와 상하이에서 실제 운영되는 Seagull Station을 연결합니다.", secondary: "SGL WeChat 미니 프로그램은 2026년 6월 출시되었습니다. AR 경험은 개발 중이며 2027년 초 공개를 목표로 합니다." },
    about: { title: "The Seagull Labs 소개｜브랜드 역사", description: "제품, 사진, 사이클링 문화에서 전시, Station, 디지털 경험으로 확장된 SGL의 여정.", eyebrow: "SGL 소개", heading: "제품, 이미지, 라이딩과 실제 장소에서 성장했습니다.", intro: "SGL은 2023년 6월 9일 설립되어 오리지널 제품, 사진, 사이클링 문화에서 전시와 상하이 Seagull Station으로 발전했습니다.", secondary: "2026년 6월 WeChat 미니 프로그램을 출시했고, 캐릭터와 도시 미션, AR 경험으로 다음 장을 만들고 있습니다." },
    station: { title: "상하이 Seagull Station｜커피, 라이딩, 커뮤니티", description: "상하이 푸둥의 Seagull Station은 커피, 음료, SGL 굿즈, 사이클링 문화와 이벤트가 만나는 실제 공간입니다.", eyebrow: "Seagull Station", heading: "도시를 움직이는 사람들을 위한 작은 정거장.", intro: "Seagull Station은 상하이에서 실제 운영되는 공간으로 커피와 음료, 리테일, 사이클링 커뮤니티, 이벤트를 연결합니다.", secondary: "주소: 중국 상하이 푸둥신구 진옌로·둥슈로 광장 L1. 방문 전 영업시간과 재고를 확인해 주세요." },
    events: { title: "SGL 이벤트｜라이드, 전시, Station 모임", description: "SGL 전시, 커뮤니티 라이드, 팝업, Station 모임과 포스터 아카이브.", eyebrow: "SGL 이벤트", heading: "라이드하고, 마시고, 만나고, 기록합니다.", intro: "SGL 이벤트는 도시 라이딩, 커피와 음료, Station 굿즈, 전시와 실제 장소에서의 시간을 연결합니다.", secondary: "SGL은 2025년 ISPO Shanghai와 상하이 국제 자전거 전시회에 참가했고 2026년 같은 자전거 전시회에 두 번째로 참가했습니다." },
    universe: { title: "SGL Universe｜오리지널 캐릭터와 도시 이야기", description: "Pickle, Fries, Oreo, Bagel이 제품, 실제 장소와 도시 이야기를 연결하는 SGL Universe.", eyebrow: "SGL Universe", heading: "일상의 이동 속에 숨은 플레이 가능한 세계.", intro: "SGL Universe는 오리지널 캐릭터, 제품, 사진, 경로, 이벤트와 도시의 실제 장소에서 성장합니다.", secondary: "미니 프로그램은 2026년 6월 출시되었습니다. AR 경험은 개발 중이며 2027년 초 출시를 계획하고 있습니다." },
    app: { title: "SGL WeChat 미니 프로그램｜도시 미션과 AR", description: "2026년 6월 출시된 SGL WeChat 미니 프로그램과 개발 중인 캐릭터 미션, AR 경험.", eyebrow: "SGL WeChat 미니 프로그램", heading: "당신의 도시, 다음 작은 모험.", intro: "SGL WeChat 미니 프로그램은 2026년 6월 출시되어 Station, 굿즈, 캐릭터와 도시 경험을 연결합니다.", secondary: "기능별 개발 상태는 다릅니다. AR 경험은 개발 중이며 테스트를 거쳐 2027년 초 공개를 목표로 합니다." },
    contact: { title: "The Seagull Labs 문의", description: "제품, 배송, Station 방문, 도매, 이벤트와 협업에 대해 SGL에 문의하세요.", eyebrow: "SGL 문의", heading: "주문, 픽업, 이벤트와 협업.", intro: "hello@theseagulllabs.com으로 재고, 해외 주문, Station 픽업, 전시, 커뮤니티 라이드와 브랜드 협업을 문의해 주세요.", secondary: "Seagull Station: 중국 상하이 푸둥신구 진옌로·둥슈로 광장 L1. 방문 전 영업시간을 확인해 주세요." },
    stockists: { title: "SGL 판매처 및 도매 문의", description: "현재 판매처, 상하이 Station 픽업, 도매 및 리테일 파트너십을 문의하세요.", eyebrow: "SGL 찾기", heading: "판매처", intro: "온라인 컬렉션을 살펴보고 재고, 배송, 상하이 Station 픽업을 SGL에 확인해 주세요.", secondary: "현재 공개 판매처 목록은 없습니다. 매장 위치, 웹사이트, 관심 제품을 보내 파트너십을 문의해 주세요." },
    shipping: { title: "판매, 배송 및 반품｜The Seagull Labs", description: "재고 확인, 결제, 해외 배송, Station 픽업과 반품 지원 안내.", eyebrow: "고객 안내", heading: "판매, 배송 및 반품", intro: "가격은 미국 달러로 표시됩니다. 온라인 결제가 활성화된 경우 해외 주문은 Stripe의 안전한 카드 결제를 이용합니다. 중국 본토 주문은 SGL 확인 후 WeChat Pay 또는 Alipay를 지원합니다.", secondary: "배송비, 세금, 재고와 발송 일정은 주문별로 확인합니다. 장바구니 담기는 재고를 예약하지 않습니다." },
    cart: { title: "장바구니｜The Seagull Labs", description: "SGL 장바구니를 확인하고 가능한 경우 안전한 결제로 이동합니다.", eyebrow: "SGL 스토어", heading: "장바구니", intro: "가격은 미국 달러로 표시되며 배송비와 재고는 결제 전에 확인됩니다.", secondary: "중국 본토 주문은 SGL을 통해 WeChat Pay 또는 Alipay를 이용할 수 있습니다. 해외 온라인 결제는 Stripe가 처리합니다." },
    success: { title: "주문 상태｜The Seagull Labs", description: "SGL 주문 반환 상태를 확인합니다.", eyebrow: "주문 상태", heading: "주문이 접수되었습니다", intro: "이 페이지는 결제 화면에서 돌아왔음을 뜻하며 결제 완료 증명이 아닙니다.", secondary: "결제 확인과 SGL 주문 안내를 확인해 주세요." }
  }
};

const productDescriptions: Record<string, [string, string, string]> = {
  "sgl-three-pair-sock-set": ["日常出行与骑行使用的三双 SGL 袜子组合。", "日常の移動とライドに使える、3種類のSGLソックスセット。", "일상 이동과 라이딩을 위한 세 가지 SGL 양말 세트입니다."],
  "sgl-house-blend-01": ["深度烘焙咖啡豆，带有坚果、黄油、蜂蜜与黑巧克力风味。", "ナッツ、バター、ハチミツ、ダークチョコレートを感じる深煎りブレンド。", "견과류, 버터, 꿀, 다크초콜릿 향을 담은 다크 로스트 블렌드입니다."],
  "seat-bag": ["安装在自行车座垫下方、用于携带小件物品的紧凑型 SGL 座包。", "サドル下に装着し、小物を収納できるコンパクトなSGLサドルバッグ。", "자전거 안장 아래에 장착해 작은 소지품을 담는 컴팩트 SGL 새들백입니다."],
  "sports-bandana-outdoor-magic-scarf": ["适合骑行、户外活动与日常穿搭的 SGL 印花运动头巾。", "ライド、アウトドア、日常に使えるSGLプリントバンダナ。", "라이딩, 아웃도어와 일상 착용을 위한 SGL 프린트 반다나입니다."],
  "bike-cover": ["用于两次骑行之间遮盖自行车的 M 码 SGL 车罩。", "ライドの合間に自転車を覆う、MサイズのSGLバイクカバー。", "라이딩 사이 자전거를 덮어 두는 M 사이즈 SGL 자전거 커버입니다."],
  "reveal-shoe-sack": ["训练或旅行时用于携带并分隔鞋子的拉链 SGL 鞋袋。", "トレーニングや旅行時に靴を分けて収納できる、ファスナー付きSGLシューズバッグ。", "훈련이나 여행 중 신발을 분리해 보관하는 지퍼형 SGL 슈백입니다."],
  "cycling-leg-strap-pant-strap": ["骑行时将裤脚固定贴近腿部的包裹式束裤带。", "ライド中にパンツの裾を脚に沿わせるラップ式トラウザーストラップ。", "라이딩 중 바지 밑단을 다리에 고정하는 랩형 트라우저 스트랩입니다."],
  "reflective-gear-safety-reflector-baby-seagull": ["可挂在包、钥匙或随身物品上的 Baby Seagull 反光挂件。", "バッグや鍵に付けられるBaby Seagullデザインのリフレクター。", "가방, 열쇠와 일상 소지품에 달 수 있는 Baby Seagull 리플렉터입니다."],
  "pin": ["三枚 Seagull 角色徽章组合，配 SGL 展示卡。", "3種類のSeagullキャラクターピンをSGLカードにまとめたセット。", "세 가지 Seagull 캐릭터 핀을 SGL 카드에 담은 세트입니다."],
  "cover": ["适合挂在包袋和随身物品上的 SGL 自行车插画反光挂件。", "バッグや携行品に付けられる、SGL自転車イラストのリフレクター。", "가방과 소지품에 달 수 있는 SGL 자전거 일러스트 리플렉터입니다."]
};

const categoryTranslations: Record<string, [string, string, string]> = {
  "Wear & Ride": ["穿戴与骑行", "ウェア＆ライド", "웨어 & 라이드"],
  "Coffee & Refuel": ["咖啡与补给", "コーヒー＆補給", "커피 & 리퓨얼"],
  "Bikes / Frames": ["自行车 / 车架", "自転車／フレーム", "자전거 / 프레임"],
  "Bags & Carry": ["包袋与携带", "バッグ＆キャリー", "가방 & 캐리"],
  "Accessories": ["配件", "アクセサリー", "액세서리"]
};

const detailTranslations: Record<string, [string, string, string]> = {
  "Set of three pairs": ["三双组合", "3足セット", "세 켤레 세트"],
  "Three coordinated SGL designs": ["三款协调的 SGL 设计", "3種類のSGLデザイン", "세 가지 SGL 디자인"],
  "Net weight: 450g": ["净重：450g", "内容量：450g", "순중량: 450g"],
  "Dark roast blend": ["深度烘焙拼配", "深煎りブレンド", "다크 로스트 블렌드"],
  "Origins: Costa Rica, Brazil and Uganda": ["产地：哥斯达黎加、巴西与乌干达", "原産国：コスタリカ、ブラジル、ウガンダ", "원산지: 코스타리카, 브라질, 우간다"],
  "Tasting notes: nuts, butter, honey and dark chocolate": ["风味：坚果、黄油、蜂蜜与黑巧克力", "風味：ナッツ、バター、ハチミツ、ダークチョコレート", "향미: 견과류, 버터, 꿀, 다크초콜릿"],
  "Altitude: 1,200–1,800m": ["海拔：1,200–1,800m", "標高：1,200～1,800m", "고도: 1,200–1,800m"],
  "Embroidered Sea Gull logo": ["Sea Gull 刺绣标志", "Sea Gull刺繍ロゴ", "Sea Gull 자수 로고"],
  "Aluminum alloy frame": ["铝合金车架", "アルミニウム合金フレーム", "알루미늄 합금 프레임"],
  "Titanium alloy frame": ["钛合金车架", "チタン合金フレーム", "티타늄 합금 프레임"],
  "Original SGL bicycle model": ["SGL 原创自行车型号", "SGLオリジナル自転車モデル", "SGL 오리지널 자전거 모델"],
  "Options vary by size and colour": ["选项因尺码与颜色而异", "サイズとカラーにより仕様が異なります", "사이즈와 색상에 따라 옵션이 다릅니다"],
  "Options vary by size and finish": ["选项因尺码与表面处理而异", "サイズと仕上げにより仕様が異なります", "사이즈와 마감에 따라 옵션이 다릅니다"],
  "Size and style options available": ["提供尺码与款式选项", "サイズとスタイルを選択可能", "사이즈와 스타일 옵션 제공"],
  "Bicycle saddle bag": ["自行车座包", "自転車用サドルバッグ", "자전거 새들백"],
  "Printed SGL design": ["SGL 印花设计", "SGLプリントデザイン", "SGL 프린트 디자인"],
  "Size: M": ["尺码：M", "サイズ：M", "사이즈: M"],
  "Colour options available": ["提供颜色选项", "カラーを選択可能", "색상 옵션 제공"],
  "Zippered shoe bag": ["拉链鞋袋", "ファスナー付きシューズバッグ", "지퍼형 슈백"],
  "Five colour options": ["五种颜色选项", "5色展開", "다섯 가지 색상"],
  "Baby Seagull character design": ["Baby Seagull 角色设计", "Baby Seagullキャラクターデザイン", "Baby Seagull 캐릭터 디자인"],
  "Set of three pins": ["三枚徽章组合", "3個セット", "핀 세 개 세트"],
  "Zinc alloy": ["锌合金", "亜鉛合金", "아연 합금"],
  "Handlebar-mounted bag": ["车把安装包", "ハンドルバー取付バッグ", "핸들바 장착 가방"],
  "Drawcord closure": ["抽绳开合", "ドローコード開閉", "드로코드 여밈"],
  "Side mesh pockets": ["侧面网袋", "サイドメッシュポケット", "측면 메시 포켓"],
  "SGL cycling character artwork": ["SGL 骑行角色图案", "SGLサイクリングキャラクターアート", "SGL 사이클링 캐릭터 아트워크"]
};

export function localizedProduct(product: Product, locale: Exclude<Locale, "en">) {
  const index = locale === "zh-CN" ? 0 : locale === "ja-JP" ? 1 : 2;
  let description = productDescriptions[product.slug]?.[index];
  if (!description && product.slug.startsWith("seagull-cap")) description = ["带有 Sea Gull 刺绣标志的日常帽款。", "Sea Gull刺繍ロゴを配したデイリーキャップ。", "Sea Gull 자수 로고를 적용한 데일리 캡입니다."][index];
  if (!description && /handlebar-bags|handleber-bags/.test(product.slug)) description = ["安装在自行车车把位置的紧凑抽绳 SGL 车包，两侧带网袋。", "ハンドルバーに装着する、両側メッシュポケット付きのコンパクトなSGLドローコードバッグ。", "자전거 핸들바에 장착하는 컴팩트 드로코드 SGL 가방으로 양옆에 메시 포켓이 있습니다."][index];
  if (!description && product.slug === "chrissy1") description = ["采用钛合金车架的 SeaGull Labs Chrissy Ti。当前配置、尺码与库存请联系 SGL 确认。", "チタン合金フレームを採用したSeaGull Labs Chrissy Ti。仕様、サイズ、在庫はSGLへご確認ください。", "티타늄 합금 프레임을 사용한 SeaGull Labs Chrissy Ti입니다. 구성, 사이즈와 재고는 SGL에 확인해 주세요."][index];
  if (!description && product.slug.startsWith("chrissy")) description = [`采用铝合金车架的 SeaGull Labs ${product.title}。当前配置、尺码与库存请联系 SGL 确认。`, `アルミニウム合金フレームを採用したSeaGull Labs ${product.title}。仕様、サイズ、在庫はSGLへご確認ください。`, `알루미늄 합금 프레임을 사용한 SeaGull Labs ${product.title}입니다. 구성, 사이즈와 재고는 SGL에 확인해 주세요.`][index];
  return {
    ...product,
    category: categoryTranslations[product.category]?.[index] || product.category,
    description: description || product.description,
    details: product.details.map((detail) => detailTranslations[detail]?.[index] || detail)
  };
}
