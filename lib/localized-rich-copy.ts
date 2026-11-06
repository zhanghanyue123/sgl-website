import type { LocalizedLocale } from "./content-schema";
import { STATION_BIKE_STUDIO_IMAGE, STATION_CLUB_HOUSE_IMAGE } from "./seo";

type HomeCard = { number: string; title: string; text: string };
type EventCard = { date: string; title: string; description: string };
type StationPhoto = { name: string; title: string; alt: string; width: number; height: number };
type StationLocationPhoto = { src: string; title: string; alt: string; width: number; height: number };
type StationOffering = { number: string; title: string; text: string };
type AppScreen = { file: string; label: string; title: string; text: string; alt: string };

type RichCopy = {
  home: {
    shopButton: string;
    stationButton: string;
    rideButton: string;
    panelLabel: string;
    panelHeading: string;
    panelItems: string;
    goodsOnline: string;
    shopKicker: string;
    shopHeading: string;
    shopBody: string;
    viewAll: string;
    stationKicker: string;
    stationHeading: string;
    stationBody: string;
    stationCards: HomeCard[];
    eventsKicker: string;
    eventsHeading: string;
    filmBadge: string;
    filmTitle: string;
    filmAria: string;
    events: EventCard[];
    heroImageAlt: string;
  };
  station: {
    heroAlt: string;
    lifeKicker: string;
    lifeHeading: string;
    lifeBody: string;
    locationPhotos: StationLocationPhoto[];
    photos: StationPhoto[];
    offerings: StationOffering[];
    storiesKicker: string;
    storiesHeading: string;
    storiesBody: string;
    storiesAlt: string;
  };
  app: {
    liveBadge: string;
    developmentBadge: string;
    statusNote: string;
    exploreButton: string;
    heroAlt: string;
    screensKicker: string;
    screensHeading: string;
    screensBody: string;
    screens: AppScreen[];
    disclaimer: string;
    nextKicker: string;
    nextHeading: string;
    nextBody: string;
    stationButton: string;
  };
  about: {
    anniversaryAlt: string;
    anniversaryCaption: string;
    filmTitle: string;
    filmCaption: string;
  };
};

const stationPhotoFiles = [
  { name: "evening-refuel", width: 1200, height: 1601 },
  { name: "on-tap", width: 1200, height: 1800 },
  { name: "at-the-counter", width: 1200, height: 1800 },
  { name: "fresh-pour", width: 1200, height: 1800 },
  { name: "little-pause", width: 1200, height: 1750 },
  { name: "cheers-together", width: 1200, height: 1800 }
] as const;

const stationLocationFiles = [
  { src: STATION_BIKE_STUDIO_IMAGE, width: 1670, height: 941 },
  { src: STATION_CLUB_HOUSE_IMAGE, width: 1447, height: 1087 }
] as const;

function photos(copy: Array<{ title: string; alt: string }>): StationPhoto[] {
  return stationPhotoFiles.map((photo, index) => ({ ...photo, ...copy[index] }));
}

function locationPhotos(copy: Array<{ title: string; alt: string }>): StationLocationPhoto[] {
  return stationLocationFiles.map((photo, index) => ({ ...photo, ...copy[index] }));
}

