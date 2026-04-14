// --- 1. CONFIGURACIÓN DEL CATÁLOGO ---
const catalog = {
    'espejo-luz': [
        { id: 1, name: 'Espejo Aura', views: ['aura-1.png', 'aura-2.png', 'aura-3.png'], currentViewIndex: 0 },
        { id: 2, name: 'Espejo Neon', views: ['neon-frente.png', 'neon-lateral.png'], currentViewIndex: 0 }
    ],
    'divisiones': [
        { id: 101, name: 'Templado 8mm', views: ['division1.png'], currentViewIndex: 0 }
    ],
    'ventanas': [
        { id: 201, name: 'Ventana S-20', views: ['ventana1.png'], currentViewIndex: 0 }
    ],
    'espejo-simple': [
        { id: 301, name: 'Minimalist', views: ['espejo1.png'], currentViewIndex: 0 }
    ]
};

let activeProduct = null;
let currentRotation = 0;
const overlay = document.getElementById('product-overlay');

// --- 2. NAVEGACIÓN ---
function executeShowSection(sectionId) {
    const sections = ['simulador', 'galeria', 'videos', 'contacto', 'admin'];
    // Secciones adicionales que queremos ocultar en el modo Admin
    const servicios = document.getElementById('servicios');
    const proceso = document.getElementById('proceso');
    // Ocultar todo
    sections.forEach(id => {
        const sec = document.getElementById(id);
        if (sec) sec.style.display = 'none';
    });

    // Mostrar sección activa
    const activeSec = document.getElementById(sectionId);
    if (activeSec) activeSec.style.display = 'block';

    // Lógica por sección
    if (sectionId === 'galeria') {
        if (servicios) servicios.style.display = 'none';
        if (proceso) proceso.style.display = 'none';
        cargarGaleria();
    }
    else if (sectionId === 'simulador') {
        if (servicios) servicios.style.display = 'none';
        if (proceso) proceso.style.display = 'none';
        filterProducts('espejo-luz');
        // El delay de 300ms es CLAVE para que el navegador vea el elemento visible antes de pedir cámara
        setTimeout(() => {
            startCamera();
        }, 300);
    } else if (sectionId === 'admin') {
        if (servicios) servicios.style.display = 'none';
        if (proceso) proceso.style.display = 'none';
        // Aquí podrías cargar datos de productos, estadísticas, etc.
        //console.log("Sección Admin - Aquí va la lógica administrativa");
        updateAdminUI(); // <-- Nueva llamada para pintar los datos
        stopCamera();
    } else if (sectionId === 'videos') {
        if (servicios) servicios.style.display = 'none';
        if (proceso) proceso.style.display = 'none';
        togglePlay(document.querySelector('.video-card')); // Pausar cualquier video activoSSSS
    } else {
        stopCamera();
    }

    // Scroll al menú
    const nav = document.querySelector('.glass-nav');
    if (nav) window.scrollTo({ top: nav.offsetTop, behavior: 'smooth' });
}

// --- 3. LÓGICA DEL SIMULADOR ---
function filterProducts(category) {
    // 1. GESTIÓN VISUAL: Iluminar el botón seleccionado
    const buttons = document.querySelectorAll('.category-menu button');
    buttons.forEach(btn => {
        // Buscamos el botón que tiene la categoría que acabamos de tocar
        if (btn.getAttribute('onclick').includes(`'${category}'`)) {
            btn.classList.add('active-cat');
        } else {
            btn.classList.remove('active-cat');
        }
    });

    // 2. RENDERIZADO: Tu lógica original corregida
    const container = document.getElementById('product-list');
    container.innerHTML = '';

    // Verificamos que la categoría exista en el catálogo para evitar errores
    if (!catalog[category]) return;

    catalog[category].forEach(prod => {
        const item = document.createElement('div');
        // Usamos 'product-item' como tienes en tu base
        item.className = 'product-item'; 
        
        item.innerHTML = `
            <img src="img/catalog/${prod.views[0]}" 
                 onclick="changeProduct('${category}', ${prod.id})" 
                 alt="${prod.name}"
                 style="cursor:pointer;">
            <span>${prod.name}</span>
        `;
        container.appendChild(item);
    });
}



