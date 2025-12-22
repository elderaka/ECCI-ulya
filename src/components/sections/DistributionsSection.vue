<template>
  <section id="distributions" class="section-container bg-white py-32 scroll-snap-align-start">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="section-title">{{ t('sectionB.title') }}</h2>
        <h3 class="section-subtitle">{{ t('sectionB.subtitle') }}</h3>
        <p class="story-text mt-6">{{ t('sectionB.intro') }}</p>
      </div>
      
      <div class="chart-container relative">
        <svg ref="chartRef" class="w-full" :height="chartHeight"></svg>
        
        <!-- Scrollytelling Steps -->
        <div class="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div
            v-for="(step, index) in steps"
            :key="index"
            :ref="el => stepRefs[index] = el as HTMLElement"
            class="scroll-text-overlay transition-opacity duration-500"
            :class="{ 'opacity-0': currentStep !== index, 'opacity-100': currentStep === index }"
          >
            <div class="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-8 max-w-xl mx-auto pointer-events-auto">
              <h4 class="text-2xl font-bold mb-4 text-gray-900">{{ t(`sectionB.${step}.title`) }}</h4>
              <p class="text-lg text-gray-700">{{ t(`sectionB.${step}.text`) }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Legend -->
      <div class="flex justify-center gap-8 mt-8">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded-full bg-air-quality"></div>
          <span class="text-sm font-medium">{{ t('sectionB.legend.airQuality') }}</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded-full bg-physical-activity"></div>
          <span class="text-sm font-medium">{{ t('sectionB.legend.physicalActivity') }}</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded-full bg-congestion"></div>
          <span class="text-sm font-medium">{{ t('sectionB.legend.congestion') }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import * as d3 from 'd3'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { loadCSVData } from '../../utils/dataLoader'

gsap.registerPlugin(ScrollTrigger)

const { t } = useI18n()
const chartRef = ref<SVGSVGElement | null>(null)
const chartHeight = 600
const currentStep = ref(0)
const stepRefs = ref<HTMLElement[]>([])
const steps = ['step1', 'step2', 'step3']

onMounted(async () => {
  if (!chartRef.value) return
  
  const svg = d3.select(chartRef.value)
  const margin = { top: 40, right: 60, bottom: 60, left: 80 }
  const width = chartRef.value.clientWidth - margin.left - margin.right
  const height = chartHeight - margin.top - margin.bottom
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)
  
  // Load real CSV data (46,426 UK areas)
  const allData = await loadCSVData()
  
  // Sort by air quality to create distribution curves
  const sortedByAir = [...allData].sort((a, b) => a.air_quality_million_gbp - b.air_quality_million_gbp)
  
  // Sample every Nth point for smoother visualization (use ~500 points)
  const sampleInterval = Math.floor(allData.length / 500)
  const sampledData = sortedByAir.filter((_, i) => i % sampleInterval === 0)
  
  // Scales
  const xScale = d3.scaleLinear()
    .domain([0, sampledData.length - 1])
    .range([0, width])
  
  const maxValue = Math.max(
    d3.max(sampledData, d => d.air_quality_million_gbp) || 0,
    d3.max(sampledData, d => d.physical_activity_million_gbp) || 0,
    Math.abs(d3.min(sampledData, d => d.congestion_million_gbp) || 0)
  )
  
  const yScale = d3.scaleLinear()
    .domain([0, maxValue])
    .range([height, 0])
  
  // Axes
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale).ticks(10))
    .append('text')
    .attr('x', width / 2)
    .attr('y', 45)
    .attr('fill', 'black')
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .text(t('sectionB.xAxis'))
  
  g.append('g')
    .call(d3.axisLeft(yScale).ticks(10))
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -60)
    .attr('fill', 'black')
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .text(t('sectionB.yAxis'))
  
  // Line generators
  const lineGenerator = d3.line<number>()
    .x((d, i) => xScale(i))
    .y(d => yScale(d))
    .curve(d3.curveMonotoneX)
  
  // Area generators
  const areaGenerator = d3.area<number>()
    .x((d, i) => xScale(i))
    .y0(height)
    .y1(d => yScale(d))
    .curve(d3.curveMonotoneX)
  
  // Draw areas with animation using real data
  const series = [
    { data: sampledData.map(d => d.air_quality_million_gbp), color: '#2E86AB', name: 'airQuality' },
    { data: sampledData.map(d => d.physical_activity_million_gbp), color: '#06A77D', name: 'physicalActivity' },
    { data: sampledData.map(d => Math.abs(d.congestion_million_gbp)), color: '#F18F01', name: 'congestion' }
  ]
  
  // Add background zones
  const zoneWidth = width / 3
  g.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', zoneWidth)
    .attr('height', height)
    .attr('fill', '#ffcccb')
    .attr('opacity', 0.1)
  
  g.append('rect')
    .attr('x', zoneWidth)
    .attr('y', 0)
    .attr('width', zoneWidth)
    .attr('height', height)
    .attr('fill', '#ffffe0')
    .attr('opacity', 0.1)
  
  g.append('rect')
    .attr('x', zoneWidth * 2)
    .attr('y', 0)
    .attr('width', zoneWidth)
    .attr('height', height)
    .attr('fill', '#90ee90')
    .attr('opacity', 0.1)
  
  series.forEach(({ data: seriesData, color, name }) => {
    const path = g.append('path')
      .datum(seriesData)
      .attr('fill', color)
      .attr('fill-opacity', 0.2)
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .attr('d', areaGenerator)
    
    const totalLength = path.node()?.getTotalLength() || 0
    
    path
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(2000)
      .ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0)
  })
  
  // Setup ScrollTrigger
  ScrollTrigger.create({
    trigger: chartRef.value,
    start: 'top center',
    end: 'bottom center',
    scrub: true,
    onUpdate: (self) => {
      const progress = self.progress
      if (progress < 0.33) {
        currentStep.value = 0
      } else if (progress < 0.66) {
        currentStep.value = 1
      } else {
        currentStep.value = 2
      }
    }
  })
})

onUnmounted(() => {
  ScrollTrigger.getAll().forEach(trigger => trigger.kill())
})
</script>
