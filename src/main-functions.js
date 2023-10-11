// NPM
//const axios = require("axios");
import axios, * as others from 'axios';

// Get max and min number from array of arrays
export async function maxMinNumberFromArrayOfArrays(array, keyNumber) {
  return new Promise(async (resolve, reject) => {
    try {
      // Params
      let resultArray = [];

      array.forEach((element, i) => {
        resultArray.push(element[keyNumber]);

        if (i + 1 === array.length) {
          // Get the min and max number from array
          let max = Math.max(...resultArray);
          let min = Math.min(...resultArray);
          let fullElevations = resultArray;

          // Result object
          let obj = {
            max: max,
            min: min,
            full: fullElevations
          };

          resolve(obj);
        }
      });
    } catch (error) {
      console.error(":( maxMinNumberFromArrayOfArrays error");
      reject(console.log);
    }
  });
}

export async function parseGpxFile(gpxXmlFile) {
  return new Promise(async (resolve, reject) => {
    try {
      axios
        .get(gpxXmlFile, {
          "Content-Type": "application/xml; charset=utf-8"
        })
        .then(async (response) => {
          // Gpx file string
          var gpxStr = response.data;
          
          // Count lat & lon
          var trkCount = gpxStr.match(/<trk>/g).length;

          // While loop params
          var i = 0;
          var resultArray = [];

          while (i < trkCount) {
            // Number of total characters
            let totalGpxStr = gpxStr.length;

            // Slice str to each <trk></trk> segment
            let trkPosition = gpxStr.indexOf("<trk>");
            let trkLastPosition = gpxStr.indexOf("</trk>") + "</trk>".length;
            let trkStr = gpxStr.substring(trkPosition, trkLastPosition);

            // If <trk></trk> is existing
            if (trkPosition > 0) {
              // Redefine the native string
              gpxStr = gpxStr.substring(trkLastPosition, totalGpxStr);

              resultArray.push(trkStr);
            }

            // Incrementation
            i++;
          }

          // Foreach loop params
          var resultArrObj = [];

          // Get all latitudes and longitudes data for each track
          for (let f = 0; f < resultArray.length; f++) {
            // Variables params
            var track = resultArray[f];

            // Track's name
            let namePosition =
              resultArray[f].indexOf("<name>") + "<name>".length;
            let nameLastPosition = resultArray[f].indexOf("</name>");
            let trackName = resultArray[f].substring(
              namePosition,
              nameLastPosition
            );

            // Track's type
            let typePosition =
              resultArray[f].indexOf("<type>") + "<type>".length;
            let typeLastPosition = resultArray[f].indexOf("</type>");
            let trackType = resultArray[f].substring(
              typePosition,
              typeLastPosition
            );  

            // Params
            var n = 0;
            var arr = [];

            // Count lat & lon
            var latLonCount = resultArray[f].match(/lat=/g).length;

            while (n < latLonCount) {
              // Number of total characters
              let totalStr = track.length;

              // Selection of string
              var selectedStrPosition = track.indexOf("<trkpt");
              var selectedStrLastPosition = track.indexOf("</trkpt>");
              var selectedStr = track.substring(
                selectedStrPosition,
                selectedStrLastPosition
              );

              // Get elevations
              var selectedElevationStrPosition =
                track.indexOf("<ele>") + "<ele>".length;
              var selectedElevationStrLastPosition = track.indexOf("</ele>");
              var selectedElevationsStr = track.substring(
                selectedElevationStrPosition,
                selectedElevationStrLastPosition
              );
              var eleValue = parseFloat(selectedElevationsStr);

              //Get time!!
              var selectedTimeStrPosition =
                track.indexOf("<time>") + "<time>".length;
              var selectedTimeStrLastPosition = track.indexOf("</time>");
              var selectedTimeStr = track.substring(
                selectedTimeStrPosition,
                selectedTimeStrLastPosition
              );
              var timeValue = new Date(selectedTimeStr);

              // Get latitude and longitude between double quotes from the string
              var reg = new RegExp(/"(.*?)"/g); // Double quotes included
              var matches = selectedStr.match(reg);
              var matchesArr = [];

              // Record matches
              for (let match of matches) {
                // Match convert to number format
                let v = parseFloat(match.replace(/['"]+/g, ""));

                // Record
                matchesArr.push(v);
              }

              // Latitude value
              let latValue = matchesArr[0];

              // Longitude value
              let lonValue = matchesArr[1];

              // If <trkpt></trkpt> is existing
              if (selectedStrPosition > 0) {
                // Redefine the native string
                track = track.substring(selectedStrLastPosition + 5, totalStr);

                // Record
                arr.push([lonValue, latValue]);
                //arr.push([latValue, lonValue, eleValue]);
              }

              // Incrementation
              n++;

              // While loop end
              if (n === latLonCount) {
                // Remove duplicated values
                //let stringArray = arr.map(JSON.stringify);
                //let uniqueStringArray = new Set(stringArray);
                //let uniqueArray = Array.from(uniqueStringArray, JSON.parse);
                let uniqueArray = arr  
                // Min and max elevations
                const minMaxElevations = await maxMinNumberFromArrayOfArrays(
                  uniqueArray,
                  2
                );

                // Result object
                let obj = {
                  id: f,
                  name: trackName,
                  type: trackType,
                  positions: uniqueArray,
                  elevations: minMaxElevations
                };

                //console.log(obj);

                // Record
                resultArrObj.push(obj);
              }
            }

            // For loop end
            if (f + 1 === resultArray.length) {
              resolve(resultArrObj);
            }
          }
        });
    } catch (error) {
      console.log(error)
      console.error(":( parseGpxFile error");
      reject(console.log);
    }
  });
}

// Parse gpx file
export async function parseGpxFileData(data) {
  return new Promise(async (resolve, reject) => {
          // Gpx file string
          var gpxStr = data;
          
          // Count lat & lon
          var trkCount = gpxStr.match(/<trk>/g).length;

          // While loop params
          var i = 0;
          var resultArray = [];

          while (i < trkCount) {
            // Number of total characters
            let totalGpxStr = gpxStr.length;

            // Slice str to each <trk></trk> segment
            let trkPosition = gpxStr.indexOf("<trk>");
            let trkLastPosition = gpxStr.indexOf("</trk>") + "</trk>".length;
            let trkStr = gpxStr.substring(trkPosition, trkLastPosition);

            // If <trk></trk> is existing
            if (trkPosition > 0) {
              // Redefine the native string
              gpxStr = gpxStr.substring(trkLastPosition, totalGpxStr);

              resultArray.push(trkStr);
            }

            // Incrementation
            i++;
          }

          // Foreach loop params
          var resultArrObj = [];

          // Get all latitudes and longitudes data for each track
          for (let f = 0; f < resultArray.length; f++) {
            // Variables params
            var track = resultArray[f];

            // Track's name
            let namePosition =
              resultArray[f].indexOf("<name>") + "<name>".length;
            let nameLastPosition = resultArray[f].indexOf("</name>");
            let trackName = resultArray[f].substring(
              namePosition,
              nameLastPosition
            );

            // Track's type
            let typePosition =
              resultArray[f].indexOf("<type>") + "<type>".length;
            let typeLastPosition = resultArray[f].indexOf("</type>");
            let trackType = resultArray[f].substring(
              typePosition,
              typeLastPosition
            );  

            // Params
            var n = 0;
            var arr = [];
            var timeArr = [];

            // Count lat & lon
            var latLonCount = resultArray[f].match(/lat=/g).length;

            while (n < latLonCount) {
              // Number of total characters
              let totalStr = track.length;

              // Selection of string
              var selectedStrPosition = track.indexOf("<trkpt");
              var selectedStrLastPosition = track.indexOf("</trkpt>");
              var selectedStr = track.substring(
                selectedStrPosition,
                selectedStrLastPosition
              );

              // Get elevations
              var selectedElevationStrPosition =
                track.indexOf("<ele>") + "<ele>".length;
              var selectedElevationStrLastPosition = track.indexOf("</ele>");
              var selectedElevationsStr = track.substring(
                selectedElevationStrPosition,
                selectedElevationStrLastPosition
              );
              var eleValue = parseFloat(selectedElevationsStr);

              //Get time!!
              var selectedTimeStrPosition =
                track.indexOf("<time>") + "<time>".length;
              var selectedTimeStrLastPosition = track.indexOf("</time>");
              var selectedTimeStr = track.substring(
                selectedTimeStrPosition,
                selectedTimeStrLastPosition
              );
              var timeValue = new Date(selectedTimeStr);

              // Get latitude and longitude between double quotes from the string
              var reg = new RegExp(/"(.*?)"/g); // Double quotes included
              var matches = selectedStr.match(reg);
              var matchesArr = [];

              // Record matches
              for (let match of matches) {
                // Match convert to number format
                let v = parseFloat(match.replace(/['"]+/g, ""));

                // Record
                matchesArr.push(v);
              }

              // Latitude value
              let latValue = matchesArr[0];

              // Longitude value
              let lonValue = matchesArr[1];

              // If <trkpt></trkpt> is existing
              if (selectedStrPosition > 0) {
                // Redefine the native string
                track = track.substring(selectedStrLastPosition + 5, totalStr);

                // Record
                arr.push([lonValue, latValue]);
                timeArr.push(timeValue)
                //arr.push([latValue, lonValue, eleValue]);
              }

              // Incrementation
              n++;

              // While loop end
              if (n === latLonCount) {
                // Remove duplicated values
                //let stringArray = arr.map(JSON.stringify);
                //let uniqueStringArray = new Set(stringArray);
                //let uniqueArray = Array.from(uniqueStringArray, JSON.parse);
                let uniqueArray = arr
                
                if (arr.length != uniqueArray.length){
                  console.log("duplicates removed: ", (arr.length - uniqueArray.length))
                }

                // Min and max elevations
                /*const minMaxElevations = await maxMinNumberFromArrayOfArrays(
                  uniqueArray,
                  2
                );*/

                // Result object
                let obj = {
                  id: f,
                  name: trackName,
                  type: trackType,
                  positions: uniqueArray,
                  times: timeArr
                  //elevations: minMaxElevations
                };

                //console.log(obj);

                // Record
                resultArrObj.push(obj);
              }
            }

            // For loop end
            if (f + 1 === resultArray.length) {
              resolve(resultArrObj);
            }
          }
    });
  }

// Get min and max elevations from multiple tracks contained into a single gpx file
export async function getMinMaxElevation(parseGpxData) {
  return new Promise(async (resolve, reject) => {
    try {
      // Params
      var b = [];

      parseGpxData.forEach((element, i) => {
        // Elevations record
        b.push(parseFloat(element.elevations.max));
        b.push(parseFloat(element.elevations.min));

        // Foreach loop end
        if (i + 1 === parseGpxData.length) {
          // Min & max elevations
          let minElevation = Math.min(...b);
          let maxElevation = Math.max(...b);

          // Result object
          let obj = { min: minElevation, max: maxElevation };

          resolve(obj);
        }
      });
    } catch (error) {
      console.error(":( getMinMaxElevation error");
      reject(console.log);
    }
  });
}

// Get tracks positions
export async function getTracksPositions(parseGpxData) {
  return new Promise(async (resolve, reject) => {
    try {
      // Params
      var pos = [];
      var time = [];

      parseGpxData.forEach((element, i) => {
        // Positions record
        pos.push(element.positions);
        time.push(element.times);

        // Foreach loop end
        if (i + 1 === parseGpxData.length) {
          resolve({'positions':pos,'times': time});
        }
      });
    } catch (error) {
      console.error(":( getTracksPositions error");
      reject(console.log);
    }
  });
}

// Get all filenames from a directory
export async function getAllGpxFilenamesDirectory() {
  return new Promise(async (resolve, reject) => {
    try {
      // Fs NPM
      //const fs = require("fs");

      // Params
      var resultArray = [];

      // Read directory
      /*fs.readdir("../../public/gpx", function (err, filesArray) {
        // Error
        if (err) {
          return console.log("Unable to scan directory: " + err);
        }

        // Listing all files
        filesArray.sort().map((fileName, i) => {
          // Get filename only
          let name = fileName.substring(0, fileName.length - ".gpx".length);

          // Record
          resultArray.push(name);

          // End
          if (i + 1 === filesArray.length) {
            //console.log(resultArray);
            resolve(resultArray);
          }
        });
      });*/

      // Context (use this code when you are out the codesandbox)
      let context = require.context("../public/gpx", true,/^\.\/.*$/, 'sync')
      //let context = require.context("./gpx/", false, /\.gpx$/);

      // Result array
      let files = [];

      context.keys().forEach((file, i) => {
        // Result
        let fileName = file.replace("./", "");
        let name = fileName.substring(0, fileName.length - ".gpx".length);

        // Record filename
        files.push(name);

        // End
        if (i + 1 === context.length) {
          resolve(files);
        }
      });
    } catch (error) {
      console.error(":( getAllGpxFilenamesDirectory error");
      reject(console.log);
    }
  });
}

// Random colors from palette
export async function randomColorPalette() {
  return new Promise(async (resolve, reject) => {
    try {
      // Colors params
      let colors = {
        aqua: "#00ffff",
        blue: "#0000ff",
        cyan: "#00ffff",
        fuchsia: "#ff00ff",
        green: "#008000",
        indigo: "#4b0082",
        lime: "#00ff00",
        magenta: "#ff00ff",
        navy: "#000080",
        orange: "#ffa500",
        purple: "#800080",
        violet: "#800080",
        red: "#ff0000",
        yellow: "#ffff00"
      };

      // Get all values of colors object
      const values = Object.values(colors);

      // Get one random color
      var color = values[Math.floor(Math.random() * values.length)];

      resolve(color);
    } catch (error) {
      console.error(":( randomColorPalette error");
      reject(console.log);
    }
  });
}

// Get tracks names
export async function getTracksNamesArray(tracksdata, id) {
  return new Promise(async (resolve, reject) => {
    try {
      // Params
      var resultArray = [];

      tracksdata.map((elementObj, i) => {
        // Result obj
        let obj = { id: id, name: elementObj.name };

        // Record
        resultArray.push(obj);

        // End
        if (i + 1 === tracksdata.length) {
          resolve(resultArray);
        }
      });
    } catch (error) {
      console.error(":( getTracksNamesArray error");
      reject(console.log);
    }
  });
}

// Create an elevations data object to Recharts NPM
export async function elevationsObject(elevationsResultArray) {
  return new Promise(async (resolve, reject) => {
    try {
      // Params
      let resArr = [];

      // Listing each object from array
      elevationsResultArray.forEach((element, m) => {
        var obj = { id: element.id, data: [] };

        // Listing each positions of object from array
        element.data[0].positions.forEach((position, o) => {
          // Result obj
          let resultObj = {
            id: o,
            elevation: position[2],
            position: {
              lat: position[0],
              lon: position[1]
            }
          };

          // Data record
          obj.data.push(resultObj);

          if (element.data[0].positions.length === o + 1) {
            // Object record
            resArr.push(obj);
          }
        });

        if (elevationsResultArray.length === m + 1) {
          // Params
          let resArray = [];

          // Sort array by id
          resArr = resArr.sort((a, b) => (a.id > b.id ? 1 : -1));

          // Listing each object
          resArr.forEach((element, h) => {
            // Data record
            resArray.push(element.data);

            // Loop end
            if (resArr.length === h + 1) {
              resolve(resArray.flat());
            }
          });
        }
      });
    } catch (error) {
      console.error(":( elevationsObject error");
      reject(console.log);
    }
  });
}

// Calculate between positions - Return the distance between (lat1,lon1) and (lat2,lon2) in meter
export async function calculateDistanceBetweenPositions(positionsArrayObj) {
  return new Promise(async (resolve, reject) => {
    try {
      // Earth radius in meter
      let radius = 6378137.0;

      // Degree to radian conversion
      let DE2RA = 0.01745329252;

      // Params
      let lat1 = positionsArrayObj[0].lat;
      let lon1 = positionsArrayObj[0].lon;
      let lat2 = positionsArrayObj[1].lat;
      let lon2 = positionsArrayObj[1].lon;

      // If same point
      if (lat1 === lat2 && lon1 === lon2) return 0;

      // Degree calculation
      lat1 *= DE2RA;
      lon1 *= DE2RA;
      lat2 *= DE2RA;
      lon2 *= DE2RA;

      // Calculation
      let d =
        Math.sin(lat1) * Math.sin(lat2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2);

      // Distance in meter
      let distance = radius * Math.acos(d);

      resolve(distance);
    } catch (error) {
      console.error(":( calculateDistanceBetweenPositions error");
      reject(console.log);
    }
  });
}

// Track distance calculation
export async function trackDistanceCalculation(positionsArray) {
  return new Promise(async (resolve, reject) => {
    try {
      //let positionsArray =  [[42.913941, -8.0148, 456.5],[42.926359, -8.162513, 389.7]]

      positionsArray.forEach((element, i) => {
        // Params
        let resultArray = [];

        // Listing each array from main array
        element.forEach((elementArray, k) => {
          let obj = {
            lat: elementArray[0],
            lon: elementArray[1]
          };

          // Record each object
          resultArray.push(obj);

          if (element.length === k + 1) {
            // Params
            var resolveArray = [];

            // Distance calculation between each point
            resultArray.forEach(async (position, l) => {
              // Stop at last object
              if (typeof resultArray[l + 1] === "object") {
                // Params
                let position1 = {
                  lat: resultArray[l].lat,
                  lon: resultArray[l].lon
                };

                let position2 = {
                  lat: resultArray[l + 1].lat,
                  lon: resultArray[l + 1].lon
                };

                // Params
                let arrObj = [position1, position2];

                // Distance
                let distance = await calculateDistanceBetweenPositions(arrObj);

                // Record
                resolveArray.push(distance);

                // Loop end
                if (resultArray.length === l + 2) {
                  // Total distance calculation
                  let totalDistance = resolveArray.reduce((a, b) => a + b, 0);

                  resolve(totalDistance);
                }
              }
            });
          }
        });
      });
    } catch (error) {
      console.error(":( trackDistanceCalculation error");
      reject(console.log);
    }
  });
}