function changeProduct(category, productId) {
    activeProduct = catalog[category].find(p => p.id === productId);
    if (!activeProduct) return;

    activeProduct.currentViewIndex = 0;
    const overlay = document.getElementById('product-overlay');

    // Ruta corregida para evitar errores de net::ERR_FILE_NOT_FOUND
    overlay.src = `img/catalog/${activeProduct.views[0]}`;
    overlay.style.opacity = 1;

    // Lógica del Botón 3D
    const btn3D = document.getElementById('btn-3d');
    if (activeProduct.views && activeProduct.views.length > 1) {
        btn3D.style.display = 'flex'; // Mostrar si tiene múltiples vistas
    } else {
        btn3D.style.display = 'none';
    }
}

function rotateProductView() {
    if (!activeProduct || !activeProduct.views) return;

    activeProduct.currentViewIndex = (activeProduct.currentViewIndex + 1) % activeProduct.views.length;
    const overlay = document.getElementById('product-overlay');

    overlay.style.opacity = 0;
    setTimeout(() => {
        overlay.src = `img/catalog/${activeProduct.views[activeProduct.currentViewIndex]}`;
        overlay.style.opacity = 1;
    }, 150);
}

function rotateProduct(degrees) {
    const overlay = document.getElementById('product-overlay');
    if (!overlay || !overlay.src || overlay.style.opacity === "0") return;

    currentRotation += degrees;
    
    // 1. Obtenemos todo el transform que la imagen tenga en este momento (su posición actual)
    let currentTransform = overlay.style.transform || '';
    
    // 2. Limpiamos CUALQUIER rotación anterior con una pequeña expresión regular.
    // Esto es magia pura: borra el giro viejo pero NO borra la posición a donde arrastraste.
    currentTransform = currentTransform.replace(/rotate\([^)]+\)/g, '').trim();
    
    // 3. Le aplicamos su posición original intacta + los nuevos grados de rotación
    overlay.style.transform = `${currentTransform} rotate(${currentRotation}deg)`;
    
    document.getElementById('rotation-display').innerText = `${currentRotation}°`;
}



function resetProduct() {
    currentRotation = 0;
    const overlay = document.getElementById('product-overlay');
    if (overlay) {
        // Volvemos a centrar todo y quitamos rotaciones
        overlay.style.top = '50%';
        overlay.style.left = '50%';
        overlay.style.transform = `translate(-50%, -50%)`;
        document.getElementById('rotation-display').innerText = `0°`;
    }
}

// --- 4. CÁMARA ---
async function startCamera() {
    const video = document.getElementById('camera-feed');
    if (!video) return;

    // Intentamos primero la cámara trasera con alta resolución
    const constraints = {
        video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 }
        },
        audio: false
    };

    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;

        // Atributos vitales para que iOS/Android no bloqueen el video
        video.setAttribute('playsinline', true);
        video.setAttribute('muted', true);

        // Forzamos el play
        await video.play();
        console.log("Cámara activa");
    } catch (err) {
        console.error("Error cámara:", err);
        alert("Asegúrate de dar permiso a la cámara en el navegador.");
    }
}

function stopCamera() {
    const video = document.getElementById('camera-feed');
    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
}
// --- 5. INTERACCIÓN TÁCTIL (ARRASTRE Y ESCALA) ---
let currentX = 0, currentY = 0, currentScale = 1;
let startX, startY, initialDistance = 0;

overlay.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        startX = e.touches[0].clientX - currentX;
        startY = e.touches[0].clientY - currentY;
    } else if (e.touches.length === 2) {
        initialDistance = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
    }
});

overlay.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
        currentX = e.touches[0].clientX - startX;
        currentY = e.touches[0].clientY - startY;
    } else if (e.touches.length === 2) {
        const dist = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
        currentScale *= (dist / initialDistance);
        currentScale = Math.max(0.3, Math.min(currentScale, 3));
        initialDistance = dist;
    }
    //overlay.style.transform = `translate(-50%, -50%) translate3d(${currentX}px, ${currentY}px, 0) scale(${currentScale})`;
    // ... (dentro de touchmove, al final)
overlay.style.transform = `translate(-50%, -50%) translate3d(${currentX}px, ${currentY}px, 0) scale(${currentScale}) rotate(${currentRotation}deg)`;

});




// --- 6. GALERÍA ---
const trabajos = [
    { src: 'trabajo1.png', title: 'División Templada' },
    { src: 'trabajo2.png', title: 'Espejo LED Luxury' },
    { src: 'trabajo3.png', title: 'Fachada Comercial' }
];

