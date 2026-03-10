import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { CausalNode, CausalLink } from '../services/aiProvider';
import { GitBranch, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export function DominoGraph({ graph }: { graph?: { nodes: CausalNode[], links: CausalLink[] } }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!graph || !svgRef.current || graph.nodes.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = 400;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Deep clone to avoid modifying original data and ensure D3 works with fresh objects
    const nodes = graph.nodes.map(d => ({ ...d }));
    const links = graph.links.map(d => ({ ...d }));

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links as any).id((d: any) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(70));

    // Arrow marker
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 35) // Adjusted for node width
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("xoverflow", "visible")
      .append("svg:path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", "rgba(0,0,0,0.2)")
      .style("stroke", "none");

    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", "rgba(0,0,0,0.1)")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrowhead)");

    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .enter().append("g")
      .style("cursor", "grab")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    node.append("rect")
      .attr("width", 140)
      .attr("height", 44)
      .attr("x", -70)
      .attr("y", -22)
      .attr("rx", 4)
      .attr("fill", d => {
        if (d.type === 'event') return '#FFFFFF';
        if (d.type === 'asset') return '#F0F4F8';
        return '#FFF5F5';
      })
      .attr("stroke", d => {
        if (d.type === 'event') return '#1A1A1A';
        if (d.type === 'asset') return '#2A4365';
        return '#C53030';
      })
      .attr("stroke-width", 1.5)
      .attr("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.05))");

    node.append("text")
      .attr("dy", 4)
      .attr("text-anchor", "middle")
      .attr("fill", "#1A1A1A")
      .attr("font-size", "10px")
      .attr("font-family", "Inter, sans-serif")
      .attr("font-weight", "600")
      .text(d => d.label.length > 25 ? d.label.substring(0, 22) + "..." : d.label);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

  }, [graph]);

  if (!graph) return null;

  return (
    <div className="bg-white/40 border border-ink/10 rounded-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-ink/10 flex items-center justify-between bg-black/[0.02]">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-editor-red" />
          <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] text-ink/60">Domino Causal Graph</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-[9px] font-mono uppercase tracking-widest text-ink/40 font-bold">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm bg-newsprint border border-ink" /> Event
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm bg-ink-blue/10 border border-ink-blue" /> Asset
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm bg-editor-red/10 border border-editor-red" /> Risk
            </div>
          </div>
        </div>
      </div>

      <div className="relative h-[400px] bg-white/20">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </div>
  );
}
