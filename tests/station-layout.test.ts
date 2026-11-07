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
  const stationStories = section(html, "station.station-stories");
  const galleryStart = stationLife.indexOf('class="mt-8 columns-1');
  const galleryEnd = stationLife.indexOf("</div>", galleryStart);
  const clubHouseImage = stationLife.indexOf("station-club-storefront.png");

  assert.match(hero, /seagull-sunset\.webp/);
  assert.doesNotMatch(hero, /shanghai-bike-studio|station-club-storefront/);
  assert.doesNotMatch(stationLife, /shanghai-bike-studio/);
  assert.match(stationLife, /station-club-storefront\.png/);
  assert.match(stationLife, /Station Club House/);
  assert.doesNotMatch(html, /shanghai-bike-studio\.webp/);
  assert.doesNotMatch(html, /Bike Studio/i);
  assert.doesNotMatch(stationStories, /station-club-storefront\.png/);
  assert.match(stationStories, /station-three-birds\.webp/);
  assert.equal(imageOccurrences(html, "station-club-storefront.png"), 1);
  assert.equal(stationLife.match(/<figure/g)?.length, 7, "Station Life must contain six moments and one current location");
  assert.ok(
    stationLife.indexOf("cheers-together.webp") < stationLife.indexOf("station-club-storefront.png"),
    "the current Shanghai Station must render below the Station Life photo gallery",
  );
  assert.ok(galleryStart >= 0 && galleryEnd >= 0 && galleryEnd < clubHouseImage,
    "the Club House card must remain outside and below the multi-column gallery",
  );
  assert.match(stationLife, /md:grid-cols-\[1\.35fr_0\.65fr\]/);
  assert.match(stationLife, /max-w-5xl/);
  assert.doesNotMatch(html, /data-content-section="station\.shanghai-store"/);
}

function assertAboutMediaLayout(html: string, expectedTitle: string, expectedAlt: string) {
  const brandStructure = section(html, "about.brand-structure", "about.principles");
  const media = section(html, "about.media", "about.directions");
  const bikeStudioFigure = figureWithImage(brandStructure, "shanghai-bike-studio.webp");

  assert.equal(imageOccurrences(html, "shanghai-bike-studio.webp"), 1);
  assert.ok(bikeStudioFigure.includes(expectedTitle), `Bike Studio figure is missing ${expectedTitle}`);
  assert.ok(bikeStudioFigure.includes(expectedAlt), `Bike Studio figure is missing the localized alt text`);
  assert.match(brandStructure, /lg:grid-cols-\[1\.15fr_0\.85fr\]/);
  assert.match(brandStructure, /relative aspect-video w-full flex-1 overflow-hidden lg:aspect-auto lg:min-h-\[360px\]/);
  assert.doesNotMatch(media, /shanghai-bike-studio/);
  assert.doesNotMatch(html, /station-club-storefront\.png/);
  assert.ok(
    html.indexOf('data-content-section="about.history"')
      < html.indexOf('data-content-section="about.brand-structure"')
      && html.indexOf('data-content-section="about.brand-structure"')
      < html.indexOf('data-content-section="about.principles"')
      && html.indexOf('data-content-section="about.principles"')
      < html.indexOf('data-content-section="about.media"'),
    "Bike Studio must move above Principles, with Principles separating it from media",
  );
}

test("English separates the Shanghai Station network from the Bike Studio brand space", () => {
  const stationHtml = renderToStaticMarkup(StationPage());
  const stationLife = section(stationHtml, "station.station-life", "station.offerings");
  assertStationMediaLayout(stationHtml);
  assert.match(stationLife, /Current Station/);
  assert.match(stationLife, /Station Club House · Shanghai/);
  assert.match(stationLife, /Jinyan Road &amp; Dongxiu Road Plaza, L1/);
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
    const stationLife = section(stationHtml, "station.station-life", "station.offerings");
    assertStationMediaLayout(stationHtml);
    for (const location of localizedRichCopy[locale].station.locationPhotos) {
      assert.ok(stationLife.includes(location.title), `${locale} Station Life is missing its location title`);
      assert.ok(stationLife.includes(location.status), `${locale} Station Life is missing its location status`);
      assert.ok(stationLife.includes(location.address), `${locale} Station Life is missing its location address`);
    }
    assert.ok(
      stationHtml.includes(localizedRichCopy[locale].station.storiesBody),
      `${locale} Station is missing its future network copy`,
    );
    const bikeStudio = localizedRichCopy[locale].about.bikeStudioPhoto;
    assertAboutMediaLayout(renderToStaticMarkup(about), bikeStudio.title, bikeStudio.alt);
  }
});