function cargarGaleria() {
    const contenedor = document.getElementById('accordion-galeria');
    contenedor.innerHTML = '';
    trabajos.forEach((t, i) => {
        const item = document.createElement('div');
        item.className = `accordion-item ${i === 0 ? 'active' : ''}`;
        item.innerHTML = `<img src="img/galeria/${t.src}"><div class="accordion-content"><h3>${t.title}</h3></div>`;
        item.onclick = () => {
            document.querySelectorAll('.accordion-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
        };
        contenedor.appendChild(item);
    });
}

function togglePlay(wrapper) {
    const video = wrapper.querySelector('video');
    const card = wrapper.parentElement;

    if (video.paused) {
        // Pausar todos los demás videos antes de reproducir este
        document.querySelectorAll('video').forEach(v => v.pause());
        video.play();
        card.classList.remove('paused');
    } else {
        video.pause();
        card.classList.add('paused');
    }
}


function toggleMute(event, btn) {
    // Evita que el clic active también el togglePlay del contenedor
    event.stopPropagation();

    const video = btn.parentElement.querySelector('video');
    const icon = btn.querySelector('.mute-icon');

    if (video.muted) {
        video.muted = false;
        icon.innerText = '🔊';
        btn.style.background = 'var(--accent)'; // Color activo
    } else {
        video.muted = true;
        icon.innerText = '🔇';
        btn.style.background = 'rgba(0, 0, 0, 0.5)'; // Color apagado
    }
}

// Modificamos ligeramente la función de Play para asegurar que el mute se respete
function togglePlay(wrapper) {
    const video = wrapper.querySelector('video');
    const card = wrapper.closest('.video-card-reels');

    if (video.paused) {
        video.play();
        card.classList.remove('paused');
    } else {
        video.pause();
        card.classList.add('paused');
    }
}

// --- 7. LÓGICA ADMINISTRATIVA (LOCALSTORAGE) ---

// Cargar transacciones existentes o iniciar vacío
let transactions = JSON.parse(localStorage.getItem('vidrios_transactions')) || [];
let currentFilter = 'all'; // Inicia mostrando todo el histórico

function addTransaction(e) {
    e.preventDefault(); // Evita que la página recargue

    const desc = document.getElementById('t-desc').value;
    const amount = parseFloat(document.getElementById('t-amount').value);
    const type = document.getElementById('t-type').value;

    // Obtener fecha actual en formato legible
    const dateObj = new Date();
    const date = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;

    // Crear el objeto de transacción
    const newTransaction = {
        id: Date.now(), // ID único basado en el timestamp
        desc,
        amount,
        type,
        date
    };

    // Guardar y actualizar
    transactions.push(newTransaction);
    localStorage.setItem('vidrios_transactions', JSON.stringify(transactions));

    e.target.reset(); // Limpiar el formulario
    updateAdminUI(); // Refrescar la tabla
}

function deleteTransaction(id) {
    const confirmPass = prompt("🔑 AUTORIZACIÓN REQUERIDA\nIngrese la clave para ELIMINAR este registro:");

    if (confirmPass === ADMIN_DELETE_KEY) {
        transactions = transactions.filter(t => t.id !== id);
        localStorage.setItem('vidrios_transactions', JSON.stringify(transactions));
        updateAdminUI();
        // Notificación discreta
        console.log("Registro eliminado");
    } else if (confirmPass !== null) {
        alert("❌ Clave incorrecta. Acción cancelada.");
    }
}

function updateAdminUI() {
    const tbody = document.getElementById('t-body');
    tbody.innerHTML = '';

    let totalIncome = 0;
    let totalExpense = 0;

    // Constantes de tiempo para los filtros
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000);
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. FILTRAR los datos según el botón seleccionado
    const filteredTransactions = transactions.filter(t => {
        const tDate = new Date(t.id); // Convertimos el ID (timestamp) a Fecha

        if (currentFilter === 'daily') {
            return t.id >= todayStart; // Desde las 00:00 de hoy
        } else if (currentFilter === 'weekly') {
            return t.id >= sevenDaysAgo; // Últimos 7 días exactos
        } else if (currentFilter === 'monthly') {
            // Coincide el mes y el año actual
            return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
        }
        return true; // 'all' - Histórico completo
    });

    // 2. ORDENAR de más reciente a más antiguo
    const sortedTransactions = filteredTransactions.sort((a, b) => b.id - a.id);

    // 3. PINTAR en la tabla y sumar
    sortedTransactions.forEach(t => {
        if (t.type === 'ingreso') {
            totalIncome += t.amount;
        } else {
            totalExpense += t.amount;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${t.date}</td>
            <td>${t.desc}</td>
            <td><span class="badge ${t.type}">${t.type === 'ingreso' ? 'Ingreso' : 'Gasto'}</span></td>
            <td>$${t.amount.toLocaleString('es-CO')}</td>
            <td><button class="btn-delete" onclick="deleteTransaction(${t.id})">Borrar</button></td>
        `;
        tbody.appendChild(tr);
    });

    // 4. ACTUALIZAR las tarjetas del Dashboard
    document.getElementById('total-income').innerText = totalIncome.toLocaleString('es-CO');
    document.getElementById('total-expense').innerText = totalExpense.toLocaleString('es-CO');
    document.getElementById('total-balance').innerText = (totalIncome - totalExpense).toLocaleString('es-CO');
}

function applyFilter(filterType, btnElement) {
    currentFilter = filterType;

    // Actualizar visualmente el botón activo
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (btnElement) {
        btnElement.classList.add('active');
    }

    // Refrescar la tabla y los números
    updateAdminUI();
}


// --- 8. SEGURIDAD ADMIN (LOCAL) ---
const ADMIN_KEY = "1234"; // Define aquí tu contraseña maestra
const ADMIN_DELETE_KEY = "0000"; // Clave para borrar registros (puedes usar la misma si prefieres)

let isAdminAuthenticated = false;

// Añade esto después de definir isAdminAuthenticated
document.addEventListener('DOMContentLoaded', () => {
    const passInput = document.getElementById('admin-pass');
    if (passInput) {
        passInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                checkAdminPassword();
            }
        });
    }
});

function checkAdminPassword() {
    const passInput = document.getElementById('admin-pass');
    if (passInput.value === ADMIN_KEY) {
        isAdminAuthenticated = true;
        document.getElementById('admin-login').style.display = 'none';
        executeShowSection('admin'); // Procede a mostrar la sección
    } else {
        alert("Contraseña incorrecta");
    }
    passInput.value = "";
}

function cancelLogin() {
    document.getElementById('admin-login').style.display = 'none';
    showSection('simulador'); // Redirigir si cancela
}

// Modificamos showSection para que actúe como guardián
function showSection(sectionId) {
    if (sectionId === 'admin' && !isAdminAuthenticated) {
        document.getElementById('admin-login').style.display = 'flex';
        return; // Detiene la navegación hasta que se autentique
    }
    executeShowSection(sectionId);
}

function logoutAdmin() {
    // 1. Resetear el estado de autenticación
    isAdminAuthenticated = false;

    // 2. Limpiar el campo de contraseña del modal por seguridad
    document.getElementById('admin-pass').value = "";

    // 3. Redirigir a la sección principal (Simulador)
    showSection('simulador');

    // 4. Opcional: Feedback visual
    console.log("Sesión administrativa cerrada");
}

// --- 9. EXPORTAR DATOS A CSV (EXCEL) ---
function exportToCSV() {
    if (transactions.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }

    // Definir encabezados
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Fecha,Descripcion,Tipo,Monto\n";

    // Recorrer transacciones y dar formato
    transactions.forEach(t => {
        // Limpiamos la descripción de comas para no romper el CSV
        const cleanDesc = t.desc.replace(/,/g, ".");
        const row = `${t.date},${cleanDesc},${t.type.toUpperCase()},${t.amount}`;
        csvContent += row + "\n";
    });

    // Crear el enlace de descarga
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);

    // Nombre del archivo con fecha actual
    const fechaDescarga = new Date().toLocaleDateString().replace(/\//g, "-");
    link.setAttribute("download", `Reporte_VidriosApp_${fechaDescarga}.csv`);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function toggleMenu() {
    const menu = document.getElementById('nav-menu');
    const toggle = document.getElementById('mobile-menu');

    // Alternamos la clase 'active'
    menu.classList.toggle('active');

    // Animación opcional de la X en la hamburguesa
    toggle.classList.toggle('is-active');
}

function navAction(section) {
    // 1. Ejecutamos el cambio de sección
    showSection(section);

    // 2. Cerramos el menú si estamos en móvil
    const menu = document.getElementById('nav-menu');
    if (menu.classList.contains('active')) {
        toggleMenu();
    }
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registrado correctamente', reg))
            .catch(err => console.warn('Error al registrar el Service Worker', err));
    });
}

