<script setup>
import { ref, onMounted, watch, provide } from 'vue'
import { RouterView, RouterLink, useRouter } from 'vue-router'

const isMenuOpen = ref(false)
const showLoginModal = ref(false)
const username = ref('')
const password = ref('')
const isAdmin = ref(false)

const router = useRouter()

// Detectar URL del backend dinámicamente
const rawUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
const backendUrl = rawUrl.replace(/\/$/, "");

onMounted(() => {
  // Verificar si ya hay una sesión de admin activa guardada
  if (localStorage.getItem('isAdmin') === 'true') {
    isAdmin.value = true
  }
})

const handleLogin = async () => {
  try {
    // Intentamos loguear contra el backend
    const response = await fetch(`${backendUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    })

    if (response.ok) {
      isAdmin.value = true
      localStorage.setItem('isAdmin', 'true')
      showLoginModal.value = false
      username.value = ''
      password.value = ''
    } else {
      const data = await response.json()
      alert(data.error || 'Credenciales incorrectas')
    }
  } catch (error) {
    console.error('Error:', error)
    alert('Error al conectar con el servidor')
  }
}

const handleLogout = () => {
  isAdmin.value = false
  localStorage.removeItem('isAdmin')
  isMenuOpen.value = false
  router.push('/')
}

provide('handleLogout', handleLogout)

// Bloquear scroll cuando el modal de login está abierto
watch(showLoginModal, (val) => {
  document.body.style.overflow = val ? 'hidden' : ''
})

</script>

<template>
  <div class="min-h-screen text-stone-200 font-sans bg-stone-950 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-900 via-black to-black">
    <!-- El contenido debe ser relativo para que se muestre sobre la capa de superposición -->
    <div class="relative">
      <!-- Barra de Presentación (Navbar) -->
      <nav class="bg-stone-950/80 backdrop-blur-md border-b border-stone-800/50 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-6 py-4 md:py-5 flex justify-between items-center">
          <div class="text-2xl font-bold text-amber-600 tracking-widest uppercase font-serif">
            Le Parfum
          </div>
          <div class="hidden md:flex space-x-8 text-sm font-medium tracking-widest uppercase text-stone-400">
            <!-- <RouterLink to="/" class="hover:text-amber-500 transition-colors duration-300">Colección</RouterLink> -->
            <!-- <a href="#" class="hover:text-amber-500 transition-colors duration-300">Historia</a> -->
            <a href="https://wa.me/5493564503797" target="_blank" class="hover:text-amber-500 transition-colors duration-300">Contacto Whatsapp</a>
            
            <!-- Sección de Cuenta / Admin -->
            <div v-if="isAdmin" class="flex items-center gap-4 border-l border-stone-700 pl-6 ml-4">
              <span class="text-amber-500 font-bold text-xs tracking-widest">ADMIN</span>
              <RouterLink to="/gestion" class="hover:text-amber-500 transition-colors duration-300 text-xs font-bold">GESTIONAR</RouterLink>
            </div>
            <button v-else @click="showLoginModal = true" class="hover:text-amber-500 transition-colors duration-300 flex items-center gap-2 border-l border-stone-700 pl-6 ml-4">
              <span>👤</span>
              <span>CUENTA</span>
            </button>
          </div>
          
          <!-- Botón Menú Móvil -->
          <button @click="isMenuOpen = !isMenuOpen" class="md:hidden text-stone-400 hover:text-amber-500 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>

        <!-- Menú Desplegable Móvil -->
        <div v-show="isMenuOpen" class="md:hidden bg-stone-950 border-b border-stone-800">
          <div class="flex flex-col px-6 py-4 space-y-4 text-sm font-medium tracking-widest uppercase text-stone-400">
            <RouterLink to="/" class="hover:text-amber-500 transition-colors duration-300 block py-2 border-b border-stone-800/50">Colección</RouterLink>
            <a href="#" class="hover:text-amber-500 transition-colors duration-300 block py-2 border-b border-stone-800/50">Historia</a>
            <a href="https://wa.me/5493564503797" target="_blank" class="hover:text-amber-500 transition-colors duration-300 block py-2">Contacto</a>
            
            <div v-if="isAdmin" class="pt-2 border-t border-stone-800">
              <span class="block text-amber-500 font-bold mb-2">MODO ADMIN</span>
              <RouterLink to="/gestion" class="text-stone-400 hover:text-white uppercase text-xs tracking-widest block mb-3">Gestionar Perfumes</RouterLink>              
            </div>
            <button v-else @click="showLoginModal = true; isMenuOpen = false" class="text-left hover:text-amber-500 transition-colors duration-300 block py-2 border-t border-stone-800 mt-2 uppercase text-xs tracking-widest">
              Iniciar Sesión
            </button>
          </div>
        </div>
      </nav>
      <main>
        <RouterView />
      </main>

      <!-- Pie de Página (Footer) -->
      <footer class="bg-stone-950/90 text-stone-400 py-12 mt-12">
        <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Columna 1: Marca -->
          <div>
            <div class="text-2xl font-bold text-amber-600 tracking-widest uppercase font-serif mb-4">
              Le Parfum
            </div>
            <p class="text-sm leading-relaxed">
              Descubre la esencia de la elegancia. Fragancias exclusivas para momentos inolvidables.
            </p>
          </div>

          <!-- Columna 2: Contacto -->
          <div>
            <h4 class="text-stone-100 font-bold uppercase tracking-wider mb-4">Contacto</h4>
            <ul class="space-y-3 text-sm">
              <li class="flex items-start">
                <span class="text-amber-600 mr-2">📍</span>
                <span>Av. Principal 123, Ciudad, País</span>
              </li>
              <li class="flex items-center">
                <span class="text-amber-600 mr-2">✉️</span>
                <a href="mailto:contacto@leparfum.com" class="hover:text-amber-500 transition-colors">contacto@leparfum.com</a>
              </li>
              <li class="flex items-center">
                <span class="text-amber-600 mr-2">📞</span>
                <a href="https://wa.me/5493564503797" target="_blank" class="hover:text-amber-500 transition-colors">+54 9 3564 50-3797</a>
              </li>
            </ul>
          </div>

          <!-- Columna 3: Redes Sociales -->
          <div>
            <h4 class="text-stone-100 font-bold uppercase tracking-wider mb-4">Síguenos</h4>
            <div class="flex space-x-4">
              <a href="#" class="text-stone-400 hover:text-amber-500 transition-colors">Instagram</a>
              <a href="#" class="text-stone-400 hover:text-amber-500 transition-colors">Facebook</a>
              <a href="#" class="text-stone-400 hover:text-amber-500 transition-colors">Twitter</a>
            </div>
          </div>
        </div>
        
        <div class="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-stone-900 text-center text-xs text-stone-500">
          &copy; 2026 Le Parfum. Todos los derechos reservados.
        </div>
      </footer>
    </div>

    <!-- Modal de Login -->
    <div v-if="showLoginModal" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" @click.self="showLoginModal = false">
      <div class="bg-stone-900 border border-amber-600/50 p-8 max-w-md w-full rounded-sm shadow-2xl relative">
        <button @click="showLoginModal = false" class="absolute top-4 right-4 text-stone-500 hover:text-white transition-colors text-xl">&times;</button>
        
        <h2 class="text-2xl font-bold text-amber-500 mb-6 text-center uppercase tracking-widest">Acceso Admin</h2>
        
        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label class="block text-stone-400 text-xs uppercase tracking-wider mb-2">Usuario</label>
            <input v-model="username" type="text" class="w-full bg-stone-800 border border-stone-700 text-stone-200 px-4 py-3 focus:outline-none focus:border-amber-600 transition-colors" placeholder="Usuario" />
          </div>
          
          <div>
            <label class="block text-stone-400 text-xs uppercase tracking-wider mb-2">Contraseña</label>
            <input v-model="password" type="password" class="w-full bg-stone-800 border border-stone-700 text-stone-200 px-4 py-3 focus:outline-none focus:border-amber-600 transition-colors" placeholder="••••••••" />
          </div>
          
          <button type="submit" class="w-full bg-amber-700 hover:bg-amber-600 text-white font-bold py-3 uppercase tracking-widest transition-colors shadow-lg">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  </div>
</template>