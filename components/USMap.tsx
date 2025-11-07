"use client";

import { useState, useEffect } from "react";

interface USMapProps {
  selectedState: string;
  onStateClick: (stateName: string) => void;
}

// State abbreviations mapped to full names
const STATE_MAP: { [key: string]: string } = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming"
};

export default function USMap({ selectedState, onStateClick }: USMapProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapDimensions, setMapDimensions] = useState<{ width: number; height: number } | null>(null);

  const handleStateClick = (stateAbbr: string) => {
    const stateName = STATE_MAP[stateAbbr];
    if (selectedState === stateName) {
      onStateClick(""); // Deselect if clicking same state
    } else {
      onStateClick(stateName);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGElement>) => {
    if (hoveredState) {
      setMousePosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseLeave = () => {
    setHoveredState(null);
    setMousePosition(null);
  };

  const getStateOpacity = (stateAbbr: string) => {
    const stateName = STATE_MAP[stateAbbr];
    if (selectedState === stateName) {
      return 0.3; // Highlight selected state
    }
    if (hoveredState === stateAbbr) {
      return 0.2; // Highlight hovered state
    }
    return 0; // Transparent for non-selected states
  };

  const handleStateMouseEnter = (stateAbbr: string, e: React.MouseEvent<SVGPathElement>) => {
    setHoveredState(stateAbbr);
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleStateMouseMove = (e: React.MouseEvent<SVGPathElement>) => {
    if (hoveredState) {
      setMousePosition({ x: e.clientX, y: e.clientY });
    }
  };

  // Load accurate paths from external file
  const [statePaths, setStatePaths] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Try to load accurate paths from a JSON file
    fetch('/state-paths.json')
      .then(res => res.json())
      .then(data => setStatePaths(data))
      .catch(() => {
        // If file doesn't exist, use fallback paths
        console.log('Using fallback paths. To use accurate paths, create /public/state-paths.json');
      });
  }, []);

  // Use accurate paths if available, otherwise use fallback
  const getStatePath = (stateAbbr: string): string => {
    if (statePaths[stateAbbr]) {
      return statePaths[stateAbbr];
    }
    // Fallback to approximate paths - these need to be replaced with accurate ones
    return getFallbackPath(stateAbbr);
  };

  const getFallbackPath = (stateAbbr: string): string => {
    // These are approximate - replace with accurate paths matching your vintage map
    const fallbackPaths: { [key: string]: string } = {
      AL: "M 500 400 L 550 380 L 560 420 L 510 440 Z",
      AK: "M 100 50 L 200 50 L 200 150 L 100 150 Z",
      AZ: "M 150 350 L 250 350 L 250 420 L 150 420 Z",
      AR: "M 400 350 L 450 350 L 450 400 L 400 400 Z",
      CA: "M 50 250 L 150 250 L 150 400 L 50 400 Z",
      CO: "M 250 300 L 300 300 L 300 350 L 250 350 Z",
      CT: "M 800 200 L 830 200 L 830 220 L 800 220 Z",
      DE: "M 800 250 L 820 250 L 820 270 L 800 270 Z",
      FL: "M 650 450 L 700 450 L 700 550 L 650 550 Z",
      GA: "M 600 400 L 650 400 L 650 450 L 600 450 Z",
      HI: "M 300 450 L 350 450 L 350 500 L 300 500 Z",
      ID: "M 150 200 L 250 200 L 250 280 L 150 280 Z",
      IL: "M 500 250 L 550 250 L 550 300 L 500 300 Z",
      IN: "M 550 250 L 600 250 L 600 300 L 550 300 Z",
      IA: "M 450 250 L 500 250 L 500 300 L 450 300 Z",
      KS: "M 400 300 L 450 300 L 450 350 L 400 350 Z",
      KY: "M 550 300 L 600 300 L 600 350 L 550 350 Z",
      LA: "M 450 400 L 500 400 L 500 450 L 450 450 Z",
      ME: "M 800 100 L 850 100 L 850 200 L 800 200 Z",
      MD: "M 770 250 L 800 250 L 800 270 L 770 270 Z",
      MA: "M 800 180 L 830 180 L 830 200 L 800 200 Z",
      MI: "M 550 150 L 600 150 L 600 250 L 550 250 Z",
      MN: "M 450 150 L 500 150 L 500 250 L 450 250 Z",
      MS: "M 500 400 L 550 400 L 550 450 L 500 450 Z",
      MO: "M 450 300 L 500 300 L 500 350 L 450 350 Z",
      MT: "M 250 150 L 350 150 L 350 250 L 250 250 Z",
      NE: "M 400 250 L 450 250 L 450 300 L 400 300 Z",
      NV: "M 150 280 L 250 280 L 250 350 L 150 350 Z",
      NH: "M 800 150 L 830 150 L 830 180 L 800 180 Z",
      NJ: "M 770 220 L 800 220 L 800 250 L 770 250 Z",
      NM: "M 280 350 L 350 350 L 350 400 L 280 400 Z",
      NY: "M 750 150 L 800 150 L 800 250 L 750 250 Z",
      NC: "M 700 300 L 750 300 L 750 350 L 700 350 Z",
      ND: "M 400 150 L 450 150 L 450 200 L 400 200 Z",
      OH: "M 600 250 L 650 250 L 650 300 L 600 300 Z",
      OK: "M 400 350 L 450 350 L 450 400 L 400 400 Z",
      OR: "M 50 200 L 150 200 L 150 250 L 50 250 Z",
      PA: "M 730 200 L 770 200 L 770 250 L 730 250 Z",
      RI: "M 800 200 L 810 200 L 810 210 L 800 210 Z",
      SC: "M 700 350 L 750 350 L 750 400 L 700 400 Z",
      SD: "M 400 200 L 450 200 L 450 250 L 400 250 Z",
      TN: "M 550 350 L 600 350 L 600 400 L 550 400 Z",
      TX: "M 350 350 L 450 350 L 450 450 L 350 450 Z",
      UT: "M 200 300 L 280 300 L 280 350 L 200 350 Z",
      VT: "M 770 150 L 800 150 L 800 180 L 770 180 Z",
      VA: "M 730 250 L 770 250 L 770 300 L 730 300 Z",
      WA: "M 50 100 L 150 100 L 150 200 L 50 200 Z",
      WV: "M 700 250 L 730 250 L 730 300 L 700 300 Z",
      WI: "M 500 200 L 550 200 L 550 250 L 500 250 Z",
      WY: "M 300 250 L 350 250 L 350 300 L 300 300 Z",
    };
    return fallbackPaths[stateAbbr] || "M 0 0 L 0 0 Z";
  };

  return (
    <div className="w-full max-w-5xl mx-auto mb-8">
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-blue-200">
        <h2 className="text-xl font-semibold mb-4 text-center text-gray-800 drop-shadow-sm">
          🗺️ Click a State to Filter Politicians
        </h2>
        <div className="relative flex justify-center">
          {/* Vintage Map Image */}
          <img
            src="/map of the us.png"
            alt="United States Map"
            className="w-full h-auto max-w-4xl"
            style={{ maxHeight: "600px" }}
            onLoad={(e) => {
              const img = e.currentTarget;
              setMapDimensions({ width: img.offsetWidth, height: img.offsetHeight });
              setMapLoaded(true);
            }}
          />
          
          {/* Tooltip */}
          {hoveredState && mousePosition && (
            <div
              className="fixed z-50 bg-gray-900 text-white text-sm font-semibold px-3 py-1.5 rounded shadow-lg pointer-events-none"
              style={{
                left: `${mousePosition.x + 10}px`,
                top: `${mousePosition.y - 30}px`,
              }}
            >
              {STATE_MAP[hoveredState]}
            </div>
          )}
          
          {/* Interactive Overlay SVG */}
          {mapLoaded && (
            <svg
              className="absolute inset-0 w-full h-full cursor-pointer"
              viewBox="0 0 1000 600"
              preserveAspectRatio="xMidYMid meet"
              style={{ pointerEvents: "all" }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {Object.keys(STATE_MAP).map((stateAbbr) => (
                <path
                  key={stateAbbr}
                  d={getStatePath(stateAbbr)}
                  fill="rgba(59, 130, 246, 0)"
                  stroke="transparent"
                  strokeWidth="2"
                  className="transition-all"
                  style={{ 
                    fill: `rgba(59, 130, 246, ${getStateOpacity(stateAbbr)})`,
                    pointerEvents: "all"
                  }}
                  onMouseEnter={(e) => handleStateMouseEnter(stateAbbr, e)}
                  onMouseMove={handleStateMouseMove}
                  onClick={() => handleStateClick(stateAbbr)}
                />
              ))}
            </svg>
          )}
        </div>
        {selectedState && (
          <div className="mt-4 text-center">
            <button
              onClick={() => onStateClick("")}
              className="text-sm text-blue-600 hover:text-blue-800 underline font-medium"
            >
              Clear selection: {selectedState}
            </button>
          </div>
        )}
        <div className="mt-4 text-xs text-gray-500 text-center">
          💡 Tip: To improve accuracy, trace your vintage map in a vector editor and add the paths to /public/state-paths.json
        </div>
      </div>
    </div>
  );
}
