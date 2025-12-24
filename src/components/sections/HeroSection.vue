<template>
  <section id="hero" class="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-air-quality/10 via-background to-physical-activity/10 scroll-snap-align-start">
    <!-- Particle Background -->
    <canvas ref="particleCanvas" class="absolute inset-0 w-full h-full"></canvas>
    
    <!-- Content -->
    <div class="relative z-10 text-center px-6 max-w-5xl">
      <h1 class="section-title text-5xl md:text-6xl lg:text-7xl mb-6 animate-fade-in">
        {{ t('hero.title') }}
      </h1>
      <h2 class="section-subtitle text-xl md:text-2xl lg:text-3xl mb-10 animate-fade-in-delay">
        {{ t('hero.subtitle') }}
      </h2>
      <p class="story-text text-lg md:text-xl mb-12 animate-fade-in-delay-2">
        {{ t('hero.hook') }}
      </p>
      
      <div class="bg-white/60 backdrop-blur-sm rounded-2xl px-8 py-6 mb-10 animate-fade-in-delay-3 shadow-2xl border-2 border-gray-200">
        <p class="text-xl md:text-2xl font-bold italic text-gray-900">
          {{ t('hero.tagline') }}
        </p>
      </div>
      
      <div class="animate-bounce mt-12">
        <a href="#distributions" class="inline-block">
          <svg class="w-12 h-12 text-air-quality" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
          <p class="text-sm mt-2 text-gray-600">{{ t('hero.scrollDown') }}</p>
        </a>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const particleCanvas = ref<HTMLCanvasElement | null>(null)

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
}

onMounted(() => {
  if (!particleCanvas.value) return
  
  const canvas = particleCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  resize()
  window.addEventListener('resize', resize)
  
  const particles: Particle[] = []
  const particleCount = 100
  
  // Initialize particles
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.2
    })
  }
  
  let animationId: number
  
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    particles.forEach(particle => {
      particle.x += particle.vx
      particle.y += particle.vy
      
      if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
      if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1
      
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(46, 134, 171, ${particle.opacity})`
      ctx.fill()
    })
    
    // Draw connections
    particles.forEach((p1, i) => {
      particles.slice(i + 1).forEach(p2 => {
        const dx = p1.x - p2.x
        const dy = p1.y - p2.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 150) {
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.strokeStyle = `rgba(46, 134, 171, ${0.1 * (1 - distance / 150)})`
          ctx.stroke()
        }
      })
    })
    
    animationId = requestAnimationFrame(animate)
  }
  
  animate()
  
  onUnmounted(() => {
    cancelAnimationFrame(animationId)
    window.removeEventListener('resize', resize)
  })
})
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 1s ease-out;
}

.animate-fade-in-delay {
  animation: fade-in 1s ease-out 0.3s both;
}

.animate-fade-in-delay-2 {
  animation: fade-in 1s ease-out 0.6s both;
}

.animate-fade-in-delay-3 {
  animation: fade-in 1s ease-out 0.9s both;
}
</style>
