/*
    BUBBLE BOBBLE - Por Ciro
    ========================

    Ciro: Este es el archivo JavaScript. Es el "cerebro" del juego.
    Aquí decimos QUÉ HACE cada cosa: cómo se mueve Bub, qué pasa
    cuando presionas una tecla, etc.

    Es como los bloques de código en Scratch, pero escrito con texto.
*/

// ===========================================
// PASO 1: Preparar el "lienzo" (canvas)
// ===========================================

// Obtenemos el canvas (el rectángulo donde vamos a dibujar)
const canvas = document.getElementById('juego');

// El "contexto" es como nuestro pincel para dibujar
const ctx = canvas.getContext('2d');

// ===========================================
// PASO 2: Crear a nuestro personaje BUB
// ===========================================

// En Scratch tendrías un "sprite". Aquí creamos un "objeto" con sus propiedades.
// Un objeto es como una cajita que guarda información relacionada.

const bub = {
    x: 100,           // Posición horizontal (como "x" en Scratch)
    y: 300,           // Posición vertical (como "y" en Scratch)
    ancho: 32,        // Qué tan ancho es Bub
    alto: 32,         // Qué tan alto es Bub
    velocidadX: 0,    // Velocidad horizontal (positivo = derecha, negativo = izquierda)
    velocidadY: 0,    // Velocidad vertical (positivo = abajo, negativo = arriba)
    enElSuelo: false, // ¿Está tocando el suelo?
    color: '#88ff88'  // Color verde clarito (después pondremos un dibujo)
};

// ===========================================
// PASO 3: Constantes del juego (configuración)
// ===========================================

const GRAVEDAD = 0.5;        // Qué tan fuerte jala hacia abajo
const VELOCIDAD_MOVIMIENTO = 5;  // Qué tan rápido se mueve Bub
const FUERZA_SALTO = -12;    // Qué tan alto salta (negativo porque arriba es menos Y)
const SUELO_Y = 440;         // Dónde está el suelo

// ===========================================
// PASO 3.5: Las plataformas
// ===========================================

/*
    Ciro: Esto es un ARRAY (o "lista" en Scratch).
    Es como tener varios sprites de plataforma, cada uno con su posición.

    Cada plataforma tiene: x, y, ancho, alto

    En el Bubble Bobble original, las plataformas están distribuidas
    de forma simétrica para que el juego sea justo.
*/

const plataformas = [
    // Plataformas de abajo (nivel 1)
    { x: 0, y: 380, ancho: 150, alto: 16 },
    { x: 362, y: 380, ancho: 150, alto: 16 },

    // Plataformas del medio (nivel 2)
    { x: 80, y: 300, ancho: 150, alto: 16 },
    { x: 282, y: 300, ancho: 150, alto: 16 },

    // Plataformas de arriba (nivel 3)
    { x: 0, y: 220, ancho: 150, alto: 16 },
    { x: 362, y: 220, ancho: 150, alto: 16 },

    // Plataforma central superior
    { x: 180, y: 140, ancho: 152, alto: 16 }
];

// ===========================================
// PASO 4: Detectar teclas presionadas
// ===========================================

// Este objeto recuerda qué teclas están presionadas
// Es como el bloque "¿tecla presionada?" de Scratch
const teclas = {
    izquierda: false,
    derecha: false,
    arriba: false,
    espacio: false
};

// Cuando el jugador PRESIONA una tecla
document.addEventListener('keydown', function(evento) {
    if (evento.key === 'ArrowLeft') {
        teclas.izquierda = true;
    }
    if (evento.key === 'ArrowRight') {
        teclas.derecha = true;
    }
    if (evento.key === 'ArrowUp') {
        teclas.arriba = true;
    }
    if (evento.key === ' ') {
        teclas.espacio = true;
    }
});

// Cuando el jugador SUELTA una tecla
document.addEventListener('keyup', function(evento) {
    if (evento.key === 'ArrowLeft') {
        teclas.izquierda = false;
    }
    if (evento.key === 'ArrowRight') {
        teclas.derecha = false;
    }
    if (evento.key === 'ArrowUp') {
        teclas.arriba = false;
    }
    if (evento.key === ' ') {
        teclas.espacio = false;
    }
});

// ===========================================
// PASO 5: Actualizar el juego (la lógica)
// ===========================================

// Esta función se ejecuta muchas veces por segundo (como "por siempre" en Scratch)
function actualizar() {
    // --- Movimiento horizontal ---
    if (teclas.izquierda) {
        bub.velocidadX = -VELOCIDAD_MOVIMIENTO;
    } else if (teclas.derecha) {
        bub.velocidadX = VELOCIDAD_MOVIMIENTO;
    } else {
        bub.velocidadX = 0;  // Si no presiona nada, se detiene
    }

    // --- Salto ---
    // Solo puede saltar si está en el suelo (para no volar infinito)
    if (teclas.arriba && bub.enElSuelo) {
        bub.velocidadY = FUERZA_SALTO;
        bub.enElSuelo = false;
    }

    // --- Aplicar gravedad ---
    // La gravedad siempre jala hacia abajo (aumenta velocidadY)
    bub.velocidadY = bub.velocidadY + GRAVEDAD;

    // --- Mover a Bub ---
    bub.x = bub.x + bub.velocidadX;
    bub.y = bub.y + bub.velocidadY;

    // --- Colisión con el suelo ---
    if (bub.y + bub.alto > SUELO_Y) {
        bub.y = SUELO_Y - bub.alto;  // Ponerlo justo encima del suelo
        bub.velocidadY = 0;           // Detener la caída
        bub.enElSuelo = true;
    }

    // --- No salirse por los lados ---
    if (bub.x < 0) {
        bub.x = 0;
    }
    if (bub.x + bub.ancho > canvas.width) {
        bub.x = canvas.width - bub.ancho;
    }
}

// ===========================================
// PASO 6: Dibujar todo en pantalla
// ===========================================

function dibujar() {
    // Primero limpiamos todo (como "borrar todo" en Scratch)
    ctx.fillStyle = '#15138a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar el suelo
    ctx.fillStyle = '#444444';
    ctx.fillRect(0, SUELO_Y, canvas.width, canvas.height - SUELO_Y);

    // Dibujar a Bub (por ahora es un cuadrado, luego lo haremos bonito)
    ctx.fillStyle = bub.color;
    ctx.fillRect(bub.x, bub.y, bub.ancho, bub.alto);

    // Dibujar instrucciones
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.fillText('Flechas: mover | Arriba: saltar', 10, 25);
}

// ===========================================
// PASO 7: El bucle principal del juego
// ===========================================

// Esta función se ejecuta aproximadamente 60 veces por segundo
// Es como el bloque "por siempre" de Scratch
function bucleDelJuego() {
    actualizar();  // Primero calculamos qué pasa
    dibujar();     // Luego lo dibujamos

    // Pedimos que se vuelva a ejecutar en el próximo "frame"
    requestAnimationFrame(bucleDelJuego);
}

// ¡Iniciamos el juego!
console.log('¡Bubble Bobble iniciado! Usa las flechas para mover a Bub.');
bucleDelJuego();
