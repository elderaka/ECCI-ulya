<template>
  <section id="heatmap" class="section-container bg-white py-32 scroll-snap-align-start">
    <div class="max-w-7xl mx-auto px-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <!-- Left: Text Content -->
        <div>
          <h2 class="section-title">{{ t('sectionHeatmap.title') }}</h2>
          <h3 class="section-subtitle">{{ t('sectionHeatmap.subtitle') }}</h3>
          <p class="story-text mt-6">{{ t('sectionHeatmap.intro') }}</p>
          
          <!-- Area Details Card -->
          <div v-if="selectedArea" class="mt-8 bg-gradient-to-br from-air-quality/10 to-physical-activity/10 rounded-2xl p-6 border-2 border-physical-activity/30">
            <h4 class="text-xl font-bold text-gray-900 mb-3">{{ selectedArea.name }}</h4>
            <div class="space-y-2">
              <p class="text-sm text-gray-700"><span class="font-semibold">Population:</span> {{ selectedArea.population?.toLocaleString() || 'N/A' }}</p>
              <p v-if="mapType === 'localAuthority' && selectedArea.nation" class="text-sm text-gray-700"><span class="font-semibold">Nation:</span> {{ selectedArea.nation }}</p>
              <div class="mt-3 pt-3 border-t border-gray-300">
                <div class="flex justify-between items-center mb-1">
                  <span class="text-xs text-gray-600">Air Quality:</span>
                  <span class="text-air-quality font-bold text-sm">£{{ selectedArea.airQuality?.toFixed(2) }}M</span>
                </div>
                <div class="flex justify-between items-center mb-1">
                  <span class="text-xs text-gray-600">Physical Activity:</span>
                  <span class="text-physical-activity font-bold text-sm">£{{ selectedArea.physicalActivity?.toFixed(2) }}M</span>
                </div>
                <div class="flex justify-between items-center mb-2">
                  <span class="text-xs text-gray-600">Congestion:</span>
                  <span class="text-congestion font-bold text-sm">£{{ selectedArea.congestion?.toFixed(2) }}M</span>
                </div>
                <div class="flex justify-between items-center pt-2 border-t-2 border-gray-400">
                  <span class="text-gray-900 font-bold text-sm">Net Benefit:</span>
                  <span class="text-xl font-bold" :class="(selectedArea.netBenefit ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'">
                    £{{ selectedArea.netBenefit?.toFixed(2) }}M
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Right: Map -->
        <div class="relative">
          <!-- Loading Screen -->
          <Transition name="fade">
            <div
              v-if="isLoading"
              class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm rounded-2xl z-20 flex flex-col items-center justify-center"
            >
              <div class="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-air-quality mb-6"></div>
              <p class="text-white text-2xl font-bold mb-2">Loading Data...</p>
              <p class="text-white/80 text-lg">Funs await!</p>
            </div>
          </Transition>
          
          <!-- Map Type Toggle -->
          <div class="absolute top-6 left-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-3 z-10">
            <div class="flex gap-2">
              <button
                @click="switchMapType('nation')"
                :class="[
                  'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                  mapType === 'nation' 
                    ? 'bg-air-quality text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                ]"
              >
                Nations
              </button>
              <button
                @click="switchMapType('localAuthority')"
                :class="[
                  'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                  mapType === 'localAuthority' 
                    ? 'bg-air-quality text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                ]"
              >
                Local Authorities
              </button>
            </div>
          </div>
          
          <div ref="mapContainer" class="w-full rounded-2xl shadow-2xl overflow-hidden border-4 border-gray-100" style="height: 75vh;"></div>
          
          <!-- Legend -->
          <div class="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-4 max-w-[200px]">
            <h4 class="font-bold text-sm mb-2 text-gray-900">Net Benefit (£M)</h4>
            <div class="space-y-1">
              <div v-for="item in legendItems" :key="item.label" class="flex items-center gap-2">
                <div class="w-6 h-4 rounded" :style="{ backgroundColor: item.color }"></div>
                <span class="text-xs text-gray-700 font-medium">{{ item.label }}</span>
              </div>
            </div>
            <div class="mt-3 pt-2 border-t border-gray-200">
              <p class="text-[10px] text-gray-600">Click area for details</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Protocol } from 'pmtiles'
import { loadCSVData } from '../../utils/dataLoader'

