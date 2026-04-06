<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
// Usamos window.location.hostname para detectar la IP de tu red automáticamente
const backendUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;

// Función para construir la URL de la imagen (igual que en AntonioBanderas.vue)
const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  let path = imagePath.trim();

  // Corrección automática: si falta la barra inicial en rutas locales
  if (path.startsWith('img/')) {
    path = '/' + path;
  }

  if (path.startsWith('http') || path.startsWith('/img')) {
    return path;
  }
  return `${backendUrl}/${path}`;
}

const loading = ref(true);

const categories = ref([
  {
    id: 'antonio-banderas',
    title: 'Antonio Banderas',
    marca: 'Antonio Banderas', // Nombre exacto para buscar en la BD
    description: 'Seducción y Carisma',
    images: [
    ],
    currentIndex: 0
  },
  {
    id: 'arabes-originales',
    title: 'Árabes Originales',
    marca: 'Árabes Originales',
    description: 'Esencias de Oriente',
    images: [
    ],
    currentIndex: 0
  },
  {
    id: 'arabes-g5',
    title: 'Árabes Calidad G5',
    marca: 'Árabes Calidad G5',
    description: 'Alta Calidad Accesible',
    images: [
    ],
    currentIndex: 0
  },
  {
    id: 'arabes-miniaturas',
    title: 'Árabes Miniaturas',
    marca: 'Árabes Miniaturas',
    description: 'Pequeños Tesoros',
    images: [
    ],
    currentIndex: 0
  },
  {
    id: 'originales-outlet',
    title: 'Originales Outlet',
    marca: 'Originales Outlet',
    description: 'Oportunidades Únicas',
    images: [
      
    ],
    currentIndex: 0
  },
  {
    id: 'premium',
    title: 'Premium',
    marca: 'Premium',
    description: 'Exclusividad Total',
    images: [
    ],
    currentIndex: 0
  },
  {
    id: 'tubos-arabes',
    title: 'Tubos Árabes',
    marca: 'Tubos Árabes',
    description: 'Fragancias en Tubo',
    images: [
    ],
    currentIndex: 0
  }
])

const nextImage = (category) => {
  category.currentIndex = (category.currentIndex + 1) % category.images.length
}

const prevImage = (category) => {
  category.currentIndex = (category.currentIndex - 1 + category.images.length) % category.images.length
}

const goToCategory = (id) => {
  // Navega automáticamente a la ruta con el mismo nombre que el ID
  router.push(`/${id}`)
}

// Función para cargar las imágenes de cada categoría desde la BD
const fetchCategoryImages = async () => {
  loading.value = true;
  try {
    const promises = categories.value.map(async (category) => {
      if (category.marca) {
        try {
          const response = await fetch(`${backendUrl}/perfumes?marca=${encodeURIComponent(category.marca)}`);
          const data = await response.json();
          
          // FILTRO DE SEGURIDAD: Nos aseguramos de que los perfumes sean EXACTAMENTE de esa marca
          const perfumesFiltrados = data.filter(item => item.marca?.trim() === category.marca);

          // Si encontramos perfumes, reemplazamos las imágenes estáticas con las dinámicas
          if (perfumesFiltrados && perfumesFiltrados.length > 0) {
            category.images = perfumesFiltrados.map(item => getImageUrl(item.imagen));
          }
        } catch (error) {
          console.error(`Error cargando imágenes para ${category.title}:`, error);
        }
      }
    });
    await Promise.all(promises);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchCategoryImages();
});

const scrollToCollections = () => {
  const element = document.getElementById('colecciones');
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}
</script>

<template>
  <div class="bg-stone-900 font-sans text-stone-200">
    <!-- Hero Section -->
    <section class="relative py-20 md:py-32 px-6 text-center bg-gradient-to-b from-stone-950 to-stone-900 border-b border-stone-800 overflow-hidden">
      <!-- Efecto de fondo sutil -->
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900 via-transparent to-transparent"></div>
      
      <div class="max-w-4xl mx-auto">
        <h1 class="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700 mb-6 md:mb-8 tracking-tighter uppercase drop-shadow-sm">
          Essence
        </h1>
        <p class="text-lg md:text-3xl text-stone-300 mb-8 md:mb-12 max-w-2xl mx-auto font-light leading-relaxed">
          Redefine tu presencia. Fragancias exclusivas para el hombre y la mujer que domina su destino.
        </p>
        <button @click="scrollToCollections" class="bg-amber-700 hover:bg-amber-600 text-white font-bold py-4 px-10 rounded-sm shadow-[0_0_20px_rgba(180,83,9,0.3)] hover:shadow-[0_0_30px_rgba(180,83,9,0.5)] transition-all duration-300 uppercase tracking-[0.2em] border border-amber-600/50">
          Explorar Colección
        </button>
      </div>
    </section>

    <!-- Catalog Section -->
    <section id="colecciones" class="py-16 px-6 max-w-7xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-4xl font-bold text-stone-100 uppercase tracking-widest inline-block relative after:content-[''] after:block after:w-24 after:h-1 after:bg-amber-700 after:mx-auto after:mt-4">
          Nuestras Colecciones
        </h2>
      </div>
      
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        <div v-for="category in categories" :key="category.id" class="bg-stone-800 border border-stone-700 hover:border-amber-600 transition-colors duration-300 group rounded-sm overflow-hidden p-4">
          <div class="text-center mb-4">
            <h3 class="text-2xl font-bold text-stone-100 mb-1">{{ category.title }}</h3>
            <p class="text-xs text-amber-500 uppercase tracking-widest font-bold">{{ category.description }}</p>
          </div>
          
          <div class="aspect-[3/4] overflow-hidden bg-stone-700 relative mb-4">
            <Transition name="fade" mode="out-in">
              <div v-if="loading" class="w-full h-full flex items-center justify-center text-stone-500 text-sm animate-pulse bg-stone-800">Cargando...</div>
              <img v-else-if="category.images.length > 0" :key="category.currentIndex" :src="category.images[category.currentIndex]" :alt="category.title" loading="lazy" decoding="async" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div v-else class="w-full h-full flex items-center justify-center text-stone-500 text-sm">Sin imágenes</div>
            </Transition>
            
            <!-- Flechas de navegación -->
            <button v-if="category.images.length > 1" @click.prevent="prevImage(category)" class="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-amber-700 text-white w-8 h-8 flex items-center justify-center rounded-full transition-colors z-10">&lt;</button>
            <button v-if="category.images.length > 1" @click.prevent="nextImage(category)" class="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-amber-700 text-white w-8 h-8 flex items-center justify-center rounded-full transition-colors z-10">&gt;</button>
          </div>
          
          <div class="text-center">
            <button @click="goToCategory(category.id)" class="w-full py-2 border border-stone-600 text-stone-400 hover:text-white hover:border-amber-600 hover:bg-stone-700 transition-all text-sm uppercase tracking-wide">
              Ver {{ category.title }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
