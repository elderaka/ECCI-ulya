<template>
  <div id="app" class="relative">
    <Navbar />
    <div :key="locale" class="lang-transition">
      <HeroSection id="hero" />
      <DistributionsSection id="distributions" />
      <CorrelationSection id="correlation" />
      <PopulationImpactSection id="population" />
      <HeatmapSection id="heatmap" />
      <TradeoffSection id="tradeoff" />
      <Footer id="footer" />
    </div>
    
    <!-- Custom Scrollbar Indicator -->
    <div class="custom-scrollbar">
      <div
        v-for="(section, index) in sections"
        :key="section.id"
        :class="['scroll-dot', { active: activeSection === index }]"
        @click="scrollToSection(section.id)"
        :title="section.name"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Navbar from './components/Navbar.vue'
import HeroSection from './components/sections/HeroSection.vue'
import DistributionsSection from './components/sections/DistributionsSection.vue'
import CorrelationSection from './components/sections/CorrelationSection.vue'
import PopulationImpactSection from './components/sections/PopulationImpactSection.vue'
import HeatmapSection from './components/sections/HeatmapSection.vue'
import TradeoffSection from './components/sections/TradeoffSection.vue'
import Footer from './components/Footer.vue'

const { locale } = useI18n()

const sections = [
  { id: 'hero', name: 'Home' },
  { id: 'distributions', name: 'Distributions' },
  { id: 'correlation', name: 'Correlation' },
  { id: 'population', name: 'Population' },
  { id: 'heatmap', name: 'Geographic View' },
  { id: 'tradeoff', name: 'Tradeoff' },
  { id: 'footer', name: 'Footer' }
]

const activeSection = ref(0)

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

const handleScroll = () => {
  const windowHeight = window.innerHeight
  const scrollPosition = window.scrollY + windowHeight / 2

  sections.forEach((section, index) => {
    const element = document.getElementById(section.id)
    if (element) {
      const { offsetTop, offsetHeight } = element
      if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
        activeSection.value = index
      }
    }
  })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll() // Initial check
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>
