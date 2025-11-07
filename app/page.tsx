"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Load USA component client-side only to avoid SSR issues with react-usa-map
const USA = dynamic(() => import("../components/USA"), { ssr: false });

// All US states organized by initial letter
const STATES_BY_INITIAL: { [key: string]: string[] } = {
  A: ["Alabama", "Alaska", "Arizona", "Arkansas"],
  C: ["California", "Colorado", "Connecticut"],
  D: ["Delaware"],
  F: ["Florida"],
  G: ["Georgia"],
  H: ["Hawaii"],
  I: ["Idaho", "Illinois", "Indiana", "Iowa"],
  K: ["Kansas", "Kentucky"],
  L: ["Louisiana"],
  M: ["Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana"],
  N: ["Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota"],
  O: ["Ohio", "Oklahoma", "Oregon"],
  P: ["Pennsylvania"],
  R: ["Rhode Island"],
  S: ["South Carolina", "South Dakota"],
  T: ["Tennessee", "Texas"],
  U: ["Utah"],
  V: ["Vermont", "Virginia"],
  W: ["Washington", "West Virginia", "Wisconsin", "Wyoming"],
};

const ALL_STATES = Object.values(STATES_BY_INITIAL).flat().sort();

// Major US cities organized by initial letter
const CITIES_BY_INITIAL: { [key: string]: string[] } = {
  A: ["Atlanta", "Austin"],
  B: ["Boston"],
  C: ["Chattanooga", "Chicago", "Cincinnati", "Cleveland"],
  D: ["Dallas", "Denver"],
  H: ["Houston"],
  L: ["Los Angeles"],
  N: ["New Orleans", "New York City"],
  P: ["Philadelphia", "Phoenix", "Portland"],
  S: ["Sacramento", "San Antonio", "San Diego", "San Jose", "Seattle", "St. Louis"],
};

