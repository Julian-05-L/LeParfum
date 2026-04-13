import { ref, computed, watch, onMounted, onUnmounted, isRef } from 'vue';

export function usePerfumes(marcaSource) {
    const perfumes = ref([]);
    const loading = ref(true);
    // Usamos window.location.hostname para detectar la IP de tu red automáticamente
    const rawUrl = import.meta.env.VITE_API_URL || '/api';
    let backendUrl = rawUrl.replace(/\/$/, ""); // Elimina barra final si existe
    if (backendUrl && !backendUrl.startsWith('http') && !backendUrl.startsWith('/')) {
        backendUrl = `https://${backendUrl}`;
    }
    const cart = ref([]);
    const selectedPerfume = ref(null);
    const showModal = ref(false);
    const showCart = ref(false);
    const isAdmin = ref(false);
    const showEditModal = ref(false);
    const editingPerfume = ref({});
    const showAddModal = ref(false);
    const newPerfume = ref({});
    const imageFile = ref(null);
    const imagePreview = ref('');

    const getPerfumes = async () => {
        try {
            loading.value = true;
            const marca = isRef(marcaSource) ? marcaSource.value : marcaSource;
            const response = await fetch(`${backendUrl}/perfumes?marca=${encodeURIComponent(marca)}`);
            
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) throw new Error("La respuesta del servidor no es válida");

            const data = await response.json();
            // Filtro de seguridad: Solo aceptamos perfumes cuya marca sea IDÉNTICA a la solicitada.
            // Esto evita que se cuelen perfumes de otras categorías si el backend falla.
            perfumes.value = data.filter(p => p.marca?.trim().toLowerCase() === marca.trim().toLowerCase());
        } catch (error) {
            console.error('Error al obtener los perfumes:', error);
        } finally {
            loading.value = false;
        }
    };

    const checkAdmin = () => {
        isAdmin.value = localStorage.getItem('isAdmin') === 'true';
    };

    // Función para construir la URL de la imagen dinámicamente
    const getImageUrl = (imagenPath) => {
        if (!imagenPath) return '';
        let path = imagenPath.trim();

        if (path.startsWith('http')) {
            return path;
        }
        // Forzamos que siempre apunte al backend, incluso si empieza con /
        return `${backendUrl}/${path.replace(/^\//, "")}`;
    };

    const openModal = (perfume) => {
        selectedPerfume.value = perfume;
        showModal.value = true;
    };

    const openEditModal = (perfume) => {
        editingPerfume.value = { ...perfume }; // Crear una copia para editar
        imageFile.value = null; // Resetear archivo seleccionado
        imagePreview.value = ''; // Resetear previsualización
        showEditModal.value = true;
    };

    const openAddModal = () => {
        newPerfume.value = {
            nombre: '',
            marca: isRef(marcaSource) ? marcaSource.value : marcaSource,
            precio: '',
            categoria: 'Masculino',
            imagen: ''
        };
        imageFile.value = null;
        imagePreview.value = '';
        showAddModal.value = true;
    };

    const handleImageSelect = (event) => {
        // Soporta tanto input file como drag & drop
        const file = event.target.files ? event.target.files[0] : event.dataTransfer.files[0];
        
        if (file) {
            imageFile.value = file;
            // Crear URL local para previsualización inmediata
            imagePreview.value = URL.createObjectURL(file);
        }
    };

    const createPerfume = async () => {
        if (!isAdmin.value) return;

        try {
            if (imageFile.value) {
                const formData = new FormData();
                formData.append('image', imageFile.value);

                const uploadResponse = await fetch(`${backendUrl}/upload`, {
                    method: 'POST',
                    body: formData
                });

                if (uploadResponse.ok) {
                    const uploadData = await uploadResponse.json();
                    newPerfume.value.imagen = uploadData.path;
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
                body: JSON.stringify(newPerfume.value)
            });

            if (response.ok) {
                await getPerfumes();
                showAddModal.value = false;
                newPerfume.value = {
                    nombre: '',
                    // Limpiamos todos los campos para el siguiente perfume
                    marca: '',
                    precio: '',
                    categoria: 'Masculino',
                    imagen: ''
                };
                imageFile.value = null;
                imagePreview.value = '';
                alert('Perfume agregado correctamente');
            } else {
                alert('Error al agregar el perfume');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
        }
    };

    const updatePerfume = async () => {
        if (!isAdmin.value) return; // Validación de seguridad: solo admin

        try {
            // 1. Si hay una imagen nueva seleccionada, la subimos primero
            if (imageFile.value) {
                const formData = new FormData();
                formData.append('image', imageFile.value);

                const uploadResponse = await fetch(`${backendUrl}/upload`, {
                    method: 'POST',
                    body: formData
                });

                if (uploadResponse.ok) {
                    const uploadData = await uploadResponse.json();
                    editingPerfume.value.imagen = uploadData.path; // Actualizamos la ruta en el objeto
                } else {
                    const errorData = await uploadResponse.json().catch(() => null);
                    const errorMessage = errorData?.details || errorData?.error || 'El servidor devolvió un error.';
                    alert(`Error al subir la imagen: ${errorMessage}`);
                    return;
                }
            }

            const response = await fetch(`${backendUrl}/perfumes/${editingPerfume.value._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingPerfume.value)
            });

            if (response.ok) {
                await getPerfumes(); // Recargar desde la Base de Datos
                showEditModal.value = false;
                alert('Perfume actualizado correctamente');
            } else {
                alert('Error al actualizar el perfume');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
        }
    };

    const addToCart = () => {
        if (selectedPerfume.value) {
            cart.value.push(selectedPerfume.value);
            showModal.value = false;
        }
    };

    const removeFromCart = (index) => {
        cart.value.splice(index, 1);
    };

    const cartTotal = computed(() => {
        return cart.value.reduce((total, item) => total + Number(item.precio), 0);
    });

    const confirmPurchase = () => {
        const phoneNumber = "5493564503797"; 
        let message = "Hola! Quiero realizar la siguiente compra en Le Parfum:\n\n";
        
        cart.value.forEach(item => {
            message += `- ${item.nombre}: $${item.precio}\n`;
        });
        
        message += `\n*Total: $${cartTotal.value}*`;
        
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    };

    // Bloquear el scroll del fondo cuando hay un modal abierto
    watch([showModal, showCart, showEditModal, showAddModal], ([isModalOpen, isCartOpen, isEditOpen, isAddOpen]) => {
        if (isModalOpen || isCartOpen || isEditOpen || isAddOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    });

    // Si la marca es reactiva (viene de una ruta dinámica), recargar cuando cambie
    if (isRef(marcaSource)) {
        watch(marcaSource, () => {
            getPerfumes();
        });
    }

    onMounted(() => {
        getPerfumes();
        checkAdmin();
    });

    onUnmounted(() => {
        document.body.style.overflow = '';
    });

    return {
        perfumes,
        loading,
        cart,
        selectedPerfume,
        showModal,
        showCart,
        isAdmin,
        showEditModal,
        editingPerfume,
        showAddModal,
        newPerfume,
        imageFile,
        imagePreview,
        getImageUrl,
        openModal,
        openEditModal,
        openAddModal,
        handleImageSelect,
        updatePerfume,
        createPerfume,
        addToCart,
        removeFromCart,
        cartTotal,
        confirmPurchase
    };
}