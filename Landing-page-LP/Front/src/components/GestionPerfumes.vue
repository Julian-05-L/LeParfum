<script setup>
import { ref, inject } from 'vue'
import { useRouter } from 'vue-router'

const nombre = ref('')
const precio = ref('')
const marca = ref('') 
const imagen = ref('')
const categoria = ref('')
const imageFile = ref(null)
const imagePreview = ref('')
const deleteMarca = ref('')
const deletePerfumeId = ref('')
const perfumesToDelete = ref([])

const router = useRouter()

const handleLogout = inject('handleLogout')

const rawUrl = import.meta.env.VITE_API_URL || `https://le-parfum-smoky.vercel.app/api`;
let backendUrl = rawUrl.replace(/\/$/, "");
if (backendUrl && !backendUrl.startsWith('http')) {
    backendUrl = `https://${backendUrl}`;
}

const marcasDisponibles = [
    'Antonio Banderas',
    'Árabes Originales',
    'Árabes Calidad G5',
    'Árabes Miniaturas',
    'Originales Outlet',
    'Premium',
    'Tubos Árabes'
]

const handleImageSelect = (event) => {
    const file = event.target.files ? event.target.files[0] : event.dataTransfer.files[0];
    if (file) {
        imageFile.value = file;
        imagePreview.value = URL.createObjectURL(file);
    }
}

