<template>
  <section id="correlation" class="section-container bg-gradient-to-br from-background to-white py-32 scroll-snap-align-start">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="section-title">{{ t('sectionC.title') }}</h2>
        <h3 class="section-subtitle">{{ t('sectionC.subtitle') }}</h3>
        <p class="story-text mt-6">{{ t('sectionC.intro') }}</p>
      </div>
      
      <div class="chart-container">
        <svg ref="chartRef" class="w-full" :height="chartHeight"></svg>
      </div>
      
      <div class="text-center mt-12">
        <p class="themed-glass text-xl font-semibold text-gray-900 rounded-2xl p-6 max-w-3xl mx-auto">
          {{ t('sectionC.insight') }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import * as d3 from 'd3'
import { loadCSVData, getOutliers, sampleData } from '../../utils/dataLoader'

const { t } = useI18n()
const chartRef = ref<SVGSVGElement | null>(null)
const chartHeight = 600

onMounted(async () => {
  if (!chartRef.value) return
  
  const svg = d3.select(chartRef.value)
  const margin = { top: 40, right: 60, bottom: 80, left: 100 }
  const width = chartRef.value.clientWidth - margin.left - margin.right
  const height = chartHeight - margin.top - margin.bottom
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)
  
  // Load real CSV data (46,426 UK small areas)
  const allData = await loadCSVData()
  const { highestAir, highestActivity } = getOutliers(allData)
  
  // Sample 1000 points for performance, but keep outliers
  const sampleSize = 1000
  const samplePoints = sampleData(allData, sampleSize, [highestAir, highestActivity])
  
  // Prepare data points
  const chartData = samplePoints.map(d => ({
    id: d.small_area,
    airQuality: d.air_quality_million_gbp,
    physicalActivity: d.physical_activity_million_gbp,
    netBenefit: d.net_benefit_million_gbp
  }))
  
  // Separate outliers for special rendering
  const outliers = [
    { 
      id: highestAir.small_area, 
      localAuthority: highestAir.local_authority,
      airQuality: highestAir.air_quality_million_gbp, 
      physicalActivity: highestAir.physical_activity_million_gbp, 
      netBenefit: highestAir.net_benefit_million_gbp, 
      label: 'Highest Air Quality', 
      color: '#FFD700' 
    },
    { 
      id: highestActivity.small_area, 
      localAuthority: highestActivity.local_authority,
      airQuality: highestActivity.air_quality_million_gbp, 
      physicalActivity: highestActivity.physical_activity_million_gbp, 
      netBenefit: highestActivity.net_benefit_million_gbp, 
      label: 'Highest Physical Activity', 
      color: '#32CD32' 
    }
  ]
  
  const allPoints = chartData
  
  // Calculate R² using all 46,426 real data points
  const xMean = allData.reduce((sum, d) => sum + d.air_quality_million_gbp, 0) / allData.length
  const yMean = allData.reduce((sum, d) => sum + d.physical_activity_million_gbp, 0) / allData.length
  
  let numerator = 0
  let denominator = 0
  allData.forEach(d => {
    numerator += (d.air_quality_million_gbp - xMean) * (d.physical_activity_million_gbp - yMean)
    denominator += Math.pow(d.air_quality_million_gbp - xMean, 2)
  })
  
  const slope = numerator / denominator
  const intercept = yMean - slope * xMean
  
  // Calculate actual R² from all 46,426 areas
  let ssRes = 0
  let ssTot = 0
  allData.forEach(d => {
    const predicted = slope * d.air_quality_million_gbp + intercept
    ssRes += Math.pow(d.physical_activity_million_gbp - predicted, 2)
    ssTot += Math.pow(d.physical_activity_million_gbp - yMean, 2)
  })
  const rSquared = 1 - (ssRes / ssTot)
  
  console.log(`📊 Real R² from ${allData.length} areas: ${rSquared.toFixed(4)}`)
  
  // Cap y-axis at 99th percentile to prevent extreme outlier from compressing the view
  const physicalActivityValues = allData.map(d => d.physical_activity_million_gbp).sort((a, b) => a - b)
  const percentile99 = physicalActivityValues[Math.floor(physicalActivityValues.length * 0.99)]
  
  console.log(`📊 Y-axis capped at 99th percentile: ${percentile99.toFixed(2)}M (max: ${highestActivity.physical_activity_million_gbp.toFixed(2)}M)`)
  
  // Filter out very small values to reduce origin clustering
  const filteredData = chartData.filter(d => d.airQuality >= 0.1 && d.physicalActivity >= 0.1)
  const displayData = [...filteredData]
  
  console.log(`📊 Displaying ${displayData.length} points (filtered ${chartData.length - filteredData.length} near-zero values)`)
  
  // Linear scales with filtered data
  const xScale = d3.scaleLinear()
    .domain([0, d3.max(displayData, d => d.airQuality) as number * 1.1])
    .range([0, width])
  
  const yScale = d3.scaleLinear()
    .domain([0, percentile99 * 1.1])
    .range([height, 0])
  
  // Color scale for net benefit (RdYlGn like IPYNB matplotlib colormap)
  const colorScale = d3.scaleSequential(d3.interpolateRdYlGn)
    .domain([d3.min(displayData, d => d.netBenefit) as number, d3.max(displayData, d => d.netBenefit) as number])
  
  // Axes
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale).ticks(10))
    .append('text')
    .attr('x', width / 2)
    .attr('y', 50)
    .attr('fill', 'black')
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .text(t('sectionC.xAxis'))
  
  g.append('g')
    .call(d3.axisLeft(yScale).ticks(10))
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -70)
    .attr('fill', 'black')
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .text(t('sectionC.yAxis'))
  
  // Trend line data
  const trendLineData = [
    { x: 0, y: intercept },
    { x: d3.max(allPoints, d => d.airQuality) as number, y: slope * (d3.max(allPoints, d => d.airQuality) as number) + intercept }
  ]
  
  // Draw trend line
  g.append('line')
    .attr('x1', xScale(trendLineData[0].x))
    .attr('y1', yScale(trendLineData[0].y))
    .attr('x2', xScale(trendLineData[1].x))
    .attr('y2', yScale(trendLineData[1].y))
    .attr('stroke', 'red')
    .attr('stroke-width', 2.5)
    .attr('stroke-dasharray', '5,5')
    .attr('opacity', 0)
    .transition()
    .duration(1000)
    .attr('opacity', 0.7)
  
  // Add trend line label with R²
  g.append('text')
    .attr('x', xScale(trendLineData[1].x) - 180)
    .attr('y', yScale(trendLineData[1].y) - 10)
    .attr('fill', 'red')
    .style('font-size', '12px')
    .style('font-style', 'italic')
    .text(`Trend Line (R² = ${rSquared.toFixed(3)})`)
    .attr('opacity', 0)
    .transition()
    .delay(1000)
    .duration(500)
    .attr('opacity', 1)
  
  // Tooltip for hover interactions
  const tooltip = d3.select('body').append('div')
    .attr('class', 'absolute bg-white p-4 rounded-lg shadow-xl border border-gray-200 pointer-events-none opacity-0 transition-opacity')
    .style('z-index', '1000')
  
  // Draw scatter points (regular sample data, filtered)
  g.selectAll('.dot')
    .data(displayData.filter(d => d.id !== highestAir.small_area && d.id !== highestActivity.small_area))
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('cx', d => xScale(d.airQuality))
    .attr('cy', d => yScale(d.physicalActivity))
    .attr('r', 0)
    .attr('fill', d => colorScale(d.netBenefit))
    .attr('opacity', 0.5)
    .attr('stroke', 'black')
    .attr('stroke-width', 0.2)
    .on('mouseover', function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('r', 8)
        .attr('opacity', 1)
      
      tooltip
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
        .html(`
          <div class="text-sm">
            <div><strong>Air Quality:</strong> £${d.airQuality.toFixed(2)}M</div>
            <div><strong>Physical Activity:</strong> £${d.physicalActivity.toFixed(2)}M</div>
            <div><strong>Net Benefit:</strong> £${d.netBenefit.toFixed(2)}M</div>
          </div>
        `)
        .style('opacity', '1')
    })
    .on('mouseout', function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('r', 5)
        .attr('opacity', 0.6)
      
      tooltip.style('opacity', '0')
    })
    .transition()
    .duration(1000)
    .delay((d, i) => Math.min(i * 2, 1000)) // Stagger animation
    .attr('r', 5)
  
  // Draw outlier points with special highlighting
  outliers.forEach((outlier, idx) => {
    const isOffScale = outlier.physicalActivity > percentile99 * 1.1
    
    // Position: if off-scale, place at top with indicator
    const yPos = isOffScale ? 10 : yScale(outlier.physicalActivity)
    
    // Larger circle for outlier
    const circle = g.append('circle')
      .attr('cx', xScale(outlier.airQuality))
      .attr('cy', isOffScale ? 10 : yScale(outlier.physicalActivity))
      .attr('r', 0)
      .attr('fill', outlier.color)
      .attr('stroke', '#000')
      .attr('stroke-width', 2)
      .attr('opacity', 0.9)
      .transition()
      .delay(2000 + idx * 500)
      .duration(500)
      .attr('r', 10)
    
    // Add upward arrow for off-scale points
    if (isOffScale) {
      g.append('text')
        .attr('x', xScale(outlier.airQuality))
        .attr('y', 25)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('fill', outlier.color)
        .text('↑')
        .attr('opacity', 0)
        .transition()
        .delay(2500 + idx * 500)
        .duration(500)
        .attr('opacity', 1)
    }
    
    // Annotation with background box
    const xOffset = idx === 0 ? 15 : 15
    const yOffset = isOffScale ? 35 : (idx === 0 ? -25 : 20)
    
    const annotation = g.append('g')
      .attr('opacity', 0)
    
    // Text label
    const text = annotation.append('text')
      .attr('x', xScale(outlier.airQuality) + xOffset)
      .attr('y', yPos + yOffset)
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .style('fill', '#000')
    
    text.append('tspan')
      .attr('x', xScale(outlier.airQuality) + xOffset)
      .text(outlier.label)
    
    text.append('tspan')
      .attr('x', xScale(outlier.airQuality) + xOffset)
      .attr('dy', '1.2em')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .text(`${outlier.localAuthority}`)
    
    text.append('tspan')
      .attr('x', xScale(outlier.airQuality) + xOffset)
      .attr('dy', '1.2em')
      .style('font-size', '9px')
      .style('font-weight', 'normal')
      .text(`(${outlier.id})`)
    
    // Show actual value if off-scale
    if (isOffScale) {
      text.append('tspan')
        .attr('x', xScale(outlier.airQuality) + xOffset)
        .attr('dy', '1.2em')
        .style('font-size', '9px')
        .style('font-weight', 'normal')
        .style('fill', '#e74c3c')
        .text(`Value: £${(outlier.physicalActivity / 1000).toFixed(1)}B`)
    }
    
    // Arrow line pointing to outlier
    annotation.append('line')
      .attr('x1', xScale(outlier.airQuality))
      .attr('y1', yPos)
      .attr('x2', xScale(outlier.airQuality) + xOffset - 5)
      .attr('y2', yPos + yOffset - (isOffScale ? 25 : (idx === 0 ? 10 : -15)))
      .attr('stroke', '#000')
      .attr('stroke-width', 2)
      .attr('marker-start', 'url(#arrowhead)')
    
    // Fade in annotation
    annotation
      .transition()
      .delay(2500 + idx * 500)
      .duration(500)
      .attr('opacity', 1)
  })
  
  // Define arrowhead marker
  svg.append('defs').append('marker')
    .attr('id', 'arrowhead')
    .attr('markerWidth', 10)
    .attr('markerHeight', 10)
    .attr('refX', 0)
    .attr('refY', 3)
    .attr('orient', 'auto')
    .append('polygon')
    .attr('points', '0 0, 10 3, 0 6')
    .attr('fill', '#000')
})
</script>
