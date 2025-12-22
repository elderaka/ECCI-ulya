<template>
  <footer class="bg-gray-900 text-white py-12 relative">
    <div class="max-w-7xl mx-auto px-6 text-center">
      <p class="text-xl font-semibold mb-2">{{ t('footer.credit') }}</p>
      <p class="text-gray-400">{{ t('footer.dataSource') }}</p>
    </div>
    
    <!-- Info Icon -->
    <button
      @click="showModal = true"
      class="absolute bottom-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all hover:scale-110"
      aria-label="Credits"
    >
      <i class="fas fa-info text-white text-lg"></i>
    </button>
    
    <!-- Credits Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showModal"
          class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          @click="showModal = false"
        >
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div
            class="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
            @click.stop
          >
            <button
              @click="showModal = false"
              class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <i class="fas fa-times text-gray-600"></i>
            </button>
            
            <div class="text-center">
              <h3 class="text-2xl font-bold text-gray-900 mb-6">Made with 💘 by:</h3>
              <div class="space-y-3">
                <p class="text-lg text-gray-800 font-medium">Imtitsal Ulya Salsabila</p>
                <p class="text-lg text-gray-800 font-medium">Athayya Khalisah Putri</p>
                <p class="text-lg text-gray-800 font-medium">Salsabila Hidi</p>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </footer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const showModal = ref(false)
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.9);
}
</style>
