"use client";

import React, { useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { scaleQuantile } from "d3-scale";
import { Tooltip } from "react-tooltip";

const INDIA_TOPO_JSON = "https://raw.githubusercontent.com/udit-001/india-maps-data/main/topojson/india.json";

interface IndiaMapProps {
    onRegionSelect: (regionName: string) => void;
}

const PROJECTION_CONFIG = {
    scale: 1100,
    center: [78.9629, 22.5937] as [number, number] // India's approximate center
};

const IndiaMap: React.FC<IndiaMapProps> = ({ onRegionSelect }) => {
    const [tooltipContent, setTooltipContent] = useState("");

    return (
        <div className="w-full h-full flex justify-center items-center bg-blue-50/50 dark:bg-gray-900/50 rounded-xl overflow-hidden border border-border">
            <ComposableMap
                projection="geoMercator"
                projectionConfig={PROJECTION_CONFIG}
                className="w-full h-full max-h-[600px]"
            >
                <ZoomableGroup zoom={1}>
                    <Geographies geography={INDIA_TOPO_JSON}>
                        {({ geographies }: { geographies: any[] }) =>
                            geographies.map((geo: any) => {
                                const current = geo.properties.NAME_1 || geo.properties.st_nm;
                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        onMouseEnter={() => {
                                            setTooltipContent(current);
                                        }}
                                        onMouseLeave={() => {
                                            setTooltipContent("");
                                        }}
                                        onClick={() => {
                                            if (current) onRegionSelect(current);
                                        }}
                                        style={{
                                            default: {
                                                fill: "#D6D6DA",
                                                stroke: "#FFFFFF",
                                                strokeWidth: 0.5,
                                                outline: "none",
                                                transition: "all 250ms"
                                            },
                                            hover: {
                                                fill: "#F53",
                                                stroke: "#FFFFFF",
                                                strokeWidth: 0.5,
                                                outline: "none",
                                                cursor: "pointer"
                                            },
                                            pressed: {
                                                fill: "#E42",
                                                stroke: "#FFFFFF",
                                                strokeWidth: 0.5,
                                                outline: "none"
                                            }
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>
            {tooltipContent && (
                <div className="absolute top-4 left-4 bg-black/80 text-white px-2 py-1 rounded text-sm pointer-events-none">
                    {tooltipContent}
                </div>
            )}
        </div>
    );
};

export default IndiaMap;