export default function Home() {
  const [level, setLevel] = useState("all");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [party, setParty] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [wiki, setWiki] = useState<any | null>(null);
  const [wikiLoading, setWikiLoading] = useState(false);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [photoCache, setPhotoCache] = useState<{ [key: string]: string }>({});
  
  // Track fetching state to avoid duplicate requests
  const fetchingPhotos = useRef<Set<string>>(new Set());

  // Fetch photo for representative if missing
  const fetchPhotoForRep = async (name: string) => {
    // Don't fetch if already in cache or currently fetching
    if (photoCache[name] || fetchingPhotos.current.has(name)) return;
    
    // Mark as fetching
    fetchingPhotos.current.add(name);
    
    try {
      // Find the representative to get their office for better search
      const rep = data.find((p: any) => p.name === name);
      const office = rep?.office || '';
      
      // Try variations of the name to find Wikipedia page
      const searchVariations = [
        name, // Try exact name first
        `${name} (politician)`,
        `${name} (American politician)`,
        `${name} (${office})`,
      ];
      
      let foundImage = null;
      
      for (const variation of searchVariations) {
        try {
          const res = await fetch(`/api/wiki?title=${encodeURIComponent(variation)}`);
          if (!res.ok) continue;
          
          const data = await res.json();
          if (data.image) {
            foundImage = data.image;
            break; // Found a photo, stop searching
          }
        } catch (e) {
          // Continue to next variation
          continue;
        }
      }
      
      if (foundImage) {
        setPhotoCache(prev => ({ ...prev, [name]: foundImage }));
      }
    } catch (e) {
      // Silently fail - will show initials instead
    } finally {
      fetchingPhotos.current.delete(name);
    }
  };

  useEffect(() => {
    fetch("/politicians.json")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        // Start fetching photos for all representatives without photos
        // Use a more aggressive approach with batching
        const repsWithoutPhotos = d.filter((rep: any) => !rep.photoUrl);
        repsWithoutPhotos.forEach((rep: any, index: number) => {
          // Stagger requests to avoid overwhelming the API
          // But start fetching immediately for visible ones
          setTimeout(() => {
            fetchPhotoForRep(rep.name);
          }, index * 200); // 200ms delay to be respectful to Wikipedia API
        });
      });
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showStateDropdown && !target.closest('.state-dropdown-container')) {
        setShowStateDropdown(false);
      }
      if (showCityDropdown && !target.closest('.city-dropdown-container')) {
        setShowCityDropdown(false);
      }
    };

    if (showStateDropdown || showCityDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStateDropdown, showCityDropdown]);

  // Get unique parties from data
  const uniqueParties = Array.from(new Set(data.map((p) => p.party))).filter(Boolean).sort();

  const filtered = data.filter((p) => {
    const levelMatch = level === "all" || p.level === level;
    
    // For state matching, handle "All" state (federal officials) and exact/partial matches
    let stateMatch = true;
    if (state.trim() !== "") {
      const searchState = state.toLowerCase();
      const dataState = (p.state || "").toLowerCase();
      
      // If searching for a specific state, exclude "All" entries unless they match
      if (p.state === "All") {
        stateMatch = false; // Federal officials with state="All" won't match state filters
      } else {
        stateMatch = dataState === searchState || dataState.includes(searchState) || searchState.includes(dataState);
      }
    }
    
    const cityMatch =
      city.trim() === "" ||
      (p.city && p.city.toLowerCase().includes(city.toLowerCase()));
    const partyMatch = party === "all" || p.party === party;
    const searchMatch =
      searchQuery.trim() === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.office.toLowerCase().includes(searchQuery.toLowerCase());
    
    return levelMatch && stateMatch && cityMatch && partyMatch && searchMatch;
  });

  // Pre-fetch photos when filtered results change (more aggressive)
  useEffect(() => {
    filtered.forEach((rep, index) => {
      if (!rep.photoUrl && !photoCache[rep.name] && !fetchingPhotos.current.has(rep.name)) {
        // Fetch photo for visible representatives automatically with slight delay
        setTimeout(() => {
          fetchPhotoForRep(rep.name);
        }, index * 50); // Small delay to avoid rate limiting
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

  const handleStateClick = (stateName: string) => {
    console.log("State clicked in page.tsx:", stateName); // Debug log
    if (!stateName) {
      console.warn("No state name provided to handleStateClick");
      return;
    }
    setState(stateName);
    setShowStateDropdown(false); // Close dropdown if open
    // Scroll to results after state selection
    setTimeout(() => {
      const resultsElement = document.querySelector('[data-results-section]');
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleStateHover = (stateName: string | null) => {
    setHoveredState(stateName);
  };

  const fetchWiki = async (name: string) => {
    setWikiLoading(true);
    setWiki(null);
    try {
      const res = await fetch(`/api/wiki?title=${encodeURIComponent(name)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setWiki(data);
      
      // If we got a photo from Wikipedia and the representative doesn't have one, cache it
      if (data.image) {
        const rep = filtered.find(p => p.name === name);
        if (rep && !rep.photoUrl) {
          setPhotoCache(prev => ({ ...prev, [name]: data.image }));
        }
      }
    } catch (e) {
      setWiki({ error: "No Wikipedia data found." });
    } finally {
      setWikiLoading(false);
    }
  };

  return (
    <main 
      className="min-h-screen flex flex-col items-center p-8 relative"
      style={{
        backgroundImage: "url('/background picture.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundRepeat: "no-repeat"
      }}
    >
      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center">
        <h1 className="text-4xl font-bold text-blue-700 mb-6 drop-shadow-lg">
          Know Your Reps
        </h1>

        {/* Search Bar */}
        <div className="w-full max-w-3xl mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Search by name or office..."
              className="w-full border-2 border-blue-300 rounded-lg p-3 pl-10 text-lg bg-white/95 backdrop-blur-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6 justify-center">
          <select
            className="border-2 border-blue-300 rounded-lg p-2 bg-white/95 backdrop-blur-sm focus:outline-none focus:border-blue-500 shadow-lg"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            <option value="all">All Levels</option>
            <option value="federal">Federal</option>
            <option value="state">State</option>
            <option value="local">Local</option>
          </select>

          <select
            className="border-2 border-blue-300 rounded-lg p-2 bg-white/95 backdrop-blur-sm focus:outline-none focus:border-blue-500 shadow-lg"
            value={party}
            onChange={(e) => setParty(e.target.value)}
          >
            <option value="all">All Parties</option>
            {uniqueParties.map((partyName) => (
              <option key={partyName} value={partyName}>
                {partyName}
              </option>
            ))}
          </select>

          <div className="relative state-dropdown-container">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search by state"
                className="border-2 border-blue-300 rounded-lg p-2 bg-white/95 backdrop-blur-sm focus:outline-none focus:border-blue-500 shadow-lg"
                value={state}
                onChange={(e) => setState(e.target.value)}
                onFocus={() => setShowStateDropdown(true)}
              />
              <button
                onClick={() => setShowStateDropdown(!showStateDropdown)}
                className="border-2 border-blue-300 rounded-lg p-2 bg-white/95 backdrop-blur-sm hover:bg-blue-50 focus:outline-none focus:border-blue-500 shadow-lg px-4"
                title="Toggle state list"
              >
                📋
              </button>
            </div>
            
            {showStateDropdown && (
              <div className="absolute top-full left-0 mt-2 w-64 max-h-96 overflow-y-auto bg-white rounded-lg shadow-xl border-2 border-blue-300 z-50 state-dropdown-container">
                <div className="p-2 sticky top-0 bg-blue-100 border-b border-blue-300">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-blue-700">Select State</span>
                    <button
                      onClick={() => setShowStateDropdown(false)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="p-2">
                  {Object.keys(STATES_BY_INITIAL).sort().map((letter) => (
                    <div key={letter} className="mb-2">
                      <div className="font-bold text-gray-700 text-sm mb-1 px-2 py-1 bg-gray-100">
                        {letter}
                      </div>
                      <div className="flex flex-col">
                        {STATES_BY_INITIAL[letter].map((stateName) => (
                          <button
                            key={stateName}
                            onClick={() => {
                              setState(stateName);
                              setShowStateDropdown(false);
                            }}
                            className={`text-left px-4 py-2 text-sm hover:bg-blue-50 rounded ${
                              state === stateName ? "bg-blue-100 font-semibold" : ""
                            }`}
                          >
                            {stateName}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setState("");
                      setShowStateDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded mt-2 border-t border-gray-200"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative city-dropdown-container">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search by city"
                className="border-2 border-blue-300 rounded-lg p-2 bg-white/95 backdrop-blur-sm focus:outline-none focus:border-blue-500 shadow-lg"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onFocus={() => setShowCityDropdown(true)}
              />
              <button
                onClick={() => setShowCityDropdown(!showCityDropdown)}
                className="border-2 border-blue-300 rounded-lg p-2 bg-white/95 backdrop-blur-sm hover:bg-blue-50 focus:outline-none focus:border-blue-500 shadow-lg px-4"
                title="Toggle city list"
              >
                🏙️
              </button>
            </div>
            
            {showCityDropdown && (
              <div className="absolute top-full left-0 mt-2 w-64 max-h-96 overflow-y-auto bg-white rounded-lg shadow-xl border-2 border-blue-300 z-50 city-dropdown-container">
                <div className="p-2 sticky top-0 bg-blue-100 border-b border-blue-300">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-blue-700">Select City</span>
                    <button
                      onClick={() => setShowCityDropdown(false)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="p-2">
                  {Object.keys(CITIES_BY_INITIAL).sort().map((letter) => (
                    <div key={letter} className="mb-2">
                      <div className="font-bold text-gray-700 text-sm mb-1 px-2 py-1 bg-gray-100">
                        {letter}
                      </div>
                      <div className="flex flex-col">
                        {CITIES_BY_INITIAL[letter].map((cityName) => (
                          <button
                            key={cityName}
                            onClick={() => {
                              setCity(cityName);
                              setShowCityDropdown(false);
                            }}
                            className={`text-left px-4 py-2 text-sm hover:bg-blue-50 rounded ${
                              city === cityName ? "bg-blue-100 font-semibold" : ""
                            }`}
                          >
                            {cityName}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setCity("");
                      setShowCityDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded mt-2 border-t border-gray-200"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* US Map */}
        <div className="w-full max-w-5xl mx-auto mb-8">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-blue-200">
            <h2 className="text-xl font-semibold mb-4 text-center text-gray-800 drop-shadow-sm">
              🗺️ Click a State to Filter Politicians
            </h2>
            <USA 
              onHover={handleStateHover}
              onStateClick={handleStateClick}
              selectedState={state}
            />
            {hoveredState && (
              <div className="mt-4 text-center">
                <div className="inline-block px-4 py-2 bg-blue-100 border border-blue-300 rounded-lg shadow-md">
                  <p className="text-blue-700 font-semibold text-lg">
                    {hoveredState}
                  </p>
                </div>
              </div>
            )}
            {state && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setState("")}
                  className="text-sm text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  Clear selection: {state}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="w-full max-w-3xl" data-results-section>
          {state && (
            <div className="mb-4 p-3 bg-blue-100 border-2 border-blue-400 rounded-lg text-center shadow-md">
              <p className="text-blue-700 font-semibold text-lg">
                📍 Showing representatives for: <strong className="text-blue-900">{state}</strong>
              </p>
              <button
                onClick={() => {
                  setState("");
                  setWiki(null);
                }}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear state filter
              </button>
            </div>
          )}
          {filtered.length > 0 ? (
            <>
              <p className="text-gray-700 mb-4 text-center font-semibold drop-shadow-sm">
                Showing {filtered.length} {filtered.length === 1 ? "representative" : "representatives"}
                {state && ` in ${state}`}
              </p>
              <div className="grid gap-4">
                {filtered.map((p, i) => (
                  <div
                    key={i}
                    className="p-4 bg-white/95 backdrop-blur-sm border rounded-lg shadow-lg flex items-center justify-between gap-4 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {(() => {
                        const photoUrl = p.photoUrl || photoCache[p.name];
                        const isFetching = fetchingPhotos.current.has(p.name);
                        
                        // Show photo if available, otherwise show loading or initials
                        if (photoUrl) {
                          return (
                            <img
                              src={photoUrl}
                              alt={p.name}
                              className="w-20 h-20 object-cover rounded-full border-2 border-blue-200"
                              onError={(e) => {
                                // If image fails to load, hide it and show initials
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent && !parent.querySelector('.initials-fallback')) {
                                  const fallback = document.createElement('div');
                                  fallback.className = 'w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold border-2 border-blue-200 initials-fallback';
                                  fallback.textContent = p.name.split(" ").map((n: string) => n[0]).join("");
                                  parent.appendChild(fallback);
                                }
                              }}
                            />
                          );
                        } else {
                          // Always try to fetch photo if not already fetching
                          if (!isFetching && !photoCache[p.name]) {
                            // Trigger fetch immediately for visible representatives
                            fetchPhotoForRep(p.name);
                          }
                          return (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold border-2 border-blue-200 relative">
                              {p.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                              {isFetching && (
                                <div className="absolute inset-0 rounded-full bg-black bg-opacity-20 flex items-center justify-center">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              )}
                            </div>
                          );
                        }
                      })()}
                      <div>
                        <h2 className="text-xl font-semibold">{p.name}</h2>
                        <p className="text-gray-700">{p.office}</p>
                        <p className="text-sm text-gray-500">
                          {p.party} — {p.city ? `${p.city}, ${p.state}` : p.state}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => fetchWiki(p.name)}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-md whitespace-nowrap"
                    >
                      View Wiki
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-white/95 backdrop-blur-sm rounded-lg border shadow-lg">
              <p className="text-gray-500 text-lg">
                No representatives found matching your filters.
              </p>
            </div>
          )}
        </div>

        {/* Wikipedia Panel */}
        {wikiLoading && (
          <div className="w-full max-w-3xl mt-6 text-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg border shadow-lg p-6">
              <p className="text-gray-600 text-sm">Loading Wikipedia data…</p>
            </div>
          </div>
        )}

        {wiki && !wiki.error && (
          <div className="w-full max-w-3xl mt-6">
            <div className="p-4 bg-white/95 backdrop-blur-sm border rounded-lg shadow-lg flex gap-4">
              {wiki.image && (
                <img
                  src={wiki.image}
                  alt={wiki.title}
                  className="w-24 h-24 rounded-lg object-cover border-2 border-blue-200 flex-shrink-0"
                />
              )}
              <div className="flex-1">
                <div className="font-semibold text-lg mb-2 text-blue-700">{wiki.title}</div>
                <p className="text-sm text-gray-700 line-clamp-5 mb-3">
                  {wiki.summary}
                </p>
                <a
                  href={wiki.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  Open full article on Wikipedia →
                </a>
              </div>
            </div>
          </div>
        )}

        {wiki && wiki.error && (
          <div className="w-full max-w-3xl mt-6">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg border shadow-lg p-4">
              <p className="text-xs text-red-500 text-center">{wiki.error}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