export const localizedRichCopy: Record<LocalizedLocale, RichCopy> = {
  "zh-CN": {
    home: {
      shopButton: "浏览商品",
      stationButton: "到访 Station",
      rideButton: "参加骑行",
      panelLabel: "Station 城市系统",
      panelHeading: "商品、骑行、咖啡与路线。",
      panelItems: "包袋 / 袜子 / 帽子 / Station 好物 / 骑行配件",
      goodsOnline: "件商品在线",
      shopKicker: "商店",
      shopHeading: "Station 好物",
      shopBody: "为城市骑行、公园绕行、Station 停靠与日常小冒险设计。",
      viewAll: "查看全部",
      stationKicker: "Station",
      stationHeading: "城市里的一处小停靠。",
      stationBody: "咖啡、饮品、骑行用品、社群活动与城市任务，都从 Seagull Station 开始。",
      stationCards: [
        { number: "01", title: "骑行", text: "公园绕行、城市路线、夜骑，以及和朋友共享的两轮时光。" },
        { number: "02", title: "补给", text: "咖啡、饮品、简单餐食与适合途中停靠的 Station 补给。" },
        { number: "03", title: "探索", text: "原创角色、城市任务，以及正在开发中的 AR 互动体验。" }
      ],
      eventsKicker: "活动",
      eventsHeading: "骑一程，喝一杯，见个面。",
      filmBadge: "SGL 影像",
      filmTitle: "故事 001 — 上海",
      filmAria: "SGL 上海城市故事影片",
      events: [
        { date: "社群骑行", title: "世纪公园骑行", description: "和朋友一起绕行公园，再回到 Station 喝一杯、聊聊天。" },
        { date: "夜间活动", title: "夜骑与啤酒", description: "日落后出发，在夜色里骑行，最后回到 Station 相聚。" },
        { date: "城市快闪", title: "西岸快闪", description: "让 SGL 商品、角色与 Station 文化走进城市的流动空间。" }
      ],
      heroImageAlt: "Wheel Deal 海鸥骑行插画"
    },
    station: {
      heroAlt: "夕阳下聚在 Seagull Station 的海鸥角色",
      lifeKicker: "Station 日常",
      lifeHeading: "停一停，补充能量，再多待一会。",
      lifeBody: "暖黄灯光、新鲜饮品和熟悉的朋友，组成 Seagull Station 的日常片段。",
      locationPhotos: locationPhotos([
        { title: "SGL Bike Studio · Shanghai", alt: "上海 SGL Bike Studio 的自行车、服饰与骑行商品展示空间" },
        { title: "Station Club House", alt: "暖金色光线下的 Sea Gull Station Club House 咖啡与社群空间" }
      ]),
      photos: photos([
        { title: "夜间补给", alt: "夜晚户外桌上的 SGL 冰饮" },
        { title: "现打饮品", alt: "在 Station 饮品龙头下接取一杯金色饮品" },
        { title: "吧台时刻", alt: "客人在 Station 吧台手持 SGL 饮品杯" },
        { title: "刚刚倒好", alt: "从 Station 饮品龙头倒入杯中的饮品" },
        { title: "停一小会", alt: "暖光下手持一杯 SGL 饮品" },
        { title: "一起碰杯", alt: "朋友们举起 SGL 饮品一起碰杯" }
      ]),
      offerings: [
        { number: "01", title: "咖啡与饮品", text: "为骑行者、公园访客和附近社群准备咖啡、精酿饮品、季节限定与简单补给。" },
        { number: "02", title: "SGL 商品", text: "现场可以了解 SGL 自行车、包袋、服饰、配件与 Station 好物；到店前建议确认库存。" },
        { number: "03", title: "骑行社群", text: "这里是骑行者、朋友和附近社群的见面点，也记录城市里的日常移动。" },
        { number: "04", title: "活动与聚会", text: "社群骑行、展览、快闪与 Station 聚会，让 SGL 文化成为真实的共同体验。" }
      ],
      storiesKicker: "Station 故事",
      storiesHeading: "在 Station 见。",
      storiesBody: "角色、饮品与城市日常，在 Seagull Station 相遇。",
      storiesAlt: "三位 SGL 海鸥角色在 Seagull Station 门口一起喝饮品"
    },
    app: {
      liveBadge: "小程序 · 已上线",
      developmentBadge: "AR · 开发中",
      statusNote: "SGL 微信小程序已于 2026 年 6 月上线，各项功能仍在持续迭代。",
      exploreButton: "查看界面 ↓",
      heroAlt: "SGL 城市冒险概念界面，展示路线、打卡点与 Pickle",
      screensKicker: "小程序 · 2026 年 6 月上线",
      screensHeading: "从手机屏幕，走进真实街道。",
      screensBody: "围绕 Station 串联四个日常场景。以下界面以英文演示版本展示。",
      screens: [
        { file: "map-v2-en.webp", label: "01 / 探索", title: "找到下一站", text: "查看 Station、跟随城市路线，也看看朋友们最近去了哪里。", alt: "SGL Station 地图界面，展示第一站任务与好友动态" },
        { file: "refuel-en.webp", label: "02 / 补给", title: "喝一点，歇一会", text: "在冒险之间浏览 Station 的咖啡、饮品和补给菜单。", alt: "SGL 补给菜单界面，展示饮品与 Station 插画" },
        { file: "goods-en.webp", label: "03 / 商品", title: "把 SGL 带在身边", text: "查看 Station 好物与自家拼配咖啡，会员价格一目了然。", alt: "SGL 商品界面，展示 House Blend 咖啡与会员价格" },
        { file: "missions-en.webp", label: "04 / 任务", title: "把今天变成一项任务", text: "第一次打卡、一次骑行或和朋友喝一杯，都能成为你的城市故事。", alt: "SGL 任务界面，展示活动模式与每日进度" }
      ],
      disclaimer: "小程序已经上线；页面中的个别界面与功能可能使用示例内容，或仍在持续开发。菜单价格以人民币显示。AR 互动正在开发中，计划于 2027 年初发布。",
      nextKicker: "下一章节",
      nextHeading: "值得走进去的故事。",
      nextBody: "已上线的小程序把数字体验带进 SGL 的真实世界。围绕角色的城市任务仍在扩展，AR 互动计划于 2027 年初推出。",
      stationButton: "探索 Seagull Station"
    },
    about: {
      anniversaryAlt: "SGL 一周年骑行主题插画",
      anniversaryCaption: "一周年纪念",
      filmTitle: "SGL 夜骑影片",
      filmCaption: "夜骑记录"
    }
  },
  "ja-JP": {
    home: {
      shopButton: "グッズを見る",
      stationButton: "Stationへ",
      rideButton: "ライドに参加",
      panelLabel: "Stationのしくみ",
      panelHeading: "グッズ、ライド、コーヒー、ルート。",
      panelItems: "バッグ / ソックス / キャップ / Stationグッズ / ライド小物",
      goodsOnline: "点をオンラインで販売中",
      shopKicker: "ショップ",
      shopHeading: "Stationグッズ",
      shopBody: "街のライド、公園の周回、Stationへの立ち寄り、小さな冒険のための日用品。",
      viewAll: "すべて見る",
      stationKicker: "Station",
      stationHeading: "街の途中にある、小さな立ち寄り場所。",
      stationBody: "コーヒー、ドリンク、ライド用品、コミュニティイベント、街のミッションはSeagull Stationから始まります。",
      stationCards: [
        { number: "01", title: "走る", text: "公園の周回、街のルート、ナイトライド。二輪で過ごす時間を仲間と分かち合います。" },
        { number: "02", title: "ひと休み", text: "コーヒー、ドリンク、軽食と、道の途中にちょうどいいStationの補給。" },
        { number: "03", title: "遊ぶ", text: "オリジナルキャラクター、街のミッション、開発中のAR体験。" }
      ],
      eventsKicker: "イベント",
      eventsHeading: "走って、飲んで、出会う。",
      filmBadge: "SGLフィルム",
      filmTitle: "ストーリー001 — 上海",
      filmAria: "SGLの上海シティストーリーフィルム",
      events: [
        { date: "コミュニティライド", title: "世紀公園ライド", description: "仲間と公園を一周し、Stationに戻ってドリンクと会話を楽しむライド。" },
        { date: "夜のイベント", title: "ナイトライド＆ビール", description: "日没後に走り、最後はStationで一杯を囲んで過ごします。" },
        { date: "シティポップアップ", title: "West Bundポップアップ", description: "SGLのグッズ、キャラクター、Stationカルチャーを街へ運ぶ移動型の空間。" }
      ],
      heroImageAlt: "自転車に乗るカモメを描いたWheel Dealのイラスト"
    },
    station: {
      heroAlt: "夕暮れのSeagull Stationに集まるカモメのキャラクター",
      lifeKicker: "Stationの日常",
      lifeHeading: "立ち止まって、ひと息ついて、もう少し。",
      lifeBody: "あたたかな灯り、注ぎたての一杯、気の合う仲間。Seagull Stationの日常をのぞいてみましょう。",
      locationPhotos: locationPhotos([
        { title: "SGL Bike Studio · Shanghai", alt: "自転車、ウェア、ライド用品を展示する上海のSGL Bike Studio" },
        { title: "Station Club House", alt: "あたたかな金色の光に包まれたSea Gull Station Club Houseのカフェとコミュニティスペース" }
      ]),
      photos: photos([
        { title: "夜のひと休み", alt: "夜の屋外テーブルに置かれた冷たいSGLドリンク" },
        { title: "タップから一杯", alt: "Stationのタップから注がれる金色のドリンク" },
        { title: "カウンターで", alt: "StationのカウンターでSGLカップを手にするゲスト" },
        { title: "注ぎたて", alt: "Stationのタップからグラスへ注がれるドリンク" },
        { title: "小さな休憩", alt: "あたたかなStationの灯りの中で手にするSGLドリンク" },
        { title: "一緒ならもっと楽しい", alt: "SGLドリンクで乾杯する友人たち" }
      ]),
      offerings: [
        { number: "01", title: "コーヒーとドリンク", text: "ライダー、公園を訪れる人、近所のコミュニティに向けたコーヒー、クラフトドリンク、季節の一杯と軽い補給。" },
        { number: "02", title: "SGLグッズ", text: "自転車、バッグ、ウェア、アクセサリー、Stationグッズを実際に手に取れます。来店前に在庫をご確認ください。" },
        { number: "03", title: "サイクリングコミュニティ", text: "ライダーや仲間、近隣の人々が出会い、街の日常的な移動を共有する集合場所です。" },
        { number: "04", title: "イベントと集まり", text: "コミュニティライド、展示、ポップアップ、Stationでの集まりを通してSGLの文化を共有します。" }
      ],
      storiesKicker: "Stationストーリー",
      storiesHeading: "Stationで会いましょう。",
      storiesBody: "キャラクターとドリンク、街の日常がSeagull Stationで交わります。",
      storiesAlt: "Seagull Stationの前でドリンクを楽しむ3羽のSGLキャラクター"
    },
    app: {
      liveBadge: "ミニプログラム · 公開中",
      developmentBadge: "AR · 開発中",
      statusNote: "SGL WeChatミニプログラムは2026年6月に公開され、各機能は現在もアップデートを重ねています。",
      exploreButton: "画面を見る ↓",
      heroAlt: "ルート、チェックポイント、Pickleを描いたSGLの街歩きコンセプト画面",
      screensKicker: "ミニプログラム · 2026年6月公開",
      screensHeading: "画面の中から、街の中へ。",
      screensBody: "Stationを中心に4つの体験をつなぎます。以下は英語版インターフェースのプレビューです。",
      screens: [
        { file: "map-v2-en.webp", label: "01 / 探す", title: "次の立ち寄り先へ", text: "Stationを見つけ、街のルートをたどり、仲間の近況もチェック。", alt: "最初のミッションとフレンドフィードを表示するSGL Stationの地図画面" },
        { file: "refuel-en.webp", label: "02 / ひと休み", title: "少しだけ補給", text: "冒険の合間に、Stationのコーヒーやドリンクメニューを選びましょう。", alt: "ドリンクとStationのイラストを表示するSGLメニュー画面" },
        { file: "goods-en.webp", label: "03 / グッズ", title: "SGLを連れていく", text: "Stationグッズやハウスブレンドを、会員価格とともにチェックできます。", alt: "House Blendコーヒーと会員価格を表示するSGLグッズ画面" },
        { file: "missions-en.webp", label: "04 / ミッション", title: "今日をミッションに", text: "初めてのチェックイン、ライド、仲間との一杯。小さな行動が街の物語になります。", alt: "アクティビティモードと日々の進捗を表示するSGLミッション画面" }
      ],
      disclaimer: "ミニプログラムは公開中ですが、掲載画面の一部にはサンプル内容や開発中の機能が含まれます。Stationのメニュー価格は人民元表記です。AR体験は開発中で、2027年初頭の公開を予定しています。",
      nextKicker: "次の章",
      nextHeading: "街へ踏み出したくなる物語。",
      nextBody: "公開中のミニプログラムが、デジタルなStation体験をSGLの世界へ広げます。キャラクターと巡る街のミッションは進化を続け、AR体験は2027年初頭の公開を予定しています。",
      stationButton: "Seagull Stationを見る"
    },
    about: {
      anniversaryAlt: "SGL一周年を記念したサイクリングイラスト",
      anniversaryCaption: "一周年記念",
      filmTitle: "SGLナイトライドフィルム",
      filmCaption: "ナイトライドの記録"
    }
  },
  "ko-KR": {
    home: {
      shopButton: "제품 보기",
      stationButton: "Station 방문",
      rideButton: "라이드 참여",
      panelLabel: "Station 시스템",
      panelHeading: "제품, 라이드, 커피, 루트.",
      panelItems: "가방 / 양말 / 캡 / Station 굿즈 / 라이딩 액세서리",
      goodsOnline: "개 제품 온라인 판매 중",
      shopKicker: "스토어",
      shopHeading: "Station 굿즈",
      shopBody: "도시 라이딩, 공원 한 바퀴, Station에서의 휴식과 작은 모험을 위한 일상 제품입니다.",
      viewAll: "전체 보기",
      stationKicker: "Station",
      stationHeading: "도시 한가운데 잠시 머무는 작은 정류장.",
      stationBody: "커피, 음료, 라이딩 용품, 커뮤니티 이벤트와 도시 미션이 모두 Seagull Station에서 시작됩니다.",
      stationCards: [
        { number: "01", title: "라이드", text: "공원 루프, 도시 루트, 나이트 라이드와 두 바퀴 위에서 함께 보내는 시간." },
        { number: "02", title: "리퓨얼", text: "커피, 음료, 가벼운 먹거리와 이동 중 잠시 쉬어 가기 좋은 Station 보급." },
        { number: "03", title: "플레이", text: "오리지널 캐릭터, 도시 미션, 그리고 현재 개발 중인 AR 경험." }
      ],
      eventsKicker: "이벤트",
      eventsHeading: "달리고, 마시고, 만나다.",
      filmBadge: "SGL 필름",
      filmTitle: "스토리 001 — 상하이",
      filmAria: "SGL 상하이 도시 이야기 영상",
      events: [
        { date: "커뮤니티 라이드", title: "세기공원 라이드", description: "함께 공원을 한 바퀴 달린 뒤 Station으로 돌아와 음료와 대화를 나눕니다." },
        { date: "이브닝 이벤트", title: "나이트 라이드 & 비어", description: "해가 진 뒤 달리고 Station에서 음료와 함께 하루를 마무리합니다." },
        { date: "시티 팝업", title: "웨스트 번드 팝업", description: "SGL 제품, 캐릭터와 Station 문화를 도시 곳곳으로 옮기는 이동형 공간입니다." }
      ],
      heroImageAlt: "자전거를 타는 갈매기를 그린 Wheel Deal 일러스트"
    },
    station: {
      heroAlt: "노을빛 Seagull Station에 모인 갈매기 캐릭터들",
      lifeKicker: "Station의 일상",
      lifeHeading: "잠시 멈추고, 채우고, 조금 더 머물기.",
      lifeBody: "따뜻한 조명, 갓 따른 한 잔과 좋은 사람들이 만드는 Seagull Station의 일상을 만나보세요.",
      locationPhotos: locationPhotos([
        { title: "SGL Bike Studio · Shanghai", alt: "자전거, 의류와 라이딩 제품을 전시하는 상하이 SGL Bike Studio" },
        { title: "Station Club House", alt: "따뜻한 황금빛 속 Sea Gull Station Club House 카페와 커뮤니티 공간" }
      ]),
      photos: photos([
        { title: "저녁의 리퓨얼", alt: "밤의 야외 테이블 위에 놓인 차가운 SGL 음료" },
        { title: "탭에서 바로", alt: "Station 탭에서 황금빛 음료를 따르는 모습" },
        { title: "카운터에서", alt: "Station 카운터에서 SGL 컵을 든 손님" },
        { title: "갓 따른 한 잔", alt: "Station 탭에서 잔으로 음료를 따르는 모습" },
        { title: "잠깐의 휴식", alt: "따뜻한 Station 조명 아래 든 SGL 음료" },
        { title: "함께라서 더 좋은", alt: "SGL 음료를 들고 건배하는 친구들" }
      ]),
      offerings: [
        { number: "01", title: "커피와 음료", text: "라이더, 공원 방문객과 이웃을 위한 커피, 크래프트 음료, 계절 메뉴와 간단한 보급을 제공합니다." },
        { number: "02", title: "SGL 굿즈", text: "자전거, 가방, 의류, 액세서리와 Station 굿즈를 직접 만날 수 있습니다. 방문 전 재고를 확인해 주세요." },
        { number: "03", title: "사이클링 커뮤니티", text: "라이더와 친구, 지역 커뮤니티가 만나 도시의 일상적인 움직임을 공유하는 공간입니다." },
        { number: "04", title: "이벤트와 모임", text: "커뮤니티 라이드, 전시, 팝업과 Station 모임을 통해 SGL 문화를 함께 경험합니다." }
      ],
      storiesKicker: "Station 이야기",
      storiesHeading: "Station에서 만나요.",
      storiesBody: "캐릭터와 음료, 도시의 일상이 Seagull Station에서 만납니다.",
      storiesAlt: "Seagull Station 앞에서 함께 음료를 즐기는 세 SGL 캐릭터"
    },
    app: {
      liveBadge: "미니 프로그램 · 운영 중",
      developmentBadge: "AR · 개발 중",
      statusNote: "SGL WeChat 미니 프로그램은 2026년 6월 출시되었으며 각 기능을 계속 개선하고 있습니다.",
      exploreButton: "화면 살펴보기 ↓",
      heroAlt: "루트, 체크포인트와 Pickle이 있는 SGL 도시 모험 콘셉트 화면",
      screensKicker: "미니 프로그램 · 2026년 6월 출시",
      screensHeading: "화면에서 거리로.",
      screensBody: "Station을 중심으로 이어지는 네 가지 순간입니다. 아래 화면은 영문 인터페이스 미리보기입니다.",
      screens: [
        { file: "map-v2-en.webp", label: "01 / 탐색", title: "다음 목적지 찾기", text: "Station을 찾고 도시 루트를 따라가며 친구들의 새로운 소식도 확인하세요.", alt: "첫 번째 미션과 친구 피드를 보여 주는 SGL Station 지도 화면" },
        { file: "refuel-en.webp", label: "02 / 리퓨얼", title: "잠깐의 재충전", text: "모험 사이 Station의 커피와 음료 메뉴를 둘러보며 잠시 쉬어 가세요.", alt: "음료와 Station 일러스트가 있는 SGL 리퓨얼 메뉴 화면" },
        { file: "goods-en.webp", label: "03 / 굿즈", title: "SGL을 함께 가져가기", text: "Station 굿즈와 하우스 블렌드를 회원 가격과 함께 확인할 수 있습니다.", alt: "House Blend 커피와 회원 가격을 보여 주는 SGL 굿즈 화면" },
        { file: "missions-en.webp", label: "04 / 미션", title: "오늘을 미션으로", text: "첫 체크인, 한 번의 라이드, 친구와의 한 잔이 도시 이야기의 일부가 됩니다.", alt: "활동 모드와 일일 진행 상황을 보여 주는 SGL 미션 화면" }
      ],
      disclaimer: "미니 프로그램은 운영 중이며 일부 화면과 기능에는 예시 콘텐츠가 사용되거나 아직 개발 중일 수 있습니다. Station 메뉴 가격은 중국 위안화로 표시됩니다. AR 경험은 개발 중이며 2027년 초 공개를 목표로 합니다.",
      nextKicker: "다음 장",
      nextHeading: "직접 들어가 보고 싶은 이야기.",
      nextBody: "출시된 미니 프로그램은 디지털 Station 경험을 SGL 세계로 확장합니다. 캐릭터와 함께하는 도시 미션은 계속 발전하고 있으며 AR 경험은 2027년 초 공개를 목표로 합니다.",
      stationButton: "Seagull Station 둘러보기"
    },
    about: {
      anniversaryAlt: "SGL 1주년 기념 사이클링 일러스트",
      anniversaryCaption: "1주년 기념",
      filmTitle: "SGL 나이트 라이드 영상",
      filmCaption: "나이트 라이드 기록"
    }
  },
  "it-IT": {
    home: {
      shopButton: "Scopri i prodotti",
      stationButton: "Visita la Station",
      rideButton: "Partecipa a una pedalata",
      panelLabel: "Il sistema Station",
      panelHeading: "Prodotti, pedalate, caffè e itinerari.",
      panelItems: "Borse / calze / cappellini / prodotti Station / accessori da bici",
      goodsOnline: "prodotti online",
      shopKicker: "Negozio",
      shopHeading: "Prodotti Station",
      shopBody: "Oggetti quotidiani per pedalare in città, girare al parco, fermarsi alla Station e vivere piccole avventure.",
      viewAll: "Vedi tutto",
      stationKicker: "Station",
      stationHeading: "Una piccola sosta nel cuore della città.",
      stationBody: "Caffè, bevande, accessori da bici, eventi e missioni urbane iniziano tutti da Seagull Station.",
      stationCards: [
        { number: "01", title: "Pedala", text: "Giri al parco, itinerari urbani, uscite serali e tempo condiviso su due ruote." },
        { number: "02", title: "Ricaricati", text: "Caffè, bevande, qualcosa di leggero e il necessario per una sosta alla Station." },
        { number: "03", title: "Gioca", text: "Personaggi originali, missioni in città ed esperienze AR attualmente in sviluppo." }
      ],
      eventsKicker: "Eventi",
      eventsHeading: "Pedala, bevi qualcosa, incontra gli altri.",
      filmBadge: "Film SGL",
      filmTitle: "Storia 001 — Shanghai",
      filmAria: "Film SGL dedicato a Shanghai",
      events: [
        { date: "Pedalata di comunità", title: "Pedalata al Century Park", description: "Un giro del parco in compagnia, poi rientro alla Station per bere qualcosa e stare insieme." },
        { date: "Appuntamento serale", title: "Pedalata notturna e birra", description: "Un’uscita dopo il tramonto che termina alla Station, tra bevande e conversazioni." },
        { date: "Pop-up urbano", title: "Pop-up al West Bund", description: "Uno spazio itinerante che porta in città prodotti, personaggi e cultura della Station." }
      ],
      heroImageAlt: "Illustrazione Wheel Deal con un gabbiano in bicicletta"
    },
    station: {
      heroAlt: "I personaggi SGL riuniti alla Seagull Station nella luce del tramonto",
      lifeKicker: "Vita alla Station",
      lifeHeading: "Fermati. Ricaricati. Resta ancora un po’.",
      lifeBody: "Luci calde, una bevanda appena versata e buona compagnia: piccoli momenti quotidiani alla Seagull Station.",
      locationPhotos: locationPhotos([
        { title: "SGL Bike Studio · Shanghai", alt: "Lo showroom SGL Bike Studio di Shanghai con biciclette, abbigliamento e prodotti da ciclismo" },
        { title: "Station Club House", alt: "Il caffè e lo spazio comunitario Sea Gull Station Club House nella calda luce dorata" }
      ]),
      photos: photos([
        { title: "Ristoro serale", alt: "Una bevanda fredda SGL su un tavolo all’aperto di sera" },
        { title: "Direttamente alla spina", alt: "Una bevanda dorata versata dai rubinetti della Station" },
        { title: "Al bancone", alt: "Un ospite con un bicchiere SGL al bancone della Station" },
        { title: "Appena versata", alt: "Una bevanda versata da un rubinetto della Station" },
        { title: "Una piccola pausa", alt: "Una bevanda SGL nella luce calda della Station" },
        { title: "Meglio insieme", alt: "Amici che brindano con le loro bevande SGL" }
      ]),
      offerings: [
        { number: "01", title: "Caffè e bevande", text: "Caffè, bevande artigianali, proposte stagionali e ristori semplici per ciclisti, visitatori del parco e comunità vicine." },
        { number: "02", title: "Prodotti SGL", text: "Un luogo fisico dove scoprire biciclette, borse, abbigliamento, accessori e prodotti Station. Verifica la disponibilità prima della visita." },
        { number: "03", title: "Comunità ciclistica", text: "Un punto d’incontro per ciclisti, amici e vicinato, nato dal modo in cui ogni giorno ci si muove in città." },
        { number: "04", title: "Eventi e incontri", text: "Pedalate, mostre, pop-up e appuntamenti alla Station trasformano la cultura SGL in un’esperienza condivisa." }
      ],
      storiesKicker: "Storie dalla Station",
      storiesHeading: "Ci vediamo alla Station.",
      storiesBody: "Personaggi, bevande e storie quotidiane della città si incontrano alla Seagull Station.",
      storiesAlt: "Tre personaggi SGL bevono insieme davanti alla Seagull Station"
    },
    app: {
      liveBadge: "Mini Program · Attivo",
      developmentBadge: "AR · In sviluppo",
      statusNote: "Il Mini Program WeChat SGL è attivo da giugno 2026 e continua a evolversi funzione dopo funzione.",
      exploreButton: "Scopri le schermate ↓",
      heroAlt: "Concept SGL di un’avventura urbana con itinerario, tappe e Pickle",
      screensKicker: "Mini Program · Attivo da giugno 2026",
      screensHeading: "Dallo schermo alla strada.",
      screensBody: "Quattro momenti collegati tra loro, tutti costruiti intorno alla Station. Le anteprime mostrano l’interfaccia in inglese.",
      screens: [
        { file: "map-v2-en.webp", label: "01 / Esplora", title: "Trova la prossima tappa", text: "Scopri la Station, segui un itinerario urbano e guarda cosa sta facendo il tuo gruppo.", alt: "Mappa SGL Station in inglese con prima missione e attività degli amici" },
        { file: "refuel-en.webp", label: "02 / Ricaricati", title: "Una piccola pausa", text: "Caffè, bevande e il tempo di fermarsi: esplora il menu della Station tra un’avventura e l’altra.", alt: "Menu SGL in inglese con bevande e illustrazione della Station" },
        { file: "goods-en.webp", label: "03 / Prodotti", title: "Porta SGL con te", text: "Scopri prodotti Station e miscele della casa, con i prezzi riservati ai membri in evidenza.", alt: "Schermata prodotti SGL in inglese con caffè House Blend e prezzo membri" },
        { file: "missions-en.webp", label: "04 / Missioni", title: "Trasforma la giornata in una missione", text: "Un primo check-in, una pedalata o una bevanda con gli amici: ogni gesto entra nella tua storia urbana.", alt: "Schermata missioni SGL in inglese con modalità attività e progresso giornaliero" }
      ],
      disclaimer: "Il Mini Program è attivo, ma alcune schermate e funzioni mostrate possono contenere dati di esempio o essere ancora in sviluppo. I prezzi del menu Station sono espressi in CNY. Le interazioni AR sono in sviluppo, con uscita prevista per l’inizio del 2027.",
      nextKicker: "Il prossimo capitolo",
      nextHeading: "Una storia in cui vale la pena entrare.",
      nextBody: "Il Mini Program porta l’esperienza digitale della Station nel mondo SGL. Le missioni urbane guidate dai personaggi continuano a crescere, mentre le interazioni AR sono previste per l’inizio del 2027.",
      stationButton: "Scopri Seagull Station"
    },
    about: {
      anniversaryAlt: "Illustrazione ciclistica per il primo anniversario SGL",
      anniversaryCaption: "Primo anniversario",
      filmTitle: "Film SGL della pedalata notturna",
      filmCaption: "Pedalata notturna"
    }
  }
};
