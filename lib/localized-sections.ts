import { publicPageSections, type LocalizedLocale, type PublicPage } from "./content-schema";
import { pageCopy } from "./localized-copy";

export type SectionCopy = {
  kicker?: string;
  heading: string;
  body: string;
};

type LocaleWords = Record<string, SectionCopy>;

const zh: LocaleWords = {
  "home.shop": { kicker: "SGL 商品", heading: "为城市移动而设计", body: "浏览自行车、包袋、穿戴装备、咖啡与日常配件。" },
  "home.station": { kicker: "上海 · 浦东", heading: "Seagull Station", body: "一个集合咖啡、商品、骑行社群与线下活动的真实空间。" },
  "home.events": { kicker: "近期活动", heading: "一起骑行、见面与留下记录", body: "查看骑行、展会、Station 聚会和 SGL 活动档案。" },
  "about.principles": { kicker: "设计原则", heading: "从日常移动出发", body: "SGL 从骑行、步行、咖啡停靠和城市里的小路线开始。" },
  "about.brand-structure": { kicker: "品牌结构", heading: "一个真实据点，一套持续生长的故事", body: "产品、Station、活动、影像与数字体验共同组成 SGL。" },
  "about.media": { kicker: "影像记录", heading: "用影像记录正在发生的文化", body: "照片、海报和展会档案记录产品与社群的成长。" },
  "about.directions": { kicker: "发展方向", heading: "从产品走向城市互动", body: "小程序已上线；角色任务与 AR 互动仍在开发与测试中。" },
  "about.cta": { kicker: "继续探索", heading: "进入 SGL 的下一站", body: "浏览商品、到访 Station，或查看近期活动。" },
  "station.station-life": { kicker: "Station 日常", heading: "城市中的一个小停靠点", body: "咖啡、饮品、商品、骑行与见面在这里自然发生。" },
  "station.offerings": { kicker: "现场内容", heading: "喝一杯，逛一逛，再出发", body: "现场提供饮品、SGL 商品与社群活动，具体供应以当日为准。" },
  "station.station-logic": { kicker: "空间逻辑", heading: "从真实相遇开始", body: "Station 是产品、活动、角色与城市路线连接起来的实体基础。" },
  "station.mini-program": { kicker: "微信小程序", heading: "把 Station 延伸到城市里", body: "SGL 微信小程序已于 2026 年 6 月上线。" },
  "station.station-stories": { kicker: "Station 故事", heading: "每次停靠都留下新的片段", body: "骑行、展会和日常相遇共同构成 Station 的持续档案。" },
  "events.community": { kicker: "社群时刻", heading: "以骑行和见面连接城市", body: "小型骑行、饮品、产品和朋友构成活动的核心。" },
  "events.formats": { kicker: "活动形式", heading: "骑行、展会、快闪与 Station 聚会", body: "活动规模会变化，但始终来自真实地点与真实参与。" },
  "events.event-list": { kicker: "活动清单", heading: "查看正在发生与已经发生的活动", body: "通过海报与现场影像浏览 SGL 的活动记录。" },
  "events.development": { kicker: "持续发展", heading: "新的城市任务正在准备", body: "角色互动和 AR 体验仍在开发，发布时间取决于测试。" },
  "events.cta": { kicker: "保持联系", heading: "加入下一次活动", body: "关注 SGL 动态，或联系团队讨论活动合作。" },
  "universe.world-system": { kicker: "世界系统", heading: "从角色走向真实城市游戏", body: "原创角色连接商品、影像、路线、活动与 Station。" },
  "universe.world-points": { kicker: "体验节点", heading: "真实地点与数字任务逐步连接", body: "Station 已运营，小程序已上线，角色奖励与 AR 仍在开发。" },
  "universe.cta": { kicker: "继续探索", heading: "从一件商品或一次到访开始", body: "认识角色、浏览商品，或进入 Station。" },
  "app.screens": { kicker: "界面预览", heading: "地图、补给、商品与任务", body: "小程序把 SGL 的地点、内容与角色体验连接在一起。" },
  "app.next-chapter": { kicker: "下一章节", heading: "AR 互动仍在开发", body: "计划于 2027 年初发布，具体取决于开发与测试。" },
  "contact.contact-methods": { kicker: "联系方式", heading: "订单、到店与合作咨询", body: "邮件 hello@theseagulllabs.com，微信 seagulllabs，Instagram @seagulllabs。" },
  "contact.fast-order": { kicker: "快速下单", heading: "发送商品、颜色、尺码与数量", body: "团队会确认库存、总价、付款与配送后再推进订单。" },
  "contact.collaboration": { kicker: "合作", heading: "活动、快闪与品牌项目", body: "欢迎骑行活动、展会、城市生活方式与产品合作。" },
  "contact.cta": { kicker: "Seagull Station", heading: "让城市继续移动", body: "到访前请确认营业时间与商品库存。" },
  "stockists.channels": { kicker: "购买渠道", heading: "线上咨询与 Station 自提", body: "浏览商品并联系团队确认库存、配送或上海 Station 自提。" },
  "stockists.partnership": { kicker: "零售合作", heading: "成为 SGL 合作店铺", body: "请发送店铺位置、网站与感兴趣的商品。" },
  "shipping.information": { kicker: "顾客信息", heading: "销售、配送与退换", body: "价格以美元显示。库存、付款方式、运费、税费、时效与退换安排需在下单前确认。" },
  "success.status": { kicker: "订单状态", heading: "已返回网站", body: "此页面仅表示已从结账页面返回，并不单独证明付款成功。请以付款确认和 SGL 订单通知为准。" }
};

