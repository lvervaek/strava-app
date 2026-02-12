import { gpx } from "@tmcw/togeojson";

// Parse GPX XML string into track data
export async function parseGpxFileData(xmlString) {
  const doc = new DOMParser().parseFromString(xmlString, "text/xml");
  const geojson = gpx(doc);

  return geojson.features
    .filter((f) => f.geometry.type === "LineString" || f.geometry.type === "MultiLineString")
    .map((feature, i) => {
      // For LineString, coordinates are [[lon, lat, ele], ...]
      // For MultiLineString, flatten the first line
      const coords =
        feature.geometry.type === "MultiLineString"
          ? feature.geometry.coordinates[0]
          : feature.geometry.coordinates;

      const positions = coords.map(([lon, lat]) => [lon, lat]);

      const coordTimes = feature.properties.coordinateProperties?.times;
      const rawTimes = Array.isArray(coordTimes?.[0]) ? coordTimes[0] : coordTimes;
      const times = rawTimes ? rawTimes.map((t) => new Date(t)) : [];

      return {
        id: i,
        name: feature.properties.name || `Track ${i + 1}`,
        type: feature.properties.type || "",
        positions,
        times,
      };
    });
}

// Collect positions and times from parsed tracks
export function getTracksPositions(parseGpxData) {
  const positions = parseGpxData.map((t) => t.positions);
  const times = parseGpxData.map((t) => t.times);
  return { positions, times };
}

// Get all GPX filenames from the public/gpx directory
export async function getAllGpxFilenamesDirectory() {
  const context = require.context("../public/gpx", true, /^\.\/.*$/, "sync");
  return context.keys().map((file) => {
    const fileName = file.replace("./", "");
    return fileName.substring(0, fileName.length - ".gpx".length);
  });
}
