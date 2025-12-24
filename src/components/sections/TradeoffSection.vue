<template>
  <section id="tradeoff" class="section-container bg-white py-32 scroll-snap-align-start">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="section-title">{{ t('sectionD.title') }}</h2>
        <h3 class="section-subtitle">{{ t('sectionD.subtitle') }}</h3>
        <p class="story-text mt-6">{{ t('sectionD.intro') }}</p>
      </div>
      
      <div class="chart-container">
        <svg ref="chartRef" class="w-full" :height="chartHeight"></svg>
      </div>
      
      <!-- Legend -->
      <div class="flex justify-center gap-8 mt-8">
        <div class="flex items-center gap-2">
          <div class="w-6 h-4 bg-air-quality rounded"></div>
          <span class="text-sm font-medium">{{ t('sectionD.legend.netBenefit') }}</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-6 h-1 bg-congestion rounded"></div>
          <span class="text-sm font-medium">{{ t('sectionD.legend.hassleCosts') }}</span>
        </div>
      </div>
      
      <div class="text-center mt-12">
        <p class="text-xl font-semibold text-gray-900 bg-white/60 backdrop-blur-sm border-2 border-gray-200 rounded-2xl p-6 shadow-2xl max-w-3xl mx-auto">
          {{ t('sectionD.insight') }}
        </p>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-5xl mx-auto">
          <div class="bg-white/60 backdrop-blur-sm border-2 border-red-300 rounded-2xl p-6 shadow-2xl">
            <h4 class="font-bold text-red-700 mb-2">{{ t('sectionD.breakdown.d1to3').split(':')[0] }}</h4>
            <p class="text-sm text-gray-700">{{ t('sectionD.breakdown.d1to3').split(':')[1] }}</p>
          </div>
          <div class="bg-white/60 backdrop-blur-sm border-2 border-yellow-300 rounded-2xl p-6 shadow-2xl">
            <h4 class="font-bold text-yellow-700 mb-2">{{ t('sectionD.breakdown.d4to7').split(':')[0] }}</h4>
            <p class="text-sm text-gray-700">{{ t('sectionD.breakdown.d4to7').split(':')[1] }}</p>
          </div>
          <div class="bg-white/60 backdrop-blur-sm border-2 border-green-300 rounded-2xl p-6 shadow-2xl">
            <h4 class="font-bold text-green-700 mb-2">{{ t('sectionD.breakdown.d8to10').split(':')[0] }}</h4>
            <p class="text-sm text-gray-700">{{ t('sectionD.breakdown.d8to10').split(':')[1] }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import * as d3 from 'd3'
import { loadCSVData, getDeciles } from '../../utils/dataLoader'

const { t } = useI18n()
const chartRef = ref<SVGSVGElement | null>(null)
const chartHeight = 600

onMounted(async () => {
  if (!chartRef.value) return
  
  const svg = d3.select(chartRef.value)
  const margin = { top: 40, right: 100, bottom: 80, left: 100 }
  const width = chartRef.value.clientWidth - margin.left - margin.right
  const height = chartHeight - margin.top - margin.bottom
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)
  
  // Load real CSV data and calculate real deciles from 46,426 areas
  const allData = await loadCSVData()
  const deciles = getDeciles(allData)
  
  console.log(`📊 Real deciles from ${allData.length} areas:`, deciles)
  
  // Scales
  const xScale = d3.scaleBand()
    .domain(deciles.map((d: any) => d.label))
    .range([0, width])
    .padding(0.3)
  
  const yScaleLeft = d3.scaleLinear()
    .domain([d3.min(deciles, (d: any) => d.netBenefit) as number * 1.1, d3.max(deciles, (d: any) => d.netBenefit) as number * 1.1])
    .range([height, 0])
  
  const yScaleRight = d3.scaleLinear()
    .domain([d3.min(deciles, (d: any) => d.hassleCosts) as number * 1.2, 0])
    .range([height, 0])
  
  // Left Y-axis (Net Benefit)
  g.append('g')
    .call(d3.axisLeft(yScaleLeft).ticks(10))
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -70)
    .attr('fill', '#06A77D')
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .style('font-weight', 'bold')
    .text(t('sectionD.yAxisPrimary'))
  
  // Right Y-axis (Hassle Costs)
  g.append('g')
    .attr('transform', `translate(${width},0)`)
    .call(d3.axisRight(yScaleRight).ticks(10))
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', 70)
    .attr('fill', '#F18F01')
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .style('font-weight', 'bold')
    .text(t('sectionD.yAxisSecondary'))
  
  // X-axis
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .append('text')
    .attr('x', width / 2)
    .attr('y', 50)
    .attr('fill', 'black')
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .text(t('sectionD.xAxis'))
  
  // Draw bars for Net Benefit
  g.selectAll('.bar-benefit')
    .data(deciles)
    .enter()
    .append('rect')
    .attr('class', 'bar-benefit')
    .attr('x', (d: any) => xScale(d.label) as number)
    .attr('y', height)
    .attr('width', xScale.bandwidth())
    .attr('height', 0)
    .attr('fill', '#06A77D')
    .attr('opacity', 0.8)
    .on('mouseover', function(event: any, d: any) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('opacity', 1)
      
      showTooltip(event, `Net Benefit: £${d.netBenefit.toFixed(1)}M`)
    })
    .on('mouseout', function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('opacity', 0.8)
      
      hideTooltip()
    })
    .transition()
    .duration(1000)
    .delay((d: any, i: number) => i * 100)
    .attr('y', (d: any) => yScaleLeft(d.netBenefit))
    .attr('height', (d: any) => height - yScaleLeft(d.netBenefit))
  
  // Line generator for Hassle Costs
  const lineGenerator = d3.line<any>()
    .x((d: any) => (xScale(d.label) as number) + xScale.bandwidth() / 2)
    .y((d: any) => yScaleRight(d.hassleCosts))
    .curve(d3.curveMonotoneX)
  
  // Draw line for Hassle Costs
  const path = g.append('path')
    .datum(deciles)
    .attr('fill', 'none')
    .attr('stroke', '#F18F01')
    .attr('stroke-width', 3)
    .attr('d', lineGenerator)
  
  const totalLength = path.node()?.getTotalLength() || 0
  
  path
    .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
    .attr('stroke-dashoffset', totalLength)
    .transition()
    .duration(2000)
    .delay(1000)
    .ease(d3.easeLinear)
    .attr('stroke-dashoffset', 0)
  
  // Draw circles on the line
  g.selectAll('.circle-hassle')
    .data(deciles)
    .enter()
    .append('circle')
    .attr('class', 'circle-hassle')
    .attr('cx', (d: any) => (xScale(d.label) as number) + xScale.bandwidth() / 2)
    .attr('cy', (d: any) => yScaleRight(d.hassleCosts))
    .attr('r', 0)
    .attr('fill', '#F18F01')
    .attr('stroke', 'white')
    .attr('stroke-width', 2)
    .on('mouseover', function(event: any, d: any) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('r', 7)
      
      showTooltip(event, `Hassle Costs: £${d.hassleCosts.toFixed(1)}M`)
    })
    .on('mouseout', function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('r', 5)
      
      hideTooltip()
    })
    .transition()
    .duration(500)
    .delay((d: any, i: number) => 1000 + i * 100)
    .attr('r', 5)
  
  // Tooltip
  const tooltip = d3.select('body').append('div')
    .attr('class', 'absolute bg-white p-3 rounded-lg shadow-xl border border-gray-200 pointer-events-none opacity-0 transition-opacity text-sm')
    .style('z-index', '1000')
  
  function showTooltip(event: MouseEvent, text: string) {
    tooltip
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 10) + 'px')
      .html(text)
      .style('opacity', '1')
  }
  
  function hideTooltip() {
    tooltip.style('opacity', '0')
  }
  
  // Add zero reference line
  g.append('line')
    .attr('x1', 0)
    .attr('y1', yScaleRight(0))
    .attr('x2', width)
    .attr('y2', yScaleRight(0))
    .attr('stroke', '#999')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '3,3')
    .attr('opacity', 0.5)
})
</script>