const ja: LocaleWords = {
  "home.shop": { kicker: "SGL グッズ", heading: "街の移動のためのプロダクト", body: "自転車、バッグ、ウェア、コーヒー、日用品をご覧ください。" },
  "home.station": { kicker: "上海・浦東", heading: "Seagull Station", body: "コーヒー、プロダクト、サイクリングコミュニティ、イベントが集まる実在の場所です。" },
  "home.events": { kicker: "イベント", heading: "走り、出会い、記録を残す", body: "ライド、展示会、Stationでの集まりとSGLのアーカイブをご覧ください。" },
  "about.principles": { kicker: "デザイン原則", heading: "日々の移動から始める", body: "SGLはライド、散歩、コーヒーストップ、街の小さなルートから生まれます。" },
  "about.brand-structure": { kicker: "ブランド構造", heading: "実在する拠点と広がる物語", body: "プロダクト、Station、イベント、写真、デジタル体験がSGLを形づくります。" },
  "about.media": { kicker: "ビジュアル記録", heading: "動き続ける文化を記録する", body: "写真、ポスター、展示会の記録がプロダクトとコミュニティの成長を伝えます。" },
  "about.directions": { kicker: "これから", heading: "プロダクトから街の体験へ", body: "ミニプログラムは公開済みで、キャラクターミッションとARは開発・テスト中です。" },
  "about.cta": { kicker: "次へ", heading: "SGLの次の場所へ", body: "商品を見る、Stationを訪れる、またはイベントを確認してください。" },
  "station.station-life": { kicker: "Stationの日常", heading: "街の小さな立ち寄り場所", body: "コーヒー、ドリンク、商品、ライド、人との出会いが自然に交わります。" },
  "station.offerings": { kicker: "提供内容", heading: "飲んで、見て、また走る", body: "ドリンク、SGL商品、コミュニティイベントを提供しています。内容は当日ご確認ください。" },
  "station.station-logic": { kicker: "場所の役割", heading: "実際の出会いから始まる", body: "Stationは商品、イベント、キャラクター、街のルートを結ぶ現実の基盤です。" },
  "station.mini-program": { kicker: "WeChatミニプログラム", heading: "Stationを街へ広げる", body: "SGL WeChatミニプログラムは2026年6月に公開されました。" },
  "station.station-stories": { kicker: "Stationストーリー", heading: "立ち寄るたびに新しい記録", body: "ライド、展示会、日々の出会いがStationのアーカイブになります。" },
  "events.community": { kicker: "コミュニティ", heading: "ライドと出会いで街をつなぐ", body: "小さなライド、ドリンク、商品、仲間がイベントの中心です。" },
  "events.formats": { kicker: "形式", heading: "ライド、展示、ポップアップ、Stationイベント", body: "規模は変わっても、実在する場所と参加者から始まります。" },
  "events.event-list": { kicker: "一覧", heading: "開催中と過去のイベント", body: "ポスターと現地写真からSGLの活動記録をご覧ください。" },
  "events.development": { kicker: "開発中", heading: "新しい街のミッションを準備中", body: "キャラクター体験とARは開発中で、公開時期はテスト結果によります。" },
  "events.cta": { kicker: "つながる", heading: "次のイベントへ", body: "SGLの更新をフォローするか、イベント協業についてご連絡ください。" },
  "universe.world-system": { kicker: "ワールドシステム", heading: "キャラクターから街のゲームへ", body: "オリジナルキャラクターが商品、写真、ルート、イベント、Stationをつなぎます。" },
  "universe.world-points": { kicker: "体験ノード", heading: "現実の場所とデジタルミッション", body: "Stationとミニプログラムは稼働中。報酬とARは開発中です。" },
  "universe.cta": { kicker: "探索", heading: "商品やStationから始める", body: "キャラクターを知り、商品を見るか、Stationを訪れてください。" },
  "app.screens": { kicker: "画面プレビュー", heading: "地図、補給、商品、ミッション", body: "ミニプログラムはSGLの場所、内容、キャラクター体験をつなぎます。" },
  "app.next-chapter": { kicker: "次の章", heading: "AR体験は開発中", body: "2027年初頭の公開を予定していますが、開発とテスト状況によります。" },
  "contact.contact-methods": { kicker: "連絡先", heading: "注文、来店、協業", body: "メール hello@theseagulllabs.com、WeChat seagulllabs、Instagram @seagulllabs。" },
  "contact.fast-order": { kicker: "クイック注文", heading: "商品、色、サイズ、数量を送信", body: "在庫、合計、支払い、配送を確認してから注文を進めます。" },
  "contact.collaboration": { kicker: "協業", heading: "イベント、ポップアップ、ブランド企画", body: "コミュニティライド、展示、都市生活、商品協業を歓迎します。" },
  "contact.cta": { kicker: "Seagull Station", heading: "街を動かし続ける", body: "来店前に営業時間と在庫をご確認ください。" },
  "stockists.channels": { kicker: "購入方法", heading: "オンライン問い合わせとStation受取", body: "商品を見て、在庫、配送、上海Station受取をチームにご確認ください。" },
  "stockists.partnership": { kicker: "小売パートナー", heading: "SGL取扱店になる", body: "店舗所在地、ウェブサイト、希望商品をお知らせください。" },
  "shipping.information": { kicker: "お客様情報", heading: "販売、配送、返品", body: "価格は米ドル表示です。在庫、支払い、送料、税、納期、返品条件を注文前にご確認ください。" },
  "success.status": { kicker: "注文状況", heading: "サイトに戻りました", body: "この画面だけでは支払い完了を証明しません。支払い確認とSGLの注文通知をご確認ください。" }
};

