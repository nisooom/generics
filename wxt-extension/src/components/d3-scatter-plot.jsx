import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const D3ScatterPlot = ({ reviews }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    // Set dimensions and margins
    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(reviews, (d) => d.score))
      .range([0, width])
      .nice();

    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(reviews, (d) => d.sentiment))
      .range([height, 0])
      .nice();

    // Color scale for ratings
    const colorScale = d3
      .scaleOrdinal()
      .domain(["1", "2", "3", "4", "5"])
      .range(["#ef4444", "#f97316", "#eab308", "#22c55e", "#059669"]);

    // Size scale based on helpfulness (ldr ratio)
    const sizeScale = d3
      .scaleLinear()
      .domain(
        d3.extent(reviews, (d) => {
          const helpful = parseInt(d.ldr[0]);
          const total = parseInt(d.ldr[1]);
          return total > 0 ? helpful / total : 0;
        }),
      )
      .range([4, 12]);

    // Add grid lines
    const xAxis = d3.axisBottom(xScale).tickSize(-height).tickFormat("");
    const yAxis = d3.axisLeft(yScale).tickSize(-width).tickFormat("");

    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .selectAll("line")
      .attr("stroke", "#f3f4f6")
      .attr("stroke-width", 1);

    g.append("g")
      .attr("class", "grid")
      .call(yAxis)
      .selectAll("line")
      .attr("stroke", "#f3f4f6")
      .attr("stroke-width", 1);

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", "#374151");

    g.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", "#374151");

    // Add axis labels
    g.append("text")
      .attr("transform", `translate(${width / 2}, ${height + 40})`)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .style("fill", "#374151")
      .text("Authenticity Score (0=Fake, 1=Genuine)");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .style("fill", "#374151")
      .text("Sentiment Score");

    // Create tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "d3-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("z-index", "1000");

    // Add circles for each review
    const circles = g
      .selectAll(".dot")
      .data(reviews)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("r", (d) => {
        const helpful = parseInt(d.ldr[0]);
        const total = parseInt(d.ldr[1]);
        return sizeScale(total > 0 ? helpful / total : 0);
      })
      .attr("cx", (d) => xScale(d.score))
      .attr("cy", (d) => yScale(d.sentiment))
      .style("fill", (d) => colorScale(d.rating))
      .style("opacity", (d) => Math.max(0.4, d.score)) // Opacity based on authenticity
      .style("stroke", "#fff")
      .style("stroke-width", 1)
      .style("cursor", "pointer");

    // Add hover interactions
    circles
      .on("mouseover", function (event, d) {
        d3.select(this)
          .transition()
          .duration(100)
          .attr("r", (d) => {
            const helpful = parseInt(d.ldr[0]);
            const total = parseInt(d.ldr[1]);
            return sizeScale(total > 0 ? helpful / total : 0) + 3;
          })
          .style("stroke-width", 2);

        const helpfulRatio = parseInt(d.ldr[0]) / parseInt(d.ldr[1]);

        tooltip.style("visibility", "visible").html(`
            <div><strong>${d.user}</strong></div>
            <div>Rating: ${d.rating} stars</div>
            <div>Authenticity: ${(d.score * 100).toFixed(1)}%</div>
            <div>Sentiment: ${(d.sentiment * 100).toFixed(1)}%</div>
            <div>Helpful: ${d.ldr[0]}/${d.ldr[1]} (${(helpfulRatio * 100).toFixed(1)}%)</div>
            <div>Date: ${d.time}</div>
            <div style="max-width: 200px; margin-top: 4px;">
              "${d.review.substring(0, 100)}${d.review.length > 100 ? "..." : ""}"
            </div>
          `);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("top", event.pageY - 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseout", function (event, d) {
        d3.select(this)
          .transition()
          .duration(100)
          .attr("r", (d) => {
            const helpful = parseInt(d.ldr[0]);
            const total = parseInt(d.ldr[1]);
            return sizeScale(total > 0 ? helpful / total : 0);
          })
          .style("stroke-width", 1);

        tooltip.style("visibility", "hidden");
      });

    // Add animation entrance
    circles
      .attr("r", 0)
      .transition()
      .duration(800)
      .delay((d, i) => i * 50)
      .attr("r", (d) => {
        const helpful = parseInt(d.ldr[0]);
        const total = parseInt(d.ldr[1]);
        return sizeScale(total > 0 ? helpful / total : 0);
      });

    // Cleanup function
    return () => {
      tooltip.remove();
    };
  }, [reviews]);

  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-md bg-gray-50">
        <p className="text-gray-500">No review data available</p>
      </div>
    );
  }

  return (
    <div
      className="border-muted w-full rounded-lg border bg-white shadow-sm"
      style={{ padding: "1rem", marginBottom: "2rem" }}
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Review Authenticity Analysis
        </h3>
        <p className="text-sm text-gray-600">
          Interactive scatter plot showing review patterns
        </p>
      </div>

      <svg ref={svgRef} className="w-full"></svg>

      {/* Legend */}
      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="font-medium text-gray-700">Star Ratings:</span>
          {["1", "2", "3", "4", "5"].map((rating) => (
            <div key={rating} className="flex items-center gap-1">
              <div
                className="h-3 w-3 rounded-full border border-white"
                style={{
                  backgroundColor: [
                    "#ef4444",
                    "#f97316",
                    "#eab308",
                    "#22c55e",
                    "#059669",
                  ][parseInt(rating) - 1],
                }}
              />
              <span>{rating}★</span>
            </div>
          ))}
        </div>

        <div className="space-y-1 text-xs text-gray-600">
          <p>
            • <strong>Circle size:</strong> Helpfulness ratio (larger = more
            helpful votes)
          </p>
          <p>
            • <strong>Opacity:</strong> Authenticity score (darker = more
            genuine)
          </p>
          <p>
            • <strong>X-axis:</strong> Review authenticity (0=fake, 1=genuine)
          </p>
          <p>
            • <strong>Y-axis:</strong> Sentiment polarity (lower=negative,
            higher=positive)
          </p>
          <p>
            • <strong>Hover:</strong> View detailed review information
          </p>
        </div>
      </div>
    </div>
  );
};

export default D3ScatterPlot;
