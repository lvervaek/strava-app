import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import {featureEach} from '@turf/turf'

// Main functions
const mainFunctions = require("./main-functions");

mapboxgl.accessToken = 'pk.eyJ1IjoibHZlcnZhZWtlIiwiYSI6ImNsbHh5eXkxbTI2djczcG1sb2dvNTB5YzEifQ.EyJFvAhhrr5DTj0jcAC-dQ';

function getPointFeature(coordinates) {
  return {
    "type": "Feature",
    "properties": {},
    "geometry": {
        "type": "Point",
        "coordinates": coordinates
    }
  }
};

function getLineFeature(name, type, coordinates) {
  return { 
    "type": "Feature", 
    "properties": { 
      "name": name, 
      "activitytype": type
    },
    "geometry": { 
      "type": "LineString", 
      "coordinates": coordinates 
    }
  }
};

export default function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(null);
  const [lat, setLat] = useState(null);
  const [gpxData, setGpxData] = useState([]);
  const [zoom, setZoom] = useState(9);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/lvervaeke/cllydq1vh01l601p94kxjem08',
      center: [lng, lat],
      zoom: zoom
    });
    
    map.current.on('load', async () => {
      // We fetch the JSON here so that we can parse and use it separately
      // from GL JS's use in the added source.
      /*console.log(process.env.PUBLIC_URL +
        "/mygeodata/Afternoon_Run/" +
        encodeURIComponent("tracks") +
        ".geojson")*/
      /*const response = await fetch(
      'https://docs.mapbox.com/mapbox-gl-js/assets/hike.geojson'
      );*/
      //const resp = await fetch(
      //  process.env.PUBLIC_URL + "/mygeodata/Afternoon_Run/Afternoon_Run.gpx"
      //);
      //console.log(resp)
      //const conv = await tj.gpx(resp)
      //console.log(conv)

      var namesResultArray = [];
      var elevationsResultArray = [];
      var positionsResResultArray = []; 
      var geojsonsArray = [];
      var pointsArray = [];
      var maxCoordsLength = 0;

      // Get all gpx filenames
      const gpxFilenamesArray = await mainFunctions.getAllGpxFilenamesDirectory();

      // Line source and layer
      var lines = {
        "type": "FeatureCollection",
        "features": []
      }

      // Line
      map.current.addSource('trace', { type: 'geojson', data: lines });
      map.current.addLayer({
        'id': 'trace',
        'type': 'line',
        'source': 'trace',
        'paint': {
          'line-color': [
            'match',
            ['get', 'activitytype'],
            'running',
            '#42e3f5',
            'biking',
            '#fc2626',
            'blue'
            ],
          'line-opacity': 0.5,
          'line-width': 2
          }
        }
      );
      
      // Point source and layer
      var points = {
        'type': 'FeatureCollection',
        'features': []
      };

      map.current.addSource('point', { type: 'geojson', data: points });
      map.current.addLayer({
        'id': 'point',
        'type': 'circle',
        'source': 'point',
        'paint': {
          'circle-color': '#fbb03b',
          'circle-radius': {
            'base': 1.75,
            'stops': [
            [12, 2],
            [22, 180]
            ]
          }
      }});

      // Get informations foreach gpx file
      for (let i = 0 ; i < gpxFilenamesArray.length; i++){
        let gpxName = gpxFilenamesArray[i];
        // Parse gpx (use this code when you are out the codesandbox)
        const parseGpxData = await mainFunctions.parseGpxFile(
          process.env.PUBLIC_URL +
            "/gpx/" +
            encodeURIComponent(gpxName) +
            ".gpx"
        );

        // Tracks positions
        const trackPositions = await mainFunctions.getTracksPositions(
          parseGpxData
        );
        positionsResResultArray.push(trackPositions[0]);
        //console.log(trackPositions[0])

        // Save Coordinates for later  
        const coordinates = trackPositions[0];
        if (coordinates.length > maxCoordsLength) { maxCoordsLength = coordinates.length }
        geojsonsArray.push(lines)  

        //add feature to FeatureCollection
        lines.features.push(getLineFeature(gpxName, parseGpxData[0].type, [coordinates[0]]))
        points.features.push(getPointFeature(coordinates[0]))
      }


      map.current.jumpTo({ 'center': positionsResResultArray[0][0], 'zoom': 14 })
      //map.current.setPitch(30);
       
      // on a regular basis, add more coordinates from the saved list and update the map
      let i = 0
      var arr = Array.from({length: gpxFilenamesArray.length}, (_, index) => index)
      var flag = 0
      var deletions = []
      function animate() {
        
        if (i < maxCoordsLength) {

          featureEach(lines, function (currentFeature, featureIndex){
            if (i == positionsResResultArray[featureIndex].length - 1){
              deletions.push(featureIndex)
            } else {
              currentFeature.geometry.coordinates.push(positionsResResultArray[featureIndex][i])
              points.features[featureIndex].geometry.coordinates = positionsResResultArray[featureIndex][i]
            }
          });

          deletions.forEach((toDelete) => {
            lines.features.splice(toDelete,1)
            points.features.splice(toDelete,1)
            positionsResResultArray.splice(toDelete,1)
          });
          deletions = []

          map.current.getSource('trace').setData(lines);
          map.current.getSource('point').setData(points);
          
          //map.current.panTo(coordinates[i]);
          i++;
          //console.log(i)
          window.requestAnimationFrame(animate);
        } else {
          
        }
        
      }
      window.requestAnimationFrame(animate);
    });
    

    map.current.on('move', () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });

  });
  return (
    <div>
      <div className="sidebar">
        Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
      </div>
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}