const ko: LocaleWords = {
  "home.shop": { kicker: "SGL 굿즈", heading: "도시 이동을 위한 제품", body: "자전거, 가방, 웨어, 커피와 일상 액세서리를 둘러보세요." },
  "home.station": { kicker: "상하이 · 푸둥", heading: "Seagull Station", body: "커피, 제품, 사이클링 커뮤니티와 오프라인 이벤트가 만나는 실제 공간입니다." },
  "home.events": { kicker: "이벤트", heading: "함께 달리고 만나며 기록하기", body: "라이드, 전시, Station 모임과 SGL 이벤트 아카이브를 확인하세요." },
  "about.principles": { kicker: "디자인 원칙", heading: "일상의 이동에서 시작", body: "SGL은 라이딩, 산책, 커피 정류장과 도시의 작은 경로에서 출발합니다." },
  "about.brand-structure": { kicker: "브랜드 구조", heading: "실제 거점과 확장되는 이야기", body: "제품, Station, 이벤트, 이미지와 디지털 경험이 SGL을 만듭니다." },
  "about.media": { kicker: "비주얼 기록", heading: "움직이는 문화를 기록하다", body: "사진, 포스터와 전시 기록이 제품과 커뮤니티의 성장을 보여 줍니다." },
  "about.directions": { kicker: "다음 방향", heading: "제품에서 도시 경험으로", body: "미니 프로그램은 출시되었고 캐릭터 미션과 AR은 개발 및 테스트 중입니다." },
  "about.cta": { kicker: "계속 보기", heading: "SGL의 다음 장소로", body: "제품을 보고 Station을 방문하거나 이벤트를 확인하세요." },
  "station.station-life": { kicker: "Station 일상", heading: "도시의 작은 정류장", body: "커피, 음료, 제품, 라이딩과 만남이 자연스럽게 이어집니다." },
  "station.offerings": { kicker: "현장 구성", heading: "마시고 둘러본 뒤 다시 출발", body: "음료, SGL 제품과 커뮤니티 이벤트를 제공합니다. 당일 구성을 확인해 주세요." },
  "station.station-logic": { kicker: "공간의 역할", heading: "실제 만남에서 시작", body: "Station은 제품, 이벤트, 캐릭터와 도시 경로를 잇는 현실의 기반입니다." },
  "station.mini-program": { kicker: "WeChat 미니 프로그램", heading: "Station을 도시로 확장", body: "SGL WeChat 미니 프로그램은 2026년 6월 출시되었습니다." },
  "station.station-stories": { kicker: "Station 이야기", heading: "방문할 때마다 쌓이는 기록", body: "라이드, 전시와 일상의 만남이 Station의 아카이브가 됩니다." },
  "events.community": { kicker: "커뮤니티", heading: "라이드와 만남으로 도시 연결", body: "작은 라이드, 음료, 제품과 친구들이 이벤트의 중심입니다." },
  "events.formats": { kicker: "형식", heading: "라이드, 전시, 팝업과 Station 모임", body: "규모는 달라도 실제 장소와 참여자에서 시작합니다." },
  "events.event-list": { kicker: "목록", heading: "진행 중이거나 지난 이벤트", body: "포스터와 현장 이미지로 SGL 활동 기록을 확인하세요." },
  "events.development": { kicker: "개발 중", heading: "새로운 도시 미션 준비 중", body: "캐릭터 경험과 AR은 개발 중이며 공개 시점은 테스트에 따라 달라집니다." },
  "events.cta": { kicker: "연결", heading: "다음 이벤트에 참여", body: "SGL 소식을 팔로우하거나 이벤트 협업을 문의하세요." },
  "universe.world-system": { kicker: "월드 시스템", heading: "캐릭터에서 실제 도시 게임으로", body: "오리지널 캐릭터가 제품, 이미지, 경로, 이벤트와 Station을 연결합니다." },
  "universe.world-points": { kicker: "경험 지점", heading: "실제 장소와 디지털 미션", body: "Station과 미니 프로그램은 운영 중이며 보상과 AR은 개발 중입니다." },
  "universe.cta": { kicker: "탐험", heading: "제품이나 Station에서 시작", body: "캐릭터를 만나고 제품을 보거나 Station을 방문하세요." },
  "app.screens": { kicker: "화면 미리보기", heading: "지도, 리퓨얼, 제품과 미션", body: "미니 프로그램은 SGL 장소, 콘텐츠와 캐릭터 경험을 연결합니다." },
  "app.next-chapter": { kicker: "다음 장", heading: "AR 경험 개발 중", body: "2027년 초 출시 예정이며 개발과 테스트 상황에 따라 달라질 수 있습니다." },
  "contact.contact-methods": { kicker: "연락처", heading: "주문, 방문과 협업", body: "이메일 hello@theseagulllabs.com, WeChat seagulllabs, Instagram @seagulllabs." },
  "contact.fast-order": { kicker: "빠른 주문", heading: "제품, 색상, 사이즈와 수량 전송", body: "재고, 총액, 결제와 배송을 확인한 뒤 주문을 진행합니다." },
  "contact.collaboration": { kicker: "협업", heading: "이벤트, 팝업과 브랜드 프로젝트", body: "커뮤니티 라이드, 전시, 도시 생활과 제품 협업을 환영합니다." },
  "contact.cta": { kicker: "Seagull Station", heading: "도시를 계속 움직이게", body: "방문 전 영업시간과 제품 재고를 확인해 주세요." },
  "stockists.channels": { kicker: "구매 채널", heading: "온라인 문의와 Station 픽업", body: "제품을 보고 팀에 재고, 배송 또는 상하이 Station 픽업을 문의하세요." },
  "stockists.partnership": { kicker: "리테일 파트너", heading: "SGL 취급점 되기", body: "매장 위치, 웹사이트와 관심 제품을 보내 주세요." },
  "shipping.information": { kicker: "고객 정보", heading: "판매, 배송과 반품", body: "가격은 미국 달러로 표시됩니다. 주문 전 재고, 결제, 배송비, 세금, 일정과 반품 조건을 확인하세요." },
  "success.status": { kicker: "주문 상태", heading: "사이트로 돌아왔습니다", body: "이 화면만으로 결제 완료를 증명하지 않습니다. 결제 확인과 SGL 주문 알림을 확인하세요." }
};

