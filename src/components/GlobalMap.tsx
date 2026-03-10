import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { NewsItem } from '../data/demoData';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Zap } from 'lucide-react';
import { InfoIcon } from './InfoIcon';

interface CountryCoord {
  [key: string]: [number, number];
}

const COUNTRY_COORDS: CountryCoord = {
  'China': [104.1954, 35.8617],
  'USA': [-95.7129, 37.0902],
  'EU': [10.4515, 51.1657],
  'Middle East': [45.0792, 23.8859],
  'Japan': [138.2529, 36.2048],
  'UK': [-3.4360, 55.3781],
  'Global': [-160, 25],
  'Russia': [105.3188, 61.5240],
  'India': [78.9629, 20.5937],
  'Brazil': [-51.9253, -14.2350],
  'Australia': [133.7751, -25.2744],
  'Emerging Markets': [20, 0],
  'Canada': [-106.3468, 56.1304],
  'Mexico': [-102.5528, 23.6345],
  'South Africa': [22.9375, -30.5595],
  'South Korea': [127.7669, 35.9078],
  'Singapore': [103.8198, 1.3521],
};

const WORLD_MAP_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const REGION_MAPPING: { [key: string]: string } = {
  'iran': 'Middle East',
  'saudi': 'Middle East',
  'uae': 'Middle East',
  'israel': 'Middle East',
  'qatar': 'Middle East',
  'egypt': 'Middle East',
  'lebanon': 'Middle East',
  'germany': 'EU',
  'france': 'EU',
  'italy': 'EU',
  'spain': 'EU',
  'netherlands': 'EU',
  'belgium': 'EU',
  'switzerland': 'EU',
  'poland': 'EU',
  'united states': 'USA',
  'america': 'USA',
  'us': 'USA',
  'united kingdom': 'UK',
  'britain': 'UK',
  'england': 'UK',
  'scotland': 'UK',
  'korea': 'South Korea',
  'russia': 'Russia',
  'moscow': 'Russia',
  'ukraine': 'Russia',
  'beijing': 'China',
  'shanghai': 'China',
  'hong kong': 'China',
  'tokyo': 'Japan',
  'london': 'UK',
  'new york': 'USA',
  'washington': 'USA',
};

function normalizeRegionName(name: string): string {
  const lower = name.toLowerCase().trim();
  if (COUNTRY_COORDS[name]) return name;
  
  // Check direct mappings
  for (const [key, val] of Object.entries(REGION_MAPPING)) {
    if (lower === key || lower.includes(key)) return val;
  }
  
  // Check if any COUNTRY_COORDS key is in the name
  for (const key of Object.keys(COUNTRY_COORDS)) {
    if (lower.includes(key.toLowerCase())) return key;
  }
  
  return name;
}

function getSourceRegion(item: NewsItem): string {
  const headline = item.headline.toLowerCase();
  const text = `${item.content} ${item.theme}`.toLowerCase();
  
  // 1. Check headline first for direct matches
  for (const region of Object.keys(COUNTRY_COORDS)) {
    if (headline.includes(region.toLowerCase())) return region;
  }
  
  // 2. Check headline for mappings
  for (const [country, region] of Object.entries(REGION_MAPPING)) {
    if (headline.includes(country)) return region;
  }

  // 3. Check impacts - use the first region that has coordinates
  if (item.impacts && item.impacts.length > 0) {
    for (const imp of item.impacts) {
      const normalized = normalizeRegionName(imp.region);
      if (COUNTRY_COORDS[normalized]) return normalized;
    }
  }

  // 4. Fallback to content/theme
  for (const region of Object.keys(COUNTRY_COORDS)) {
    if (text.includes(region.toLowerCase())) return region;
  }
  
  for (const [country, region] of Object.entries(REGION_MAPPING)) {
    if (text.includes(country)) return region;
  }
  
  return 'Global';
}

