<script setup>
import { useRouter } from 'vue-router'
import { usePerfumes } from './usePerfumes.js'

const router = useRouter()
const goBack = () => {
    router.push('/')
}

// Aquí llamamos a la lógica reutilizable, solo cambiando el nombre de la marca
const {
    perfumes,
    loading,
    cart,
    selectedPerfume,
    showModal,
    showCart,
    isAdmin,
    showEditModal,
    editingPerfume,
    getImageUrl,
    openModal,
    openEditModal,
    updatePerfume,
    addToCart,
    removeFromCart,
    cartTotal,
    confirmPurchase,
    imageFile,
    imagePreview,
    handleImageSelect
} = usePerfumes('Antonio Banderas');
</script>

<template>
    <div class="bg-stone-900 font-sans text-stone-200 min-h-screen">
        <!-- Header de la Sección -->
        <section class="relative py-16 px-6 text-center bg-gradient-to-b from-stone-950 to-stone-900 border-b border-stone-800">
        <div class="max-w-7xl mx-auto relative">
            <div class="w-full flex justify-start mb-6">
                <button @click="goBack" class="text-amber-600 hover:text-amber-500 transition-colors uppercase tracking-widest text-xs md:text-sm font-bold flex items-center gap-2">
                    <span>&larr;</span> Volver
                </button>
            </div>
            
            <h1 class="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700 mb-2 tracking-tighter uppercase">
            Antonio Banderas
            </h1>
            <div v-if="isAdmin">
                <button @click="openAddModal" class="bg-green-700 hover:bg-green-600 text-white px-6 py-2 rounded-sm uppercase tracking-widest text-sm font-bold transition-colors shadow-lg">Agregar Perfume</button>
            </div>
            <p class="text-stone-400 font-light uppercase tracking-widest text-sm">Seducción y Carisma</p>
        </div>
        </section>

        <!-- Lista de Perfumes -->
        <section class="py-16 px-6 max-w-7xl mx-auto">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div v-for="perfume in perfumes" :key="perfume._id" class="bg-stone-800 border border-stone-700 hover:border-amber-600 transition-colors duration-300 group rounded-sm overflow-hidden p-4 relative">

            <div class="aspect-[3/4] overflow-hidden bg-stone-700 relative mb-4">
                <img :src="getImageUrl(perfume.imagen)" :alt="perfume.nombre" loading="lazy" decoding="async" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            </div>
            
            <div class="text-center">
                <h3 class="text-lg font-bold text-stone-100 mb-1">{{ perfume.nombre }}</h3>
                <p class="text-amber-500 font-bold mb-4">${{ perfume.precio }}</p>
                <!-- Botones condicionales para Admin -->
                <div v-if="isAdmin" class="flex gap-2">
                    <button @click="openModal(perfume)" class="flex-1 py-2 border border-stone-600 text-stone-400 hover:text-white hover:border-amber-600 hover:bg-stone-700 transition-all text-sm uppercase tracking-wide">Ver</button>
                    <button @click="openEditModal(perfume)" class="flex-1 py-2 border border-stone-600 text-blue-400 hover:text-white hover:border-blue-500 hover:bg-stone-700 transition-all text-sm uppercase tracking-wide">Editar</button>
                </div>
                <button v-else @click="openModal(perfume)" class="w-full py-2 border border-stone-600 text-stone-400 hover:text-white hover:border-amber-600 hover:bg-stone-700 transition-all text-sm uppercase tracking-wide">
                    Ver Detalles
                </button>
            </div>
            </div>
        </div>
        </section>

        <!-- Modal de Detalles del Producto -->
        <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" @click.self="showModal = false">
            <div class="bg-stone-800 border border-amber-600 p-6 max-w-sm w-full relative rounded-sm shadow-2xl animate-fade-in">
                <button @click="showModal = false" class="absolute top-2 right-2 text-stone-400 hover:text-white text-2xl z-10">&times;</button>
                
                <div class="aspect-[3/4] overflow-hidden bg-stone-700 mb-4 rounded-sm border border-stone-600 mt-2">
                    <img :src="getImageUrl(selectedPerfume.imagen)" :alt="selectedPerfume.nombre" class="w-full h-full object-cover" />
                </div>
                
                <h3 class="text-2xl font-bold text-stone-100 mb-2">{{ selectedPerfume.nombre }}</h3>
                <p class="text-amber-500 text-xl font-bold mb-4">${{ selectedPerfume.precio }}</p>
                <p class="text-stone-300 mb-6 text-sm leading-relaxed">
                    Una fragancia exclusiva que define tu estilo. Ideal para cualquier ocasión.
                </p>
                
                <button @click="addToCart" class="w-full py-3 bg-amber-700 hover:bg-amber-600 text-white font-bold uppercase tracking-widest transition-colors shadow-lg">
                    Agregar a la Compra
                </button>
            </div>
        </div>

        <!-- Modal de Edición (Admin) -->
        <div v-if="showEditModal" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" @click.self="showEditModal = false">
            <div class="bg-stone-900 border border-amber-600/50 p-6 max-w-md w-full rounded-sm shadow-2xl relative max-h-[90vh] overflow-y-auto">
                <button @click="showEditModal = false" class="absolute top-4 right-4 text-stone-500 hover:text-white transition-colors text-xl">&times;</button>
                
                <h2 class="text-xl font-bold text-amber-500 mb-6 uppercase tracking-widest text-center">Editar Perfume</h2>
                
                <form @submit.prevent="updatePerfume" class="space-y-4">
                    <!-- Campo de Imagen con Drag & Drop -->
                    <div>
                        <label class="block text-stone-400 text-xs uppercase tracking-wider mb-1">Imagen</label>
                        <div 
                            class="border-2 border-dashed border-stone-700 hover:border-amber-600 bg-stone-800/50 rounded-sm p-4 text-center cursor-pointer transition-all relative group"
                            @click="$refs.fileInput.click()"
                            @dragover.prevent
                            @drop.prevent="handleImageSelect"
                        >
                            <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleImageSelect" />
                            
                            <div v-if="imagePreview || editingPerfume.imagen" class="aspect-[3/4] w-24 mx-auto overflow-hidden bg-stone-800 mb-2 border border-stone-600">
                                <img :src="imagePreview || getImageUrl(editingPerfume.imagen)" class="w-full h-full object-cover" />
                            </div>
                            <p class="text-stone-500 text-xs group-hover:text-stone-300 transition-colors">{{ imageFile ? imageFile.name : 'Arrastra una imagen o haz clic' }}</p>
                        </div>
                    </div>

                    <div>
                        <label class="block text-stone-400 text-xs uppercase tracking-wider mb-1">Nombre</label>
                        <input v-model="editingPerfume.nombre" class="w-full bg-stone-800 border border-stone-700 p-2 text-stone-200 focus:border-amber-600 outline-none" required />
                    </div>
                    <div>
                        <label class="block text-stone-400 text-xs uppercase tracking-wider mb-1">Precio</label>
                        <input v-model="editingPerfume.precio" type="number" class="w-full bg-stone-800 border border-stone-700 p-2 text-stone-200 focus:border-amber-600 outline-none" required />
                    </div>
                    <div>
                        <label class="block text-stone-400 text-xs uppercase tracking-wider mb-1">Marca</label>
                        <input v-model="editingPerfume.marca" class="w-full bg-stone-800 border border-stone-700 p-2 text-stone-200 focus:border-amber-600 outline-none" required />
                    </div>
                    <div>
                        <label class="block text-stone-400 text-xs uppercase tracking-wider mb-1">Categoría</label>
                        <select v-model="editingPerfume.categoria" class="w-full bg-stone-800 border border-stone-700 p-2 text-stone-200 focus:border-amber-600 outline-none">
                            <option value="Masculino">Masculino</option>
                            <option value="Femenino">Femenino</option>
                            <option value="Unisex">Unisex</option>
                        </select>
                    </div>
                    <button type="submit" class="w-full bg-amber-700 hover:bg-amber-600 text-white font-bold py-3 uppercase tracking-widest transition-colors shadow-lg mt-4">
                        Guardar Cambios
                    </button>
                </form>
            </div>
        </div>

        <!-- Botón Flotante del Carrito -->
        <div v-if="cart.length > 0" class="fixed bottom-6 right-6 z-40">
            <button @click="showCart = !showCart" class="bg-amber-600 hover:bg-amber-500 text-white p-4 rounded-full shadow-[0_0_20px_rgba(180,83,9,0.5)] flex items-center gap-2 transition-all transform hover:scale-105">
                <span class="text-xl">🛒</span>
                <span class="font-bold">{{ cart.length }}</span>
            </button>
        </div>

        <!-- Panel Lateral del Carrito -->
        <div v-if="showCart" class="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" @click.self="showCart = false">
            <div class="bg-stone-900 border-l border-stone-700 w-full sm:w-96 h-full flex flex-col shadow-2xl transform transition-transform">
                <div class="p-6 border-b border-stone-800 flex justify-between items-center bg-stone-950">
                    <h2 class="text-xl font-bold text-amber-500 uppercase tracking-widest">Tu Carrito</h2>
                    <button @click="showCart = false" class="text-stone-400 hover:text-white text-2xl">&times;</button>
                </div>
                
                <div class="flex-1 overflow-y-auto p-6 space-y-4">
                    <div v-for="(item, index) in cart" :key="index" class="flex gap-4 items-center bg-stone-800 p-3 rounded-sm border border-stone-700">
                        <img :src="getImageUrl(item.imagen)" class="w-16 h-16 object-cover rounded-sm" />
                        <div class="flex-1">
                            <h4 class="text-stone-200 font-bold text-sm">{{ item.nombre }}</h4>
                            <p class="text-amber-600 font-bold">${{ item.precio }}</p>
                        </div>
                        <button @click="removeFromCart(index)" class="text-stone-500 hover:text-red-500 transition-colors p-2">🗑️</button>
                    </div>
                </div>
                
                <div class="p-6 border-t border-stone-800 bg-stone-950">
                    <div class="flex justify-between items-center mb-4 text-xl font-bold">
                        <span class="text-stone-300">Total:</span>
                        <span class="text-amber-500">${{ cartTotal }}</span>
                    </div>
                    <button @click="confirmPurchase" :disabled="cart.length === 0" :class="cart.length === 0 ? 'bg-stone-700 text-stone-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white'" class="w-full py-3 font-bold uppercase tracking-widest transition-colors rounded-sm shadow-lg">
                        Confirmar Compra (WhatsApp)
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>