const it: LocaleWords = {
  "home.shop": { kicker: "Prodotti SGL", heading: "Creati per muoversi in città", body: "Scopri biciclette, borse, abbigliamento, caffè e accessori quotidiani." },
  "home.station": { kicker: "Shanghai · Pudong", heading: "Seagull Station", body: "Uno spazio reale per caffè, prodotti, comunità ciclistica ed eventi." },
  "home.events": { kicker: "Eventi", heading: "Pedalare, incontrarsi e lasciare una traccia", body: "Scopri pedalate, fiere, incontri alla Station e l’archivio SGL." },
  "about.principles": { kicker: "Principi", heading: "Partire dal movimento quotidiano", body: "SGL nasce da pedalate, passeggiate, soste per il caffè e piccoli itinerari urbani." },
  "about.brand-structure": { kicker: "Struttura del brand", heading: "Una base reale e un mondo narrativo in crescita", body: "Prodotti, Station, eventi, immagini ed esperienze digitali formano SGL." },
  "about.media": { kicker: "Archivio visivo", heading: "Documentare una cultura in movimento", body: "Fotografie, poster e fiere raccontano la crescita dei prodotti e della comunità." },
  "about.directions": { kicker: "Direzioni", heading: "Dai prodotti alle esperienze urbane", body: "Il Mini Program è attivo; missioni dei personaggi e AR sono in sviluppo e test." },
  "about.cta": { kicker: "Continua", heading: "La prossima tappa di SGL", body: "Scopri i prodotti, visita la Station o guarda gli eventi." },
  "station.station-life": { kicker: "Vita alla Station", heading: "Una piccola sosta in città", body: "Caffè, bevande, prodotti, pedalate e incontri si uniscono naturalmente." },
  "station.offerings": { kicker: "Alla Station", heading: "Bevi, esplora e riparti", body: "Bevande, prodotti SGL ed eventi di comunità; verifica l’offerta del giorno." },
  "station.station-logic": { kicker: "Logica dello spazio", heading: "Partire dagli incontri reali", body: "La Station è la base fisica che collega prodotti, eventi, personaggi e itinerari." },
  "station.mini-program": { kicker: "Mini Program WeChat", heading: "Estendere la Station nella città", body: "Il Mini Program WeChat SGL è attivo da giugno 2026." },
  "station.station-stories": { kicker: "Storie della Station", heading: "Ogni sosta lascia una nuova traccia", body: "Pedalate, fiere e incontri quotidiani formano l’archivio della Station." },
  "events.community": { kicker: "Comunità", heading: "Collegare la città con pedalate e incontri", body: "Piccole pedalate, bevande, prodotti e amici sono al centro degli eventi." },
  "events.formats": { kicker: "Formati", heading: "Pedalate, fiere, pop-up e incontri", body: "La scala cambia, ma tutto parte da luoghi e partecipanti reali." },
  "events.event-list": { kicker: "Elenco", heading: "Eventi presenti e passati", body: "Esplora le attività SGL attraverso poster e immagini sul posto." },
  "events.development": { kicker: "In sviluppo", heading: "Nuove missioni urbane in preparazione", body: "Le esperienze con i personaggi e l’AR sono in sviluppo; i tempi dipendono dai test." },
  "events.cta": { kicker: "Rimani in contatto", heading: "Partecipa al prossimo evento", body: "Segui gli aggiornamenti SGL o contattaci per una collaborazione." },
  "universe.world-system": { kicker: "Sistema del mondo", heading: "Dai personaggi a un gioco urbano reale", body: "I personaggi originali collegano prodotti, immagini, itinerari, eventi e Station." },
  "universe.world-points": { kicker: "Punti esperienza", heading: "Luoghi reali e missioni digitali", body: "Station e Mini Program sono attivi; premi e AR sono in sviluppo." },
  "universe.cta": { kicker: "Esplora", heading: "Inizia da un prodotto o dalla Station", body: "Incontra i personaggi, guarda i prodotti o visita la Station." },
  "app.screens": { kicker: "Anteprima", heading: "Mappa, ristoro, prodotti e missioni", body: "Il Mini Program collega luoghi, contenuti e personaggi SGL." },
  "app.next-chapter": { kicker: "Prossimo capitolo", heading: "L’esperienza AR è in sviluppo", body: "L’uscita è prevista per l’inizio del 2027, soggetta a sviluppo e test." },
  "contact.contact-methods": { kicker: "Contatti", heading: "Ordini, visite e collaborazioni", body: "Email hello@theseagulllabs.com, WeChat seagulllabs, Instagram @seagulllabs." },
  "contact.fast-order": { kicker: "Ordine rapido", heading: "Invia prodotto, colore, taglia e quantità", body: "Il team confermerà disponibilità, totale, pagamento e consegna." },
  "contact.collaboration": { kicker: "Collaborazioni", heading: "Eventi, pop-up e progetti con i brand", body: "SGL è aperta a pedalate, fiere, progetti urbani e collaborazioni di prodotto." },
  "contact.cta": { kicker: "Seagull Station", heading: "Continuiamo a muovere la città", body: "Conferma orari e disponibilità prima della visita." },
  "stockists.channels": { kicker: "Canali", heading: "Richieste online e ritiro alla Station", body: "Scopri i prodotti e conferma disponibilità, consegna o ritiro a Shanghai." },
  "stockists.partnership": { kicker: "Partner retail", heading: "Diventa un rivenditore SGL", body: "Invia sede, sito web e prodotti di interesse del tuo negozio." },
  "shipping.information": { kicker: "Informazioni clienti", heading: "Vendite, spedizioni e resi", body: "I prezzi sono in USD. Conferma disponibilità, pagamento, spedizione, imposte, tempi e condizioni di reso prima dell’ordine." },
  "success.status": { kicker: "Stato dell’ordine", heading: "Sei tornato al sito", body: "Questa pagina non dimostra da sola l’avvenuto pagamento. Controlla la conferma di pagamento e la notifica d’ordine SGL." }
};

