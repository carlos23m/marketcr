import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router/index.js'
import App from './App.vue'
import './style.css'

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.use(router)

// Init auth before router resolves so guards have session state
import { useAuthStore } from './stores/useAuthStore.js'
const authStore = useAuthStore()
authStore.init().then(() => app.mount('#app'))