export function GlobalMap({ 
  news, 
  onSelect, 
  selectedNewsIds, 
  onFilterChange 
}: { 
  news: NewsItem[], 
  onSelect: (item: NewsItem) => void,
  selectedNewsIds: string[],
  onFilterChange: (ids: string[]) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const activeLocations = useMemo(() => {
    const locations = new Set<string>();
    news.forEach(item => {
      const region = getSourceRegion(item);
      if (COUNTRY_COORDS[region]) locations.add(region);
    });
    return Array.from(locations).sort();
  }, [news]);

  const locationHeat = useMemo(() => {
    const heatMap: { [key: string]: number } = {};
    news.forEach(item => {
      const region = getSourceRegion(item);
      const heat = item.scores?.heat || 0;
      heatMap[region] = Math.max(heatMap[region] || 0, heat);
    });
    return heatMap;
  }, [news]);

  const newsInLocation = useMemo(() => {
    if (!selectedLocation) return [];
    return news.filter(item => getSourceRegion(item) === selectedLocation);
  }, [news, selectedLocation]);

  const nodesToShow = useMemo(() => {
    // Show all active locations by default
    return activeLocations;
  }, [activeLocations]);

  const impacts = useMemo(() => {
    const combinedImpacts: { region: string, relation: 'positive' | 'negative', source: string, isCritical: boolean, newsId: string }[] = [];
    
    // Process news: either selected OR critical (disruption > 7)
    const newsToProcess = news.filter(n => 
      selectedNewsIds.includes(n.id) || (n.scores?.disruption || 0) > 7
    );

    newsToProcess.forEach(item => {
      const sourceRegion = getSourceRegion(item);
      const isCritical = (item.scores?.disruption || 0) > 7;

      item.impacts?.forEach(imp => {
        const normalizedRegion = normalizeRegionName(imp.region);
        if (COUNTRY_COORDS[normalizedRegion] && normalizedRegion !== sourceRegion) {
          combinedImpacts.push({ 
            ...imp, 
            region: normalizedRegion, 
            source: sourceRegion, 
            isCritical,
            newsId: item.id
          });
        }
      });
    });
    return combinedImpacts;
  }, [news, selectedNewsIds]);

  useEffect(() => {
    let isMounted = true;
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 400;

    const projection = d3.geoNaturalEarth1()
      .scale(width / 1.6 / Math.PI)
      .translate([width / 2, height / 1.8]);

    const path = d3.geoPath().projection(projection);

    const initMap = async () => {
      try {
        const [topojson, worldData] = await Promise.all([
          import('topojson-client'),
          d3.json(WORLD_MAP_URL)
        ]);

        if (!isMounted || !worldData) return;

        svg.selectAll("*").remove();

        // Background Glow
        const defs = svg.append("defs");
        const radialGradient = defs.append("radialGradient")
          .attr("id", "map-glow")
          .attr("cx", "50%")
          .attr("cy", "50%")
          .attr("r", "50%");
        
        radialGradient.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", "rgba(197, 48, 48, 0.03)");
        
        radialGradient.append("stop")
          .attr("offset", "100%")
          .attr("stop-color", "transparent");

        const heatGradient = defs.append("radialGradient")
          .attr("id", "heatGradient")
          .attr("cx", "50%")
          .attr("cy", "50%")
          .attr("r", "50%");
        
        heatGradient.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", "rgba(197, 48, 48, 0.4)");
        
        heatGradient.append("stop")
          .attr("offset", "100%")
          .attr("stop-color", "transparent");

        svg.append("rect")
          .attr("width", width)
          .attr("height", height)
          .attr("fill", "url(#map-glow)");

        const countries = topojson.feature(worldData as any, (worldData as any).objects.countries) as any;

        // Draw Map
        svg.append("g")
          .selectAll("path")
          .data(countries.features)
          .enter()
          .append("path")
          .attr("d", path)
          .attr("fill", "rgba(0, 0, 0, 0.03)")
          .attr("stroke", "rgba(0, 0, 0, 0.08)")
          .attr("stroke-width", 0.5);

        const arcsGroup = svg.append("g").attr("class", "arcs");
        const nodesGroup = svg.append("g").attr("class", "nodes");
        const labelsGroup = svg.append("g").attr("class", "labels");

        // Draw Arcs for impacts
        impacts.forEach((imp, i) => {
          const sourceCoords = COUNTRY_COORDS[imp.source];
          const targetCoords = COUNTRY_COORDS[imp.region];
          
          if (!sourceCoords || !targetCoords) return;

          const [x1, y1] = projection(sourceCoords) || [0, 0];
          const [x2, y2] = projection(targetCoords) || [0, 0];

          // Calculate a bend to prevent overlapping lines for mutual impacts
          // We use alphabetical order to ensure A->B and B->A bend in opposite directions
          // To ensure consistent direction, we always calculate the base vector from A to B where A < B
          const isReversed = imp.source > imp.region;
          const [ax, ay] = isReversed ? [x2, y2] : [x1, y1];
          const [bx, by] = isReversed ? [x1, y1] : [x2, y2];
          
          const dx = bx - ax;
          const dy = by - ay;
          const dr = Math.sqrt(dx * dx + dy * dy);
          
          // Midpoint
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          
          // Perpendicular vector for the bend (always relative to the sorted pair)
          const nx = -dy;
          const ny = dx;
          const nLength = Math.sqrt(nx * nx + ny * ny);
          
          // Use a fixed bend direction for each pair, but flip it based on which one is the source
          // This ensures A->B and B->A curve away from each other
          const side = isReversed ? -1 : 1;
          const bendFactor = 0.2; 
          
          const cx = mx + (nx / nLength) * (dr * bendFactor * side);
          const cy = my + (ny / nLength) * (dr * bendFactor * side);

          const dString = `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;

          const isSelectedArc = selectedNewsIds.includes(imp.newsId);

          const color = imp.relation === 'positive' ? '#0D9488' : '#E53E3E';
          const opacity = isSelectedArc ? 0.8 : 0.2;
          const strokeWidth = isSelectedArc ? 1.5 : 0.4;

          const arcPath = arcsGroup.append("path")
            .attr("d", dString)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", strokeWidth)
            .attr("stroke-dasharray", isSelectedArc ? "none" : "3,3")
            .style("opacity", opacity)
            .style("filter", isSelectedArc ? "drop-shadow(0 0 2px rgba(0,0,0,0.2))" : "none");

          const totalLength = (arcPath.node() as SVGPathElement).getTotalLength();
          
          // Flow Particle to show direction
          if (isSelectedArc) {
            const particle = arcsGroup.append("circle")
              .attr("r", 2.5)
              .attr("fill", color)
              .style("filter", "blur(1px)")
              .style("opacity", 0);

            const animateParticle = () => {
              particle
                .transition()
                .duration(2500)
                .ease(d3.easeLinear)
                .attrTween("transform", () => {
                  return (t) => {
                    const point = (arcPath.node() as SVGPathElement).getPointAtLength(t * totalLength);
                    return `translate(${point.x}, ${point.y})`;
                  };
                })
                .style("opacity", 1)
                .transition()
                .duration(200)
                .style("opacity", 0)
                .on("end", animateParticle);
            };
            animateParticle();
          }

          arcPath
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .delay(i * 100)
            .duration(1200)
            .ease(d3.easeCubicOut)
            .attr("stroke-dashoffset", 0);

          // Add arrowhead or direction indicator
          const [tx, ty] = projection(targetCoords) || [0, 0];
          arcsGroup.append("circle")
            .attr("cx", tx)
            .attr("cy", ty)
            .attr("r", isSelectedArc ? 4 : 2)
            .attr("fill", color)
            .style("opacity", 0)
            .transition()
            .delay(i * 100 + 1000)
            .duration(500)
            .style("opacity", isSelectedArc ? 0.8 : 0.4)
            .on("start", function repeat() {
              if (!isSelectedArc && !imp.isCritical) return;
              d3.select(this)
                .transition()
                .duration(1000)
                .attr("r", isSelectedArc ? 8 : 4)
                .style("opacity", 0)
                .transition()
                .duration(0)
                .attr("r", isSelectedArc ? 4 : 2)
                .style("opacity", isSelectedArc ? 0.8 : 0.4)
                .on("end", repeat);
            });
        });

        // Draw Nodes
        nodesToShow.forEach(loc => {
          const coords = COUNTRY_COORDS[loc];
          if (!coords) return;

          const regionNews = news.filter(n => getSourceRegion(n) === loc);
          const isSelected = selectedLocation === loc;
          
          // Only show nodes for places with news or if selected
          if (regionNews.length === 0 && !isSelected) return;

          const [x, y] = projection(coords) || [0, 0];
          const isSource = news.some(n => 
            selectedNewsIds.includes(n.id) && getSourceRegion(n) === loc
          );
          const isTarget = impacts.some(imp => 
            selectedNewsIds.includes(imp.newsId) && imp.region === loc
          );
          const isImpacted = impacts.some(imp => imp.region === loc);
          const impactType = impacts.find(imp => imp.region === loc)?.relation;

          const nodeContainer = nodesGroup.append("g")
            .attr("class", "cursor-pointer group")
            .on("click", (event) => {
              event.preventDefault();
              event.stopPropagation();
              if (regionNews.length === 1) {
                onSelect(regionNews[0]);
              } else {
                setSelectedLocation(prev => prev === loc ? null : loc);
              }
            });

          let nodeColor = "#1A1A1A"; // Default black ink
          if (isSelected) nodeColor = "#C53030"; // Red for selection
          else if (isSource) nodeColor = "#C53030"; // Red for source of active signal
          else if (isTarget) nodeColor = "#C53030"; // Red for target of active signal

          const isActive = isSelected || isSource || isTarget;
          const heat = locationHeat[loc] || 0;
          const isHot = heat > 7;

          // Heat Glow
          if (isHot) {
            nodeContainer.append("circle")
              .attr("cx", x)
              .attr("cy", y)
              .attr("r", 15 + heat)
              .attr("fill", "url(#heatGradient)")
              .style("opacity", 0.2)
              .attr("class", "animate-pulse");
          }

          // Outer ring
          nodeContainer.append("circle")
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", isActive ? 7 + (heat / 2) : 5 + (heat / 4))
            .attr("fill", "none")
            .attr("stroke", nodeColor)
            .attr("stroke-width", 1.5)
            .style("opacity", isActive ? 1 : 0.4);

          // Inner core
          const core = nodeContainer.append("circle")
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", isActive ? 3.5 : 2.5)
            .attr("fill", nodeColor)
            .style("opacity", isActive ? 1 : 0.4);

          if (isTarget) {
            core.transition()
              .duration(1000)
              .attr("r", 8)
              .style("opacity", 0)
              .on("start", function repeat() {
                d3.select(this)
                  .transition()
                  .duration(1000)
                  .attr("r", 8)
                  .style("opacity", 0)
                  .transition()
                  .duration(0)
                  .attr("r", 3)
                  .style("opacity", 1)
                  .on("end", repeat);
              });
          } else if (isSource) {
            core.transition()
              .duration(2000)
              .attr("r", 12)
              .style("opacity", 0)
              .on("start", function repeat() {
                d3.select(this)
                  .transition()
                  .duration(2000)
                  .attr("r", 12)
                  .style("opacity", 0)
                  .transition()
                  .duration(0)
                  .attr("r", 3)
                  .style("opacity", 1)
                  .on("end", repeat);
              });
          }

          // Label
          nodeContainer.append("text")
            .attr("x", x)
            .attr("y", y - 12)
            .attr("text-anchor", "middle")
            .attr("fill", nodeColor)
            .attr("font-family", "Playfair Display")
            .attr("font-size", "10px")
            .attr("font-weight", "bold")
            .attr("font-style", "italic")
            .style("opacity", isActive ? 1 : 0.5)
            .text(loc);

          // Tooltip on hover
          if (regionNews.length > 0) {
            nodeContainer.append("title")
              .text(`${loc}\n${regionNews.map(n => `• ${n.headline}`).join('\n')}`);
          }
        });

        svg.on("click", (event) => {
          if (event.target.tagName === 'svg') {
            setSelectedLocation(null);
          }
        });

      } catch (err) {
        console.error("Failed to load map data:", err);
      }
    };

    initMap();
    return () => { isMounted = false; };
  }, [nodesToShow, selectedLocation, impacts, selectedNewsIds, news, onSelect]);

  const toggleNewsFilter = (id: string) => {
    if (selectedNewsIds.includes(id)) {
      onFilterChange(selectedNewsIds.filter(sid => sid !== id));
    } else {
      onFilterChange([...selectedNewsIds, id]);
    }
  };

  return (
    <div className="bg-white/40 border border-ink/10 rounded-sm p-4 overflow-hidden relative min-h-[380px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] text-ink/40">Global Disruption Map</h3>
          <InfoIcon text="Select a region to view topics, then select topics to visualize global impact and filter the dashboard." />
        </div>
        {selectedNewsIds.length > 0 && (
          <button 
            onClick={() => onFilterChange([])}
            className="text-[9px] font-mono text-editor-red uppercase tracking-widest hover:text-editor-red/80 transition-colors font-bold"
          >
            Clear Filters
          </button>
        )}
      </div>
      
      <div className="relative aspect-[2/1] w-full">
        <svg 
          ref={svgRef} 
          viewBox="0 0 800 400" 
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        />

        <AnimatePresence>
          {selectedLocation && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute inset-0 bg-newsprint/95 backdrop-blur-sm p-4 flex flex-col border-l border-ink/10"
            >
              <div className="flex items-center justify-between mb-4 border-b border-ink/10 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-editor-red" />
                  <span className="text-xs font-serif font-bold italic tracking-widest text-editor-red">{selectedLocation} Topics</span>
                </div>
                <button 
                  onClick={() => setSelectedLocation(null)}
                  className="p-1 hover:bg-black/5 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-ink/40" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                {newsInLocation.length > 0 ? (
                  newsInLocation.map(item => {
                    const isSelected = selectedNewsIds.includes(item.id);
                    return (
                      <div key={item.id} className="flex gap-2 group">
                        <button 
                          onClick={() => onSelect(item)}
                          className={cn(
                            "flex-1 text-left p-3 rounded-sm bg-black/[0.02] border transition-all",
                            isSelected ? "border-editor-red/50 bg-editor-red/[0.03]" : "border-ink/5 hover:border-ink/20"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={cn(
                              "text-[12px] font-serif font-bold leading-tight transition-colors",
                              isSelected ? "text-editor-red" : "text-ink group-hover:text-editor-red"
                            )}>
                              {item.headline}
                            </h4>
                            <Zap className={cn("w-3 h-3 shrink-0 mt-0.5 transition-colors", isSelected ? "text-editor-red" : "text-ink/20 group-hover:text-editor-red")} />
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] font-mono text-ink/30 uppercase">{item.source}</span>
                              <span className="text-[9px] font-mono text-ink/30">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <span className="text-[8px] font-mono text-editor-red opacity-0 group-hover:opacity-100 uppercase tracking-tighter">Analyze Signal →</span>
                          </div>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleNewsFilter(item.id);
                          }}
                          className={cn(
                            "p-3 rounded-sm border transition-all flex items-center justify-center",
                            isSelected ? "bg-editor-red text-white border-editor-red" : "bg-black/[0.02] border-ink/5 text-ink/20 hover:border-ink/20 hover:text-ink/40"
                          )}
                          title={isSelected ? "Remove from Filter" : "Add to Map Filter"}
                        >
                          <div className="w-3 h-3 border-2 border-current rounded-full flex items-center justify-center">
                            {isSelected && <div className="w-1 h-1 bg-white rounded-full" />}
                          </div>
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex items-center justify-center text-[10px] font-mono text-ink/20 uppercase tracking-widest">
                    No active signals detected
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="col-span-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-2 border-b border-ink/5 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#1A1A1A]" />
            <span className="text-[9px] font-mono text-ink/40 uppercase">Source</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#C53030]" />
            <span className="text-[9px] font-mono text-ink/40 uppercase">Impacted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-editor-red animate-pulse" />
            <span className="text-[9px] font-mono text-ink/40 uppercase">Selected</span>
          </div>
          <div className="w-px h-3 bg-ink/10 mx-1" />
          <div className="flex items-center gap-2">
            <div className="w-3 h-[1px] bg-[#0D9488]" />
            <span className="text-[9px] font-mono text-ink/40 uppercase">Positive Correlation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-[1px] bg-[#E53E3E]" />
            <span className="text-[9px] font-mono text-ink/40 uppercase">Negative Correlation</span>
          </div>
        </div>
        {activeLocations.map(loc => (
          <button 
            key={loc} 
            onClick={() => setSelectedLocation(loc)}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-sm border transition-all text-left",
              selectedLocation === loc 
                ? "bg-editor-red/[0.05] border-editor-red/30" 
                : "bg-black/[0.02] border-ink/5 hover:border-ink/20"
            )}
          >
            <div className={cn(
              "w-1 h-1 rounded-full",
              selectedLocation === loc ? "bg-editor-red" : "bg-ink/40"
            )} />
            <span className={cn(
              "text-[10px] font-mono uppercase tracking-wider",
              selectedLocation === loc ? "text-editor-red font-bold" : "text-ink/60"
            )}>{loc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
