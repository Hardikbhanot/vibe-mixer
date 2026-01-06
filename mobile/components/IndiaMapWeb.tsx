
import React, { useRef } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

interface IndiaMapWebProps {
    onRegionSelect: (regionName: string) => void;
}

// We rely on CDNs for D3 and TopoJSON to keep the bundle small.
// In a production offline app, these should be bundled.
const HTML_CONTENT = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    body { margin: 0; background-color: transparent; overflow: hidden; display: flex; justify-content: center; align-items: center; height: 100vh; }
    svg { width: 100%; height: 100%; max-height: 600px; }
    path { fill: #D6D6DA; stroke: #FFFFFF; stroke-width: 0.5px; transition: fill 0.2s; cursor: pointer; }
    path:active, path.active { fill: #FF5533 !important; }
    .tooltip {
      position: absolute; pointer-events: none; background: rgba(0,0,0,0.8); color: white;
      padding: 5px 10px; border-radius: 4px; font-family: sans-serif; font-size: 14px;
      display: none; top: 0; left: 0; transform: translate(-50%, -150%);
      z-index: 10;
    }
  </style>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <script src="https://unpkg.com/topojson@3"></script>
</head>
<body>
  <div id="tooltip" class="tooltip"></div>
  <script>
    // URL to the same map file used by the web client
    const MAP_URL = "https://vibemixer.hbhanot.tech/india-map.json";

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Create SVG
    const svg = d3.select("body").append("svg")
      .attr("viewBox", [0, 0, 800, 700]);

    const tooltip = d3.select("#tooltip");

    // Projection centered on India
    const projection = d3.geoMercator()
      .scale(1000)
      .center([78.9629, 22.5937])
      .translate([400, 350]);

    const path = d3.geoPath().projection(projection);

    // Load Data
    d3.json(MAP_URL).then(topology => {
      const geographies = topojson.feature(topology, topology.objects.india || Object.values(topology.objects)[0]).features;

      svg.append("g")
        .selectAll("path")
        .data(geographies)
        .join("path")
        .attr("d", path)
        .on("click", function(event, d) {
          const region = d.properties.NAME_1 || d.properties.st_nm;
          
          // Visual Feedback
          d3.selectAll("path").style("fill", "#D6D6DA");
          d3.select(this).style("fill", "#FF5533");

          // Send to RN
          if(window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(region);
          }
        });
        
        // Simple "Fit to bounds" roughly
        // (Optional: can be refined)
    }).catch(err => {
      document.body.innerHTML = "<p style='color:white'>Error loading map: " + err.message + "</p>";
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
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 400, // Fixed height for map area
        borderRadius: 16,
        overflow: 'hidden',
    },
});
