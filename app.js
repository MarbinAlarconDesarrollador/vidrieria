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
const overlay = document.getElementById('product-overlay');

// --- 2. NAVEGACIÓN ---
function showSection(sectionId) {
    const sections = ['simulador', 'galeria', 'contacto'];
    sections.forEach(id => document.getElementById(id).style.display = 'none');
    
    const activeSec = document.getElementById(sectionId);
    activeSec.style.display = 'block';

    if(sectionId === 'galeria') cargarGaleria();
    if(sectionId === 'simulador') {
        startCamera();
        filterProducts('espejo-luz');
    }
    
    // Scroll suave a la sección
    window.scrollTo({ top: document.querySelector('.glass-nav').offsetTop, behavior: 'smooth' });
}

// --- 3. LÓGICA DEL SIMULADOR ---
function filterProducts(category) {
    const container = document.getElementById('product-list');
    container.innerHTML = '';
    catalog[category].forEach(prod => {
        const item = document.createElement('div');
        item.className = 'product-item';
        item.innerHTML = `
            <img src="img/catalog/${prod.views[0]}" onclick="changeProduct('${category}', ${prod.id})">
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
// --- 4. CÁMARA ---
async function startCamera() {
    const video = document.getElementById('camera-feed');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = stream;
    } catch (err) {
        console.error("Cámara no disponible");
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
    overlay.style.transform = `translate(-50%, -50%) translate3d(${currentX}px, ${currentY}px, 0) scale(${currentScale})`;
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

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registrado correctamente', reg))
            .catch(err => console.warn('Error al registrar el Service Worker', err));
    });
}