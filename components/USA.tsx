"use client";

import React from "react";
import USAMap from "react-usa-map";

interface USAProps {
  onHover?: (state: string | null) => void;
  onStateClick?: (stateName: string) => void;
  selectedState?: string;
}

// Map state abbreviations to full names
const STATE_ABBR_TO_FULL: { [key: string]: string } = {
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

export default function USA({ onHover, onStateClick, selectedState }: USAProps) {
  const handleHover = (event: any) => {
    const stateAbbr = event.target?.getAttribute("name");
    const stateName = stateAbbr ? STATE_ABBR_TO_FULL[stateAbbr] || stateAbbr : null;
    if (onHover) {
      onHover(stateName);
    }
  };

  const handleOut = () => {
    if (onHover) {
      onHover(null);
    }
  };

  const mapHandler = (event: any) => {
    // react-usa-map passes a React synthetic event
    // The state abbreviation is in the 'name' attribute of the clicked path element
    let stateAbbr: string | null = null;
    
    // Try to get from event.target (the actual clicked element)
    if (event?.target) {
      const target = event.target;
      
      // Check if target has name attribute directly
      stateAbbr = target.getAttribute?.("name") || target.getAttribute?.("data-name");
      
      // If not found, traverse up the DOM tree to find the path element with name attribute
      if (!stateAbbr) {
        let element: any = target;
        let depth = 0;
        while (element && depth < 10) {
          // Check if this element is a path with a name attribute
          if (element.tagName === 'path' || element.tagName === 'PATH') {
            stateAbbr = element.getAttribute?.("name");
            if (stateAbbr) break;
          }
          
          // Also check for name attribute on any element
          if (!stateAbbr) {
            stateAbbr = element.getAttribute?.("name");
            if (stateAbbr) break;
          }
          
          element = element.parentElement || element.parentNode;
          depth++;
        }
      }
      
      // Last resort: use closest() if available
      if (!stateAbbr && target.closest) {
        const pathWithName = target.closest('path[name]') || target.closest('[name]');
        if (pathWithName) {
          stateAbbr = pathWithName.getAttribute("name");
        }
      }
    }
    
    // Also try currentTarget
    if (!stateAbbr && event?.currentTarget) {
      stateAbbr = event.currentTarget.getAttribute?.("name");
    }
    
    if (!stateAbbr) {
      console.error("❌ Could not extract state abbreviation from event");
      return;
    }
    
    // Convert to uppercase and get full state name
    const upperAbbr = stateAbbr.toUpperCase();
    const stateName = STATE_ABBR_TO_FULL[upperAbbr];
    
    if (!stateName) {
      console.warn("⚠️ Unknown state abbreviation:", upperAbbr);
      return;
    }
    
    // Call the callback with the full state name
    if (onStateClick) {
      onStateClick(stateName);
    }
  };

  // Customize map colors based on selected state
  const customize: { [key: string]: { fill: string } } = {};
  
  if (selectedState) {
    // Find the state abbreviation for the selected state
    const stateAbbr = Object.keys(STATE_ABBR_TO_FULL).find(
      (abbr) => STATE_ABBR_TO_FULL[abbr] === selectedState
    );
    if (stateAbbr) {
      customize[stateAbbr] = {
        fill: "#3b82f6", // Blue for selected state
      };
    }
  }

  return (
    <div className="rounded-lg shadow-lg border bg-white/95 backdrop-blur-sm p-4 w-full relative">
      <div className="usa-map-container relative">
        <USAMap
          onClick={mapHandler}
          onMouseMove={handleHover}
          onMouseOut={handleOut}
          customize={customize}
          title="Click a state to filter representatives"
        />
      </div>
      {selectedState && (
        <div className="mt-2 text-center text-sm text-blue-600">
          Selected: <strong>{selectedState}</strong>
        </div>
      )}
    </div>
  );
}
