<template>
  <nav class="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-lg shadow-lg z-50 transition-all duration-300">
    <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
      <div class="text-2xl font-bold text-gray-900">Net-Zero UK</div>
      
      <div class="flex items-center gap-8">
        <a
          v-for="item in navItems"
          :key="item.id"
          :href="`#${item.id}`"
          class="text-gray-700 hover:text-air-quality transition-colors font-medium"
        >
          {{ t(`nav.${item.id}`) }}
        </a>
        
        <button
          @click="toggleLanguage"
          class="px-4 py-2 bg-air-quality text-white rounded-lg hover:bg-opacity-90 transition-all font-medium"
          :aria-label="`Switch to ${locale === 'en' ? 'Indonesian' : 'English'}`"
        >
          {{ locale === 'en' ? 'ID' : 'EN' }}
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const navItems = [
  { id: 'hero' },
  { id: 'distributions' },
  { id: 'correlation' },
  { id: 'population' },
  { id: 'heatmap' },
  { id: 'tradeoff' }
]

const toggleLanguage = () => {
  locale.value = locale.value === 'en' ? 'id' : 'en'
}
</script>
