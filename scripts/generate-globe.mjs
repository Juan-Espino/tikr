// Natural Earth 110m land is public domain: https://www.naturalearthdata.com/about/terms-of-use/
// Input matches the map source in the owner's v0 rotating-earth component.
import fs from "node:fs";
import {
  geoContains,
  geoDistance,
  geoGraticule10,
  geoOrthographic,
  geoPath,
} from "d3-geo";

const land = JSON.parse(fs.readFileSync("public/globe/land.json", "utf8"));
const dots = [];
for (let lat = -88; lat <= 88; lat += 1.28) {
  for (let lng = -180; lng < 180; lng += 1.28) {
    if (geoContains(land, [lng, lat]))
      dots.push([+lng.toFixed(2), +lat.toFixed(2)]);
  }
}
fs.writeFileSync("public/globe/dots.json", JSON.stringify(dots));
const projection = geoOrthographic()
  .rotate([-45, -15])
  .scale(220)
  .translate([250, 250]);
const path = geoPath(projection);
const visibleDots = dots.filter(
  (point) => geoDistance(point, [45, 15]) < Math.PI / 2,
);
const circles = visibleDots
  .map((point) => {
    const [x, y] = projection(point);
    return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r=".8"/>`;
  })
  .join("");
fs.writeFileSync(
  "public/globe/fallback.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><circle cx="250" cy="250" r="220" fill="#080808" stroke="#e7e5e4" stroke-width="1.2"/><path d="${path(geoGraticule10())}" fill="none" stroke="#78716c" stroke-width=".5"/><path d="${path(land)}" fill="none" stroke="#e7e5e4" stroke-width=".6"/><g fill="#a8a29e">${circles}</g></svg>\n`,
);
console.log(`Generated ${dots.length} land dots and static globe fallback.`);
