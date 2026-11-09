import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import LocalizedPage from "../app/[locale]/[[...segments]]/page";
import AboutPage from "../app/about/page";
import StationPage from "../app/station/page";
import { localizedRichCopy } from "../lib/localized-rich-copy";

function section(html: string, current: string, next?: string) {
  const start = html.indexOf(`data-content-section="${current}"`);
  const end = next ? html.indexOf(`data-content-section="${next}"`, start + 1) : html.length;
  assert.notEqual(start, -1, `${current} is missing`);
  if (next) assert.notEqual(end, -1, `${next} is missing after ${current}`);
  return html.slice(start, end);
}

function imageOccurrences(html: string, filename: string) {
  return html.match(new RegExp(`<img[^>]+${filename.replaceAll(".", "\\.")}[^>]*>`, "g"))?.length ?? 0;
}

function figureWithImage(html: string, filename: string) {
  const figure = html.match(new RegExp(`<figure[^>]*>[\\s\\S]*?${filename.replaceAll(".", "\\.")}[\\s\\S]*?</figure>`))?.[0];
  assert.ok(figure, `figure containing ${filename} is missing`);
  return figure;
}

function assertStationMediaLayout(html: string) {
  const hero = section(html, "station.hero-image", "station.hero");
  const stationLife = section(html, "station.station-life", "station.offerings");
  const stationLogic = section(html, "station.station-logic", "station.mini-program");
  const stationStories = section(html, "station.station-stories");

  assert.match(hero, /seagull-coffee-characters-v2\.webp/);
  assert.doesNotMatch(hero, /shanghai-bike-studio|station-club-house/);
  assert.doesNotMatch(stationLife, /shanghai-bike-studio/);
  assert.doesNotMatch(stationLife, /station-club-house-v2\.webp/);
  assert.match(stationLogic, /station-club-house-v2\.webp/);
  assert.match(stationLogic, /Station Club House/);
  assert.doesNotMatch(html, /shanghai-bike-studio-v3\.webp/);
  assert.doesNotMatch(html, /Bike Studio/i);
  assert.doesNotMatch(stationStories, /station-club-house-v2\.webp/);
  assert.match(stationStories, /station-three-birds\.webp/);
  assert.equal(imageOccurrences(html, "station-club-house-v2.webp"), 1);
  assert.equal(stationLife.match(/<figure/g)?.length, 6, "Station Life must contain only its six everyday moments");
  assert.equal(stationLogic.match(/<figure/g)?.length, 1, "Station Logic must contain the current Station location");
  assert.match(stationLogic, /md:grid-cols-\[1\.35fr_0\.65fr\]/);
  assert.match(stationLogic, /max-w-5xl/);
  assert.doesNotMatch(html, /data-content-section="station\.shanghai-store"/);
}

function assertAboutMediaLayout(html: string, expectedTitle: string, expectedAlt: string) {
  const brandStructure = section(html, "about.brand-structure", "about.media");
  const media = section(html, "about.media", "about.directions");
  const bikeStudioFigure = figureWithImage(brandStructure, "shanghai-bike-studio-v3.webp");

  assert.equal(imageOccurrences(html, "shanghai-bike-studio-v3.webp"), 1);
  assert.ok(bikeStudioFigure.includes(expectedTitle), `Bike Studio figure is missing ${expectedTitle}`);
  assert.ok(bikeStudioFigure.includes(expectedAlt), `Bike Studio figure is missing the localized alt text`);
  assert.match(brandStructure, /max-w-5xl/);
  assert.match(brandStructure, /max-w-3xl text-center/);
  assert.match(brandStructure, /mx-auto mt-10 max-w-3xl/);
  assert.match(brandStructure, /h-auto w-full object-cover/);
  assert.doesNotMatch(media, /shanghai-bike-studio/);
  assert.doesNotMatch(html, /station-club-house-v2\.webp/);
  assert.ok(
    html.indexOf('data-content-section="about.history"')
      < html.indexOf('data-content-section="about.principles"')
      && html.indexOf('data-content-section="about.principles"')
      < html.indexOf('data-content-section="about.brand-structure"')
      && html.indexOf('data-content-section="about.brand-structure"')
      < html.indexOf('data-content-section="about.media"'),
    "Bike Studio must sit in the middle of About, between Principles and media",
  );
}

test("English separates the Shanghai Station network from the Bike Studio brand space", () => {
  const stationHtml = renderToStaticMarkup(StationPage());
  const stationLogic = section(stationHtml, "station.station-logic", "station.mini-program");
  assertStationMediaLayout(stationHtml);
  assert.match(stationLogic, /Current Station/);
  assert.match(stationLogic, /Station Club House · Shanghai/);
  assert.match(stationLogic, /Jinyan Road &amp; Dongxiu Road Plaza, L1/);
  assert.match(stationHtml, /Future Station locations will connect SGL communities across cities/);
  assertAboutMediaLayout(
    renderToStaticMarkup(AboutPage()),
    "SGL Bike Studio · Shanghai",
    "SGL Bike Studio showroom in Shanghai with bicycles, apparel and riding goods",
  );
});

test("localized Station and About pages keep the same venue ownership", async () => {
  for (const locale of ["zh-CN", "ja-JP", "ko-KR", "it-IT"] as const) {
    const station = await LocalizedPage({ params: Promise.resolve({ locale, segments: ["station"] }) });
    const about = await LocalizedPage({ params: Promise.resolve({ locale, segments: ["about"] }) });
    const stationHtml = renderToStaticMarkup(station);
    const stationLogic = section(stationHtml, "station.station-logic", "station.mini-program");
    assertStationMediaLayout(stationHtml);
    for (const location of localizedRichCopy[locale].station.locationPhotos) {
      assert.ok(stationLogic.includes(location.title), `${locale} Station Logic is missing its location title`);
      assert.ok(stationLogic.includes(location.status), `${locale} Station Logic is missing its location status`);
      assert.ok(stationLogic.includes(location.address), `${locale} Station Logic is missing its location address`);
    }
    assert.ok(
      stationHtml.includes(localizedRichCopy[locale].station.storiesBody),
      `${locale} Station is missing its future network copy`,
    );
    const bikeStudio = localizedRichCopy[locale].about.bikeStudioPhoto;
    assertAboutMediaLayout(renderToStaticMarkup(about), bikeStudio.title, bikeStudio.alt);
  }
});
