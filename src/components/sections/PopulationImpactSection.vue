<template>
  <section id="population" class="section-container bg-gradient-to-br from-white to-background py-32 scroll-snap-align-start">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="section-title">{{ t('sectionPopulation.title') }}</h2>
        <h3 class="section-subtitle">{{ t('sectionPopulation.subtitle') }}</h3>
        <p class="story-text mt-6">{{ t('sectionPopulation.intro') }}</p>
      </div>
      
      <!-- Animated Counter Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div class="bg-air-quality/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border-2 border-air-quality/30 transform hover:scale-105 transition-transform duration-300">
          <div class="text-5xl md:text-6xl font-bold mb-4 text-air-quality">
            {{ animatedPeople }}M
          </div>
          <div class="text-xl font-semibold mb-2 text-gray-900">{{ t('sectionPopulation.highBenefit.label') }}</div>
          <p class="text-gray-700">{{ t('sectionPopulation.unit') }}</p>
        </div>
        
        <div class="bg-physical-activity/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border-2 border-physical-activity/30 transform hover:scale-105 transition-transform duration-300">
          <div class="text-5xl md:text-6xl font-bold mb-4 text-physical-activity">
            £{{ animatedBenefit }}B
          </div>
          <div class="text-xl font-semibold mb-2 text-gray-900">{{ t('sectionPopulation.mediumBenefit.label') }}</div>
          <p class="text-gray-700">Total Economic Benefit</p>
        </div>
        
        <div class="bg-congestion/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border-2 border-congestion/30 transform hover:scale-105 transition-transform duration-300">
          <div class="text-5xl md:text-6xl font-bold mb-4 text-congestion">
            {{ animatedPositive }}%
          </div>
          <div class="text-xl font-semibold mb-2 text-gray-900">{{ t('sectionPopulation.lowBenefit.label') }}</div>
          <p class="text-gray-700">Areas with Positive Benefit</p>
        </div>
      </div>
      
      <!-- Comparison Visualization -->
      <div class="bg-white/60 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-gray-200 p-8 mb-12">
        <h3 class="text-3xl font-bold text-center mb-8">Population Distribution</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="text-center p-6 bg-white/60 backdrop-blur-sm rounded-xl border-2 border-green-300">
            <div class="text-6xl mb-4 text-green-600"><i class="fas fa-smile-beam"></i></div>
            <div class="text-4xl font-bold text-green-700 mb-2">{{ benefitAreas.toLocaleString() }}</div>
            <div class="text-lg font-semibold text-gray-700 mb-2">Areas with Positive Benefit</div>
            <div class="text-3xl font-bold text-green-600">{{ benefitPopulation.toFixed(1) }}M people</div>
          </div>
          
          <div class="text-center p-6 bg-white/60 backdrop-blur-sm rounded-xl border-2 border-red-300">
            <div class="text-6xl mb-4 text-red-600"><i class="fas fa-frown"></i></div>
            <div class="text-4xl font-bold text-red-700 mb-2">{{ lossAreas.toLocaleString() }}</div>
            <div class="text-lg font-semibold text-gray-700 mb-2">Areas with Negative Benefit</div>
            <div class="text-3xl font-bold text-red-600">{{ lossPopulation.toFixed(1) }}M people</div>
          </div>
        </div>
      </div>
      
      <!-- Insight Box -->
      <div class="text-center">
        <div class="bg-white/60 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto border-2 border-gray-200 shadow-2xl">
          <p class="text-lg text-gray-800">{{ t('sectionPopulation.insight') }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { loadCSVData } from '../../utils/dataLoader'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const { t } = useI18n()

// Animated counter values
const animatedPeople = ref(0)
const animatedBenefit = ref(0)
const animatedPositive = ref(0)

// Static calculated values
const benefitAreas = ref(0)
const lossAreas = ref(0)
const benefitPopulation = ref(0)
const lossPopulation = ref(0)

onMounted(async () => {
  const allData = await loadCSVData()
  
  // Calculate total population affected
  const totalPopulation = allData.reduce((sum, d) => sum + (d.population || 0), 0)
  const totalPopulationMillions = totalPopulation / 1_000_000
  
  // Calculate total net benefit in billions
  const totalBenefit = allData.reduce((sum, d) => sum + d.net_benefit_million_gbp, 0)
  const totalBenefitBillions = totalBenefit / 1000
  
  // Calculate percentage with positive net benefit
  const positiveAreas = allData.filter(d => d.net_benefit_million_gbp > 0)
  const positivePercent = (positiveAreas.length / allData.length) * 100
  
  // Calculate areas and populations
  const negativeAreas = allData.filter(d => d.net_benefit_million_gbp <= 0)
  benefitAreas.value = positiveAreas.length
  lossAreas.value = negativeAreas.length
  
  benefitPopulation.value = positiveAreas.reduce((sum, d) => sum + (d.population || 0), 0) / 1_000_000
  lossPopulation.value = negativeAreas.reduce((sum, d) => sum + (d.population || 0), 0) / 1_000_000
  
  console.log(`📊 Population Impact: ${totalPopulationMillions.toFixed(1)}M people, £${totalBenefitBillions.toFixed(1)}B benefit, ${positivePercent.toFixed(1)}% positive`)
  
  // Animate counters on scroll
  ScrollTrigger.create({
    trigger: '#population',
    start: 'top 60%',
    onEnter: () => {
      // Animate population counter
      gsap.to(animatedPeople, {
        duration: 2,
        value: totalPopulationMillions,
        ease: 'power2.out',
        onUpdate: function() {
          animatedPeople.value = this.targets()[0].value.toFixed(1)
        }
      })
      
      // Animate benefit counter
      gsap.to(animatedBenefit, {
        duration: 2,
        value: totalBenefitBillions,
        ease: 'power2.out',
        onUpdate: function() {
          animatedBenefit.value = this.targets()[0].value.toFixed(1)
        }
      })
      
      // Animate percentage counter
      gsap.to(animatedPositive, {
        duration: 2,
        value: positivePercent,
        ease: 'power2.out',
        onUpdate: function() {
          animatedPositive.value = Math.round(this.targets()[0].value)
        }
      })
    }
  })
})
</script>