const words: Record<LocalizedLocale, LocaleWords> = {
  "zh-CN": zh,
  "ja-JP": ja,
  "ko-KR": ko,
  "it-IT": it
};

const structuralLabels: Record<LocalizedLocale, Record<string, string>> = {
  "zh-CN": {
    history: "品牌历程", bikes: "自行车", bags: "包袋与携带", wear: "穿戴", coffee: "Station 好物", accessories: "配件",
    product: "商品详情", stationImage: "Seagull Station 主视觉", eventFilm: "活动影片", calendar: "活动日历", exhibitions: "展会记录",
    universeImage: "SGL 角色世界主视觉", universeFilm: "SGL 角色动画预览", characters: "原创角色", cart: "购物车", footer: "页脚"
  },
  "ja-JP": {
    history: "ブランドの歩み", bikes: "自転車", bags: "バッグ＆キャリー", wear: "ウェア", coffee: "Stationグッズ", accessories: "アクセサリー",
    product: "商品詳細", stationImage: "Seagull Station メインビジュアル", eventFilm: "イベントフィルム", calendar: "イベントカレンダー", exhibitions: "展示会の記録",
    universeImage: "SGL Universe メインビジュアル", universeFilm: "SGLキャラクターアニメーションプレビュー", characters: "オリジナルキャラクター", cart: "カート", footer: "フッター"
  },
  "ko-KR": {
    history: "브랜드 연혁", bikes: "자전거", bags: "가방 & 캐리", wear: "웨어", coffee: "Station 굿즈", accessories: "액세서리",
    product: "제품 상세", stationImage: "Seagull Station 메인 이미지", eventFilm: "이벤트 영상", calendar: "이벤트 캘린더", exhibitions: "전시 기록",
    universeImage: "SGL Universe 메인 이미지", universeFilm: "SGL 캐릭터 애니메이션 미리보기", characters: "오리지널 캐릭터", cart: "장바구니", footer: "푸터"
  },
  "it-IT": {
    history: "Storia del brand", bikes: "Biciclette", bags: "Borse e trasporto", wear: "Abbigliamento", coffee: "Prodotti Station", accessories: "Accessori",
    product: "Dettagli del prodotto", stationImage: "Immagine principale di Seagull Station", eventFilm: "Film degli eventi", calendar: "Calendario degli eventi", exhibitions: "Archivio delle fiere",
    universeImage: "Immagine principale di SGL Universe", universeFilm: "Anteprima dell’animazione dei personaggi SGL", characters: "Personaggi originali", cart: "Carrello", footer: "Piè di pagina"
  }
};