const { t } = useI18n()

const mapContainer = ref<HTMLDivElement | null>(null)
let map: maplibregl.Map | null = null
const mapType = ref<'nation' | 'localAuthority'>('nation')
const isLoading = ref(true)
const selectedArea = ref<{
  name: string
  population?: number
  localAuthority?: string
  nation?: string
  airQuality?: number
  physicalActivity?: number
  congestion?: number
  netBenefit?: number
} | null>(null)

const legendItems = [
  { color: '#006837', label: '> £5M (High)' },
  { color: '#31a354', label: '£2-5M' },
  { color: '#78c679', label: '£1-2M' },
  { color: '#c2e699', label: '£0-1M' },
  { color: '#ffffcc', label: '£-1-0M' },
  { color: '#fd8d3c', label: '£-2 to -1M' },
  { color: '#e31a1c', label: '< -£2M (Low)' }
]

// Color scale function
const getColor = (netBenefit: number): string => {
  if (netBenefit >= 5) return '#006837'
  if (netBenefit >= 2) return '#31a354'
  if (netBenefit >= 1) return '#78c679'
  if (netBenefit >= 0) return '#c2e699'
  if (netBenefit >= -1) return '#ffffcc'
  if (netBenefit >= -2) return '#fd8d3c'
  return '#e31a1c'
}

const switchMapType = (type: 'nation' | 'localAuthority') => {
  mapType.value = type
  if (!map) return

  // Toggle layer visibility
  if (type === 'nation') {
    map.setLayoutProperty('nations-fill', 'visibility', 'visible')
    map.setLayoutProperty('nations-border', 'visibility', 'visible')
    map.setLayoutProperty('las-fill', 'visibility', 'none')
    map.setLayoutProperty('las-border', 'visibility', 'none')
    map.flyTo({ center: [-2.5, 54.5], zoom: 5.5, duration: 1000 })
  } else {
    map.setLayoutProperty('nations-fill', 'visibility', 'none')
    map.setLayoutProperty('nations-border', 'visibility', 'none')
    map.setLayoutProperty('las-fill', 'visibility', 'visible')
    map.setLayoutProperty('las-border', 'visibility', 'visible')
    map.flyTo({ center: [-2.5, 54.5], zoom: 7, duration: 1000 })
  }
}

