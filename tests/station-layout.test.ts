import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import LocalizedPage from "../app/[locale]/[[...segments]]/page";
import StationPage from "../app/station/page";

function section(html: string, current: string, next: string) {
  const start = html.indexOf(`data-content-section="${current}"`);
  const end = html.indexOf(`data-content-section="${next}"`, start + 1);
  assert.notEqual(start, -1, `${current} is missing`);
  assert.notEqual(end, -1, `${next} is missing after ${current}`);
  return html.slice(start, end);
}

function assertStationMediaLayout(html: string) {
  const hero = section(html, "station.hero-image", "station.hero");
  const stationLife = section(html, "station.station-life", "station.offerings");

  assert.match(hero, /seagull-sunset\.webp/);
  assert.doesNotMatch(hero, /shanghai-bike-studio|station-club-storefront/);
  assert.match(stationLife, /shanghai-bike-studio\.webp/);
  assert.match(stationLife, /station-club-storefront\.png/);
  assert.match(stationLife, /SGL Bike Studio · Shanghai/);
  assert.match(stationLife, /Station Club House/);
  assert.doesNotMatch(html, /data-content-section="station\.shanghai-store"/);
}

test("English Station restores the original hero and nests both stores under Station Life", () => {
  assertStationMediaLayout(renderToStaticMarkup(StationPage()));
});

test("localized Station pages keep the same store-photo placement", async () => {
  for (const locale of ["zh-CN", "ja-JP", "ko-KR", "it-IT"]) {
    const page = await LocalizedPage({ params: Promise.resolve({ locale, segments: ["station"] }) });
    assertStationMediaLayout(renderToStaticMarkup(page));
  }
});
