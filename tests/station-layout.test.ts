import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import LocalizedPage from "../app/[locale]/[[...segments]]/page";
import StationPage from "../app/station/page";

function section(html: string, current: string, next?: string) {
  const start = html.indexOf(`data-content-section="${current}"`);
  const end = next ? html.indexOf(`data-content-section="${next}"`, start + 1) : html.length;
  assert.notEqual(start, -1, `${current} is missing`);
  if (next) assert.notEqual(end, -1, `${next} is missing after ${current}`);
  return html.slice(start, end);
}

function assertStationMediaLayout(html: string) {
  const hero = section(html, "station.hero-image", "station.hero");
  const stationLife = section(html, "station.station-life", "station.offerings");
  const stationStories = section(html, "station.station-stories");

  assert.match(hero, /seagull-sunset\.webp/);
  assert.doesNotMatch(hero, /shanghai-bike-studio|station-club-storefront/);
  assert.doesNotMatch(stationLife, /shanghai-bike-studio|station-club-storefront/);
  assert.match(stationStories, /shanghai-bike-studio\.webp/);
  assert.match(stationStories, /station-club-storefront\.png/);
  assert.match(stationStories, /SGL Bike Studio · Shanghai/);
  assert.match(stationStories, /Station Club House/);
  assert.ok(
    stationStories.indexOf("station-three-birds.webp") < stationStories.indexOf("shanghai-bike-studio.webp"),
    "store cards must render below the Meet at the Station content",
  );
  assert.equal(stationStories.match(/aspect-\[3\/2\]/g)?.length, 2);
  assert.equal(stationStories.match(/flex h-full flex-col/g)?.length, 2);
  assert.doesNotMatch(html, /data-content-section="station\.shanghai-store"/);
}

test("English Station places equal-height store cards below Meet at the Station", () => {
  assertStationMediaLayout(renderToStaticMarkup(StationPage()));
});

test("localized Station pages keep the same bottom store-card placement", async () => {
  for (const locale of ["zh-CN", "ja-JP", "ko-KR", "it-IT"]) {
    const page = await LocalizedPage({ params: Promise.resolve({ locale, segments: ["station"] }) });
    assertStationMediaLayout(renderToStaticMarkup(page));
  }
});