onMounted(async () => {
  if (!mapContainer.value) return

  // Load CSV data
  const areaData = await loadCSVData()
  const dataMap = new Map(areaData.map(d => [d.small_area, d]))

  // Register PMTiles protocol with custom fetch to bypass ngrok warning
  const customFetch = async (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const headers = new Headers(init?.headers || {})
    headers.set('ngrok-skip-browser-warning', 'true')
    return fetch(url, { ...init, headers })
  }
  
  const protocol = new Protocol({ fetch: customFetch })
  maplibregl.addProtocol('pmtiles', protocol.tile)

  // Initialize map
  map = new maplibregl.Map({
    container: mapContainer.value,
    transformRequest: (url, resourceType) => {
      // Add ngrok bypass header for tile requests
      if (url.includes('ngrok')) {
        return {
          url: url,
          headers: { 'ngrok-skip-browser-warning': 'true' }
        }
      }
      return { url }
    },
    style: {
      version: 8,
      sources: {
        'nations': {
          type: 'vector',
          url: `pmtiles://${import.meta.env.VITE_TILES_BASE_URL}/tiles/nation_wgs84.pmtiles`
        },
        'las': {
          type: 'vector',
          url: `pmtiles://${import.meta.env.VITE_TILES_BASE_URL}/tiles/local_authorities_wgs84.pmtiles`
        }
      },
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: { 'background-color': '#f0f4f8' }
        }
      ],
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
    },
    center: [-2.5, 54.5], // UK center
    zoom: 5.5,
    maxZoom: 12,
    minZoom: 4
  })

  map.on('load', () => {
    if (!map) return

    console.log('🗺️ Map loaded, adding layers...')
    console.log('📊 Data loaded:', areaData.length, 'areas')

    // Add nations layers
    map.addLayer({
      id: 'nations-fill',
      type: 'fill',
      source: 'nations',
      'source-layer': 'nation',
      layout: { visibility: 'visible' },
      paint: {
        'fill-color': '#cccccc',
        'fill-opacity': 0.8
      }
    })

    map.addLayer({
      id: 'nations-border',
      type: 'line',
      source: 'nations',
      'source-layer': 'nation',
      layout: { visibility: 'visible' },
      paint: {
        'line-color': '#ffffff',
        'line-width': 1
      }
    })

    // Add local authorities layers (hidden by default)
    map.addLayer({
      id: 'las-fill',
      type: 'fill',
      source: 'las',
      'source-layer': 'local_authorities',
      layout: { visibility: 'none' },
      paint: {
        'fill-color': '#cccccc',
        'fill-opacity': 0.8
      }
    })

    map.addLayer({
      id: 'las-border',
      type: 'line',
      source: 'las',
      'source-layer': 'local_authorities',
      layout: { visibility: 'none' },
      paint: {
        'line-color': '#ffffff',
        'line-width': 1
      }
    })

    console.log('✅ Layers added successfully')

    // Click handler for both nations and local authorities
    const clickHandler = (e: any) => {
      if (!e.features?.[0]) return
      
      const feature = e.features[0]
      const layerId = feature.layer.id
      
      // Get the appropriate name based on layer type
      let areaName = ''
      let filterKey = ''
      let filterValue = ''
      
      if (layerId === 'nations-fill') {
        // Nation layer: use lookups_nation for name
        areaName = feature.properties?.lookups_nation || 'Unknown Nation'
        filterKey = 'nation'
        filterValue = areaName
      } else if (layerId === 'las-fill') {
        // Local Authority layer: use lookups_local_authority for name
        areaName = feature.properties?.lookups_local_authority || 'Unknown Authority'
        filterKey = 'local_authority'
        filterValue = areaName
      }
      
      // Aggregate data for all small areas in this nation/LA
      const relevantAreas = areaData.filter(d => {
        if (filterKey === 'nation') {
          return d.nation === filterValue
        } else {
          return d.local_authority === filterValue
        }
      })
      
      // Sum up all metrics
      const aggregated = relevantAreas.reduce((acc, d) => ({
        population: acc.population + (d.population || 0),
        airQuality: acc.airQuality + d.air_quality_million_gbp,
        physicalActivity: acc.physicalActivity + d.physical_activity_million_gbp,
        congestion: acc.congestion + d.congestion_million_gbp,
        netBenefit: acc.netBenefit + d.net_benefit_million_gbp
      }), {
        population: 0,
        airQuality: 0,
        physicalActivity: 0,
        congestion: 0,
        netBenefit: 0
      })
      
      selectedArea.value = {
        name: areaName,
        population: aggregated.population,
        nation: layerId === 'las-fill' ? relevantAreas[0]?.nation : undefined,
        localAuthority: layerId === 'nation' ? undefined : areaName,
        airQuality: aggregated.airQuality,
        physicalActivity: aggregated.physicalActivity,
        congestion: aggregated.congestion,
        netBenefit: aggregated.netBenefit
      }
      
      console.log('Clicked:', areaName, '- Aggregated', relevantAreas.length, 'areas')
    }

    map.on('click', 'nations-fill', clickHandler)
    map.on('click', 'las-fill', clickHandler)

    // Hover cursor for both layer types
    map.on('mouseenter', 'nations-fill', () => {
      if (map) map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'nations-fill', () => {
      if (map) map.getCanvas().style.cursor = ''
    })
    map.on('mouseenter', 'las-fill', () => {
      if (map) map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'las-fill', () => {
      if (map) map.getCanvas().style.cursor = ''
    })

    // Apply colors based on data
    const colorExpression: any = ['match', ['get', 'small_area']]
    areaData.forEach(d => {
      colorExpression.push(d.small_area, getColor(d.net_benefit_million_gbp))
    })
    colorExpression.push('#cccccc') // Default

    map.setPaintProperty('areas-fill', 'fill-color', colorExpression)

    console.log('🗺️ Heatmap loaded with', areaData.length, 'areas')
    
    // Hide loading screen
    isLoading.value = false
  })

  map.on('error', (e) => {
    console.error('❌ Map error:', e)
    isLoading.value = false
  })

  map.on('sourcedata', (e) => {
    if (e.sourceId === 'nation' && e.isSourceLoaded) {
      console.log('✅ Nation source loaded')
    }
  })
})

onUnmounted(() => {
  map?.remove()
  maplibregl.removeProtocol('pmtiles')
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