const heroPages = ["home", "about", "shop", "station", "events", "universe", "app", "contact", "stockists"] as const;

function makeCatalog(locale: LocalizedLocale) {
  const source = words[locale];
  const labels = structuralLabels[locale];
  const catalog: Record<string, Record<string, SectionCopy>> = {};

  for (const [page, sections] of Object.entries(publicPageSections)) {
    catalog[page] = {};
    for (const section of sections) {
      const key = `${page}.${section}`;
      const copy = source[key];
      if (copy) catalog[page][section] = copy;
    }
  }

  for (const page of heroPages) {
    const copy = pageCopy[locale][page];
    catalog[page].hero = { kicker: copy.eyebrow, heading: copy.heading, body: `${copy.intro} ${copy.secondary}` };
  }
  catalog.about.history = { heading: labels.history, body: labels.history };
  catalog.shop["bikes-frames"] = { heading: labels.bikes, body: labels.bikes };
  catalog.shop["bags-carry"] = { heading: labels.bags, body: labels.bags };
  catalog.shop["wear-ride"] = { heading: labels.wear, body: labels.wear };
  catalog.shop["coffee-refuel"] = { heading: labels.coffee, body: labels.coffee };
  catalog.shop.accessories = { heading: labels.accessories, body: labels.accessories };
  catalog.product["product-detail"] = { heading: labels.product, body: labels.product };
  catalog.station["hero-image"] = { heading: labels.stationImage, body: labels.stationImage };
  catalog.events.film = { heading: labels.eventFilm, body: labels.eventFilm };
  catalog.events.calendar = { heading: labels.calendar, body: labels.calendar };
  catalog.events.exhibitions = { heading: labels.exhibitions, body: labels.exhibitions };
  catalog.universe["hero-image"] = { heading: labels.universeImage, body: labels.universeImage };
  catalog.universe.film = { heading: labels.universeFilm, body: labels.universeFilm };
  catalog.universe.characters = { heading: labels.characters, body: labels.characters };
  catalog.cart.cart = { heading: labels.cart, body: labels.cart };
  catalog.footer.footer = { heading: labels.footer, body: labels.footer };

  return catalog;
}

export const localizedSectionCatalog = Object.fromEntries(
  (Object.keys(words) as LocalizedLocale[]).map((locale) => [locale, makeCatalog(locale)])
) as Record<LocalizedLocale, Record<PublicPage, Record<string, SectionCopy>>>;

export function getSectionCopy(locale: LocalizedLocale, page: PublicPage, section: string) {
  const copy = localizedSectionCatalog[locale]?.[page]?.[section];
  if (!copy && process.env.NODE_ENV !== "production") {
    console.warn(`[i18n] Missing section copy: ${locale}.${page}.${section}`);
  }
  return copy ?? null;
}
