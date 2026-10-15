import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface IndiaMapWebProps {
    onRegionSelect: (regionName: string) => void;
}

const HTML_CONTENT = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
  <style>
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body {
      margin: 0;
      background-color: transparent;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      width: 100vw;
      position: relative;
      touch-action: none;
    }
    svg {
      width: 100%;
      height: 100%;
      max-height: 100vh;
      touch-action: none;
    }
    path {
      fill: #2D2D3A;
      stroke: #181824;
      stroke-width: 0.6px;
      transition: fill 0.15s ease;
      cursor: pointer;
    }
    path:hover, path:active {
      fill: #8B5CF6;
    }
    path.selected {
      fill: #FF5533 !important;
      stroke: #FFFFFF !important;
      stroke-width: 1px !important;
    }
    .zoom-controls {
      position: absolute;
      right: 14px;
      bottom: 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      z-index: 100;
    }
    .zoom-btn {
      width: 40px;
      height: 40px;
      background: rgba(18, 18, 28, 0.88);
      border: 1px solid rgba(255, 255, 255, 0.22);
      color: #FFFFFF;
      font-size: 22px;
      font-weight: bold;
      border-radius: 12px;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
    }
    .zoom-btn:active {
      background: #8B5CF6;
    }
    .zoom-reset {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .zoom-hint {
      position: absolute;
      top: 10px;
      left: 14px;
      background: rgba(0, 0, 0, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 20px;
      padding: 4px 10px;
      color: rgba(255, 255, 255, 0.7);
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 11px;
      font-weight: 600;
      pointer-events: none;
    }
  </style>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <script src="https://unpkg.com/topojson@3"></script>
</head>
<body>
  <div class="zoom-hint">🔍 Pinch or tap +/− to zoom</div>

  <div class="zoom-controls">
    <button class="zoom-btn" onclick="zoomIn()">+</button>
    <button class="zoom-btn" onclick="zoomOut()">−</button>
    <button class="zoom-btn zoom-reset" onclick="zoomReset()">Reset</button>
  </div>

  <script>
    const MAP_URL = "https://vibemixer.hbhanot.tech/india-map.json";

    const svg = d3.select("body").append("svg")
      .attr("viewBox", [0, 0, 800, 700]);

    const g = svg.append("g");

    // D3 Zoom Behavior with Pinch and Drag
    const zoom = d3.zoom()
      .scaleExtent([1, 10])
      .on("zoom", function(event) {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    window.zoomIn = function() {
      svg.transition().duration(300).call(zoom.scaleBy, 1.5);
    };
    window.zoomOut = function() {
      svg.transition().duration(300).call(zoom.scaleBy, 0.67);
    };
    window.zoomReset = function() {
      svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity);
    };

    // Projection centered on India
    const projection = d3.geoMercator()
      .scale(1000)
      .center([78.9629, 22.5937])
      .translate([400, 350]);

    const path = d3.geoPath().projection(projection);

    d3.json(MAP_URL).then(topology => {
      const geographies = topojson.feature(topology, topology.objects.india || Object.values(topology.objects)[0]).features;

      g.selectAll("path")
        .data(geographies)
        .join("path")
        .attr("d", path)
        .on("click", function(event, d) {
          const region = d.properties.NAME_1 || d.properties.st_nm;
          
          d3.selectAll("path").classed("selected", false);
          d3.select(this).classed("selected", true);

          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(region);
          }
        });
    }).catch(err => {
      document.body.innerHTML = "<p style='color:white;padding:20px;'>Map loading... please check internet connection.</p>";
    });
  </script>
</body>
</html>
`;

export default function IndiaMapWeb({ onRegionSelect }: IndiaMapWebProps) {
    return (
        <View style={styles.container}>
            <WebView
                originWhitelist={['*']}
                source={{ html: HTML_CONTENT }}
                style={{ backgroundColor: 'transparent' }}
                onMessage={(event) => {
                    if (event.nativeEvent.data) {
                        onRegionSelect(event.nativeEvent.data);
                    }
                }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                scalesPageToFit={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 420,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#0D0D14',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
});