const agregarPerfume = async () => {
    if (!nombre.value || !precio.value || !marca.value || !categoria.value) {
        alert('Por favor completa los campos obligatorios')
        return
    }

    try {
        let imagePath = 'img/placeholder.jpg';

        if (imageFile.value) {
            const formData = new FormData();
            formData.append('image', imageFile.value);

            const uploadResponse = await fetch(`${backendUrl}/upload`, {
                method: 'POST',
                body: formData
            });

            if (uploadResponse.ok) {
                const uploadData = await uploadResponse.json();
                imagePath = uploadData.path;
            } else {
                const errorData = await uploadResponse.json().catch(() => null);
                const errorMessage = errorData?.details || errorData?.error || 'El servidor devolvió un error.';
                alert(`Error al subir la imagen: ${errorMessage}`);
                return;
            }
        }

        const response = await fetch(`${backendUrl}/perfumes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre: nombre.value.trim(),
                precio: Number(precio.value),
                imagen: imagePath,
                categoria: categoria.value,
                marca: marca.value
            })
        })

        if (response.ok) {
            alert('Perfume agregado exitosamente')
            // Limpiar formulario
            nombre.value = ''
            precio.value = ''
            marca.value = ''
            categoria.value = ''
            imageFile.value = null
            imagePreview.value = ''
            // La variable 'imagen' ya no se usa en el formulario, pero la limpiamos por si acaso.
            imagen.value = ''
        } else {
            alert('Error al guardar el perfume')
        }
    } catch (error) {
        console.error(error)
        alert('Error de conexión')
    }
}

const fetchPerfumesForDelete = async () => {
    deletePerfumeId.value = '' // Resetear selección de perfume
    if (!deleteMarca.value) {
        perfumesToDelete.value = []
        return
    }
    try {
        const response = await fetch(`${backendUrl}/perfumes?marca=${encodeURIComponent(deleteMarca.value)}`)
        if (response.ok) {
            const data = await response.json()
            // FORZAMOS LA CONVERSIÓN A OBJETOS SIMPLES:
            // Esto soluciona el problema del ID, asegurando que sea tratado como texto plano
            // y no como un objeto complejo que pueda dar error en la URL.
            perfumesToDelete.value = JSON.parse(JSON.stringify(data));
        }
    } catch (error) {
        console.error('Error cargando perfumes para eliminar:', error)
        perfumesToDelete.value = [] // Limpiamos la lista si hay un error
    }
}

const eliminarPerfume = async () => {
    if (!deletePerfumeId.value) return
    if (!confirm('¿Estás seguro de que quieres eliminar este perfume? Esta acción no se puede deshacer.')) return

    try {
        const response = await fetch(`${backendUrl}/perfumes/${deletePerfumeId.value}`, { method: 'DELETE' })
        if (response.ok) {
            alert('Perfume eliminado correctamente')
            fetchPerfumesForDelete() // Recargar la lista
        } else {
            alert('Error al eliminar el perfume')
        }
    } catch (error) {
        console.error(error)
        alert('Error de conexión')
    }
}
</script>

<template>
    <div class="bg-stone-900 min-h-screen text-stone-200 py-20 px-6">
        <div class="max-w-7xl mx-auto">
            <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mb-12">
                <h1 class="text-3xl md:text-4xl font-bold text-amber-500 uppercase tracking-widest text-center sm:text-left">Panel de Gestión</h1>
                <button @click="handleLogout" class="bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-sm uppercase tracking-widest text-xs sm:text-sm transition-colors">Cerrar Sesión</button>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <!-- SECCIÓN AGREGAR PERFUME -->
            <div class="bg-stone-800 p-8 border border-stone-700 rounded-sm shadow-2xl">
                <h2 class="text-2xl font-bold text-amber-500 mb-8 text-center uppercase tracking-widest">Agregar Nuevo Perfume</h2>
                
                <form @submit.prevent="agregarPerfume" class="space-y-6">
                    <div>
                        <label class="block text-stone-400 text-xs uppercase tracking-wider mb-2">Nombre del Perfume</label>
                        <input v-model="nombre" type="text" class="w-full bg-stone-900 border border-stone-600 p-3 text-stone-200 focus:border-amber-600 focus:outline-none" placeholder="Ej: Blue Seduction" required />
                    </div>
                    
                    <div>
                        <label class="block text-stone-400 text-xs uppercase tracking-wider mb-2">Imagen del Perfume</label>
                        <div 
                            class="border-2 border-dashed border-stone-600 hover:border-amber-600 bg-stone-900/50 rounded-sm p-6 text-center cursor-pointer transition-all relative group"
                            @click="$refs.fileInput.click()"
                            @dragover.prevent
                            @drop.prevent="handleImageSelect"
                        >
                            <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleImageSelect" />
                            
                            <div v-if="imagePreview" class="aspect-[3/4] w-32 mx-auto overflow-hidden bg-stone-800 mb-4 border border-stone-600 rounded-sm">
                                <img :src="imagePreview" class="w-full h-full object-cover" />
                            </div>
                            
                            <p class="text-stone-500 text-sm group-hover:text-stone-300 transition-colors">
                                {{ imageFile ? imageFile.name : 'Arrastra una imagen o haz clic aquí' }}
                            </p>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-stone-400 text-xs uppercase tracking-wider mb-2">Precio ($)</label>
                            <input v-model="precio" type="number" class="w-full bg-stone-900 border border-stone-600 p-3 text-stone-200 focus:border-amber-600 focus:outline-none" placeholder="Ej: 15000" required />
                        </div>
                        <div>
                            <label class="block text-stone-400 text-xs uppercase tracking-wider mb-2">Marca / Sección</label>
                            <select v-model="marca" class="w-full bg-stone-900 border border-stone-600 p-3 text-stone-200 focus:border-amber-600 focus:outline-none">
                                <option disabled value="">Selecciona una marca</option>
                                <option v-for="m in marcasDisponibles" :key="m" :value="m">{{ m }}</option>
                            </select>
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-stone-400 text-xs uppercase tracking-wider mb-2">Categoría (Género)</label>
                            <select v-model="categoria" class="w-full bg-stone-900 border border-stone-600 p-3 text-stone-200 focus:border-amber-600 focus:outline-none" required>
                                <option disabled value="">Selecciona género</option>
                                <option value="Masculino">Masculino</option>
                                <option value="Femenino">Femenino</option>
                                <option value="Unisex">Unisex</option>
                            </select>
                        </div>
                    </div>


                    <div class="pt-4">
                        <button type="submit" class="w-full bg-amber-700 hover:bg-amber-600 text-white font-bold py-4 uppercase tracking-widest transition-colors shadow-lg">
                            Guardar en Base de Datos
                        </button>
                    </div>
                </form>
            </div>

            <!-- SECCIÓN ELIMINAR PERFUME -->
            <div class="bg-stone-800 p-8 border border-stone-700 rounded-sm shadow-2xl">
                <h2 class="text-2xl font-bold text-red-500 mb-8 text-center uppercase tracking-widest">Eliminar Perfume</h2>
                
                <div class="space-y-6">
                    <div>
                        <label class="block text-stone-400 text-xs uppercase tracking-wider mb-2">1. Selecciona Marca para filtrar</label>
                        <select v-model="deleteMarca" @change="fetchPerfumesForDelete" class="w-full bg-stone-900 border border-stone-600 p-3 text-stone-200 focus:border-red-600 focus:outline-none">
                            <option disabled value="">Selecciona una marca</option>
                            <option v-for="m in marcasDisponibles" :key="m" :value="m">{{ m }}</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-stone-400 text-xs uppercase tracking-wider mb-2">2. Selecciona Perfume a eliminar</label>
                        <select v-model="deletePerfumeId" :disabled="!deleteMarca" class="w-full bg-stone-900 border border-stone-600 p-3 text-stone-200 focus:border-red-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed">
                            <option disabled value="">{{ deleteMarca ? 'Selecciona un perfume' : 'Primero selecciona una marca' }}</option>
                            <option v-for="p in perfumesToDelete" :key="p._id" :value="p._id">{{ p.nombre }}</option>
                        </select>
                    </div>

                    <button @click="eliminarPerfume" :disabled="!deletePerfumeId" class="w-full bg-red-900 hover:bg-red-700 text-white font-bold py-4 uppercase tracking-widest transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                        Eliminar Perfume Definitivamente
                    </button>
                </div>
            </div>
            </div>
        </div>
    </div>
</template>