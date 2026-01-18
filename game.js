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

// ===========================================
// PASO 1.5: Sistema de sonidos
// ===========================================

/*
    Ciro: Para hacer sonidos en JavaScript usamos la "Web Audio API".
    Es como tener un sintetizador de música dentro del navegador.

    Un "oscillator" (oscilador) genera ondas de sonido, como cuando
    silbas o tocas una nota en un piano. Podemos controlar:
    - La frecuencia (Hz): qué tan agudo o grave es el sonido
    - El tipo de onda: 'sine' (suave), 'square' (8-bit), 'triangle', 'sawtooth'
    - La duración: cuánto tiempo suena
*/

// Crear el contexto de audio (solo se crea una vez)
let contextoAudio = null;

// Esta función inicializa el audio (hay que hacerlo después de una interacción del usuario)
function inicializarAudio() {
    if (!contextoAudio) {
        contextoAudio = new (window.AudioContext || window.webkitAudioContext)();
    }
}

/*
    Ciro: Esta función crea un sonido corto.
    - frecuencia: número en Hz (más alto = más agudo)
    - duracion: en segundos
    - tipo: forma de onda ('square' suena a videojuego retro)
*/
function reproducirSonido(frecuencia, duracion, tipo = 'square') {
    // Si no hay contexto de audio, no hacer nada
    if (!contextoAudio) return;

    // Crear un oscilador (generador de sonido)
    const oscilador = contextoAudio.createOscillator();
    const ganancia = contextoAudio.createGain();  // Control de volumen

    // Configurar el oscilador
    oscilador.type = tipo;
    oscilador.frequency.value = frecuencia;

    // Conectar: oscilador -> ganancia -> altavoces
    oscilador.connect(ganancia);
    ganancia.connect(contextoAudio.destination);

    // Empezar con volumen y bajar gradualmente (para que no suene cortado)
    ganancia.gain.setValueAtTime(0.3, contextoAudio.currentTime);
    ganancia.gain.exponentialRampToValueAtTime(0.01, contextoAudio.currentTime + duracion);

    // ¡Reproducir!
    oscilador.start(contextoAudio.currentTime);
    oscilador.stop(contextoAudio.currentTime + duracion);
}

// Sonido de perder vida: tono descendente (¡ay!)
function sonidoPerderVida() {
    inicializarAudio();
    reproducirSonido(400, 0.1, 'square');
    setTimeout(() => reproducirSonido(300, 0.1, 'square'), 100);
    setTimeout(() => reproducirSonido(200, 0.2, 'square'), 200);
}

// Sonido de atrapar enemigo: tono agudo corto (¡plop!)
function sonidoAtrapar() {
    inicializarAudio();
    reproducirSonido(600, 0.05, 'sine');
    setTimeout(() => reproducirSonido(900, 0.1, 'sine'), 50);
}

// Sonido de eliminar enemigo: tono ascendente alegre (¡bien!)
function sonidoEliminar() {
    inicializarAudio();
    reproducirSonido(500, 0.08, 'square');
    setTimeout(() => reproducirSonido(700, 0.08, 'square'), 80);
    setTimeout(() => reproducirSonido(900, 0.15, 'square'), 160);
}

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
    color: '#88ff88', // Color verde clarito (después pondremos un dibujo)
    direccion: 1      // 1 = mirando a la derecha, -1 = mirando a la izquierda
};

// ===========================================
// PASO 3: Constantes del juego (configuración)
// ===========================================

const GRAVEDAD = 0.5;        // Qué tan fuerte jala hacia abajo
const VELOCIDAD_MOVIMIENTO = 5;  // Qué tan rápido se mueve Bub
const FUERZA_SALTO = -12;    // Qué tan alto salta (negativo porque arriba es menos Y)
const SUELO_Y = 440;         // Dónde está el suelo

/*
    Ciro: Cada nivel tiene su propio esquema de colores.
    Esto hace que el juego sea más visual y sepas en qué nivel estás.

    Cada color tiene dos tonos: oscuro (relleno) y claro (borde superior).
*/
const COLORES_NIVEL = [
    { plataforma: '#00aa00', borde: '#00ff00', bordePantalla: '#00ff88' },  // Verde (nivel 1)
    { plataforma: '#0066cc', borde: '#00aaff', bordePantalla: '#00aaff' },  // Azul (nivel 2)
    { plataforma: '#aa00aa', borde: '#ff00ff', bordePantalla: '#ff00ff' },  // Magenta (nivel 3)
    { plataforma: '#cc6600', borde: '#ff9900', bordePantalla: '#ff9900' },  // Naranja (nivel 4)
    { plataforma: '#aa0000', borde: '#ff4444', bordePantalla: '#ff4444' },  // Rojo (nivel 5)
    { plataforma: '#006666', borde: '#00cccc', bordePantalla: '#00cccc' },  // Cyan (nivel 6)
    { plataforma: '#666600', borde: '#cccc00', bordePantalla: '#ffff00' },  // Amarillo (nivel 7)
    { plataforma: '#663399', borde: '#9966ff', bordePantalla: '#9966ff' },  // Púrpura (nivel 8)
];

// ===========================================
// PASO 3.5: Las plataformas (generadas aleatoriamente)
// ===========================================

/*
    Ciro: Ahora las plataformas se generan ALEATORIAMENTE en cada nivel.
    Usamos "let" porque el array va a cambiar cuando pasemos de nivel.

    La función generarPlataformas() crea una distribución nueva cada vez.
*/

let plataformas = [];

/*
    Ciro: Esta función genera plataformas aleatorias para cada nivel.

    Recibe el número de nivel y genera:
    - Más plataformas en niveles bajos (más fácil)
    - Menos plataformas en niveles altos (más difícil)

    Math.random() devuelve un número entre 0 y 1, lo usamos para
    crear posiciones aleatorias.
*/
function generarPlataformas(nivel) {
    plataformas = [];  // Limpiar las plataformas anteriores

    // Calcular cuántas plataformas (menos en niveles altos, mínimo 6)
    const cantidadBase = 12;
    const cantidad = Math.max(6, cantidadBase - nivel);

    // Alturas posibles para las plataformas (filas)
    const alturasDisponibles = [50, 120, 200, 280, 360, 440];

    // Para cada altura, decidir si ponemos plataformas y dónde
    for (let i = 0; i < alturasDisponibles.length; i++) {
        const y = alturasDisponibles[i];

        // Decidir el patrón para esta fila (aleatorio)
        const patron = Math.floor(Math.random() * 4);

        if (patron === 0) {
            // Patrón: dos plataformas en los lados
            const ancho = 100 + Math.random() * 80;
            plataformas.push({ x: 0, y: y, ancho: ancho, alto: 16 });
            plataformas.push({ x: canvas.width - ancho, y: y, ancho: ancho, alto: 16 });
        } else if (patron === 1) {
            // Patrón: una plataforma central
            const ancho = 120 + Math.random() * 100;
            const x = (canvas.width - ancho) / 2;
            plataformas.push({ x: x, y: y, ancho: ancho, alto: 16 });
        } else if (patron === 2) {
            // Patrón: dos plataformas en el centro
            const ancho = 80 + Math.random() * 60;
            const espacio = 40 + Math.random() * 40;
            plataformas.push({ x: canvas.width / 2 - ancho - espacio / 2, y: y, ancho: ancho, alto: 16 });
            plataformas.push({ x: canvas.width / 2 + espacio / 2, y: y, ancho: ancho, alto: 16 });
        } else {
            // Patrón: tres plataformas distribuidas
            const ancho = 60 + Math.random() * 50;
            plataformas.push({ x: 20, y: y, ancho: ancho, alto: 16 });
            plataformas.push({ x: (canvas.width - ancho) / 2, y: y, ancho: ancho, alto: 16 });
            plataformas.push({ x: canvas.width - ancho - 20, y: y, ancho: ancho, alto: 16 });
        }
    }

    // En niveles altos, quitar algunas plataformas al azar para más dificultad
    if (nivel > 2) {
        const quitarCantidad = Math.min(nivel - 2, plataformas.length - 6);
        for (let i = 0; i < quitarCantidad; i++) {
            const indice = Math.floor(Math.random() * plataformas.length);
            plataformas.splice(indice, 1);
        }
    }

    console.log('Nivel ' + nivel + ': ' + plataformas.length + ' plataformas generadas');
}

// Generar las plataformas del primer nivel
generarPlataformas(1);

// ===========================================
// PASO 3.6: Las burbujas
// ===========================================

/*
    Ciro: Las burbujas son otro array, pero este empieza VACÍO.
    Cada vez que Bub dispara, agregamos una burbuja nueva a la lista.
    Cuando una burbuja desaparece, la quitamos de la lista.

    Esto es diferente a las plataformas que siempre son las mismas.
    Es como en Scratch cuando usas "crear clon" - aquí creamos burbujas nuevas.
*/

const burbujas = [];  // Array vacío, se llenará cuando disparemos

// Configuración de las burbujas
const BURBUJA_VELOCIDAD = 8;       // Qué tan rápido va la burbuja al principio
const BURBUJA_RADIO = 16;          // Tamaño de la burbuja
const BURBUJA_DURACION = 180;      // Burbujas vacías duran 3 segundos (180 frames)
const BURBUJA_DURACION_CON_ENEMIGO = 900;  // Burbujas con enemigo duran 15 segundos (900 frames)
const BURBUJA_TIEMPO_FLOTAR = 30;  // Después de cuántos frames empieza a flotar

// Variable para controlar que no dispare muchas burbujas seguidas
let puedeDisparar = true;

// ===========================================
// PASO 3.6.5: Las frutas
// ===========================================

/*
    Ciro: Las frutas aparecen cuando explotas una burbuja con enemigo.
    Son como "premios" que dan puntos extra si los recoges.

    Cada fruta tiene: posición, tipo (determina puntos y color), y velocidad de caída.
*/
const frutas = [];

// Tipos de frutas con sus puntos y colores
const TIPOS_FRUTAS = [
    { nombre: 'manzana', color: '#ff0000', puntos: 100 },
    { nombre: 'naranja', color: '#ff8800', puntos: 200 },
    { nombre: 'uva', color: '#8800ff', puntos: 300 },
    { nombre: 'sandia', color: '#00ff00', puntos: 500 },
    { nombre: 'diamante', color: '#00ffff', puntos: 1000 }
];

// ===========================================
// PASO 3.7: Los enemigos
// ===========================================

/*
    Ciro: Los enemigos son como los "malos" del juego.
    Tienen estados diferentes:
    - "libre": caminan y son peligrosos para Bub
    - "atrapado": están dentro de una burbuja y Bub puede eliminarlos

    Esto es como tener una variable "estado" en un sprite de Scratch.
*/

/*
    Ciro: Usamos "let" en vez de "const" porque el array de enemigos
    va a cambiar cuando creemos nuevas nivels.
    - const = no puede cambiar (constante)
    - let = puede cambiar (variable)
*/
let enemigos = [];

// Configuración de enemigos
const ENEMIGO_VELOCIDAD = 2;
const ES_MOVIL = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 900;
const MULTIPLICADOR_ENEMIGO = ES_MOVIL ? 0.85 : 1;

// Puntuación del jugador
let puntuacion = 0;

// Número de nivel actual (empieza en 1)
let nivel = 1;

// Sistema de vidas
/*
    Ciro: Las vidas funcionan así:
    - Empezamos con 3 vidas
    - Cada vez que un enemigo nos toca, perdemos 1
    - Si llegamos a 0, es Game Over
    - Podemos reiniciar presionando R
*/
let vidas = 3;

// Estado del juego: 'inicio', 'jugando', 'gameOver' o 'ingresandoNombre'
/*
    Ciro: Ahora el juego tiene 4 estados posibles:
    - 'inicio': Pantalla de título, esperando que pulses una tecla
    - 'jugando': El juego en acción
    - 'gameOver': Perdiste todas las vidas
    - 'ingresandoNombre': Escribiendo tu nombre para el récord
*/
let estadoJuego = 'inicio';

// ===========================================
// Sistema de Récords (High Scores)
// ===========================================

/*
    Ciro: Los récords se guardan en "localStorage", que es como
    una memoria del navegador que NO se borra cuando cierras la página.

    Guardamos un array con los 3 mejores puntajes, cada uno con:
    - nombre: quién lo consiguió
    - puntos: cuántos puntos hizo
*/

// Array con los 3 mejores récords
let records = [];

// Variables para cuando el jugador escribe su nombre
let nombreJugador = '';
let cursorVisible = true;  // Para hacer parpadear el cursor

/*
    Ciro: Esta función CARGA los récords guardados en el navegador.
    localStorage guarda todo como TEXTO, así que usamos JSON.parse()
    para convertir el texto de vuelta a un array de JavaScript.
*/
function cargarRecords() {
    const datosGuardados = localStorage.getItem('bubbleBobbleRecords');
    if (datosGuardados) {
        records = JSON.parse(datosGuardados);
        // Asegurar orden y máximo 3 por si el formato antiguo guardó más
        records.sort(function(a, b) {
            return b.puntos - a.puntos;
        });
        records = records.slice(0, 3);
    } else {
        // Si no hay récords guardados, empezar con una lista vacía
        records = [];
    }
}

/*
    Ciro: Esta función GUARDA los récords en el navegador.
    JSON.stringify() convierte el array a texto para guardarlo.
*/
function guardarRecords() {
    localStorage.setItem('bubbleBobbleRecords', JSON.stringify(records));
}

/*
    Ciro: Esta función verifica si una puntuación entra en el top 3.
    Devuelve true si es un nuevo récord, false si no.
*/
function esNuevoRecord(puntos) {
    // Si hay menos de 3 récords, cualquier puntuación entra
    if (records.length < 3) {
        return true;
    }
    // Si hay 3 récords, verificar si supera al menor
    const menorRecord = records[records.length - 1];
    return puntos > menorRecord.puntos;
}

/*
    Ciro: Esta función añade un nuevo récord a la lista.
    Luego ordena la lista de mayor a menor y mantiene solo los 3 mejores.
*/
function agregarRecord(nombre, puntos) {
    // Añadir el nuevo récord
    records.push({ nombre: nombre, puntos: puntos });

    // Ordenar de mayor a menor (el que tiene más puntos primero)
    records.sort(function(a, b) {
        return b.puntos - a.puntos;
    });

    // Mantener solo los 3 mejores
    if (records.length > 3) {
        records = records.slice(0, 3);
    }

    // Guardar en localStorage
    guardarRecords();
}

// Cargar los récords al iniciar el juego
cargarRecords();

/*
    Ciro: Esta FUNCIÓN crea un nuevo nivel con enemigos.
    Una función es como un "bloque personalizado" en Scratch.

    Hace dos cosas:
    1. Genera nuevas plataformas aleatorias
    2. Crea los enemigos para el nivel
*/
function crearNivel(numeroNivel) {
    // Generar nuevas plataformas aleatorias para este nivel
    generarPlataformas(numeroNivel);

    // Limpiar el array de enemigos
    enemigos = [];

    // Calcular cuántos enemigos (más en niveles altos, máximo 8)
    const cantidadEnemigos = Math.min(2 + numeroNivel, 8);

    // Colores diferentes para cada nivel (más variedad visual)
    const colores = ['#ff6666', '#ff66ff', '#66ffff', '#ffff66', '#ff9966'];

    for (let i = 0; i < cantidadEnemigos; i++) {
        // Posición aleatoria en la parte superior de la pantalla
        const posX = 50 + Math.random() * (canvas.width - 100);
        const posY = 30 + Math.random() * 150;

        // Dirección aleatoria: -1 (izquierda) o 1 (derecha)
        const direccion = Math.random() < 0.5 ? -1 : 1;

        // Velocidad aumenta un poco con cada nivel
        const velocidad = (ENEMIGO_VELOCIDAD + (numeroNivel - 1) * 0.3) * MULTIPLICADOR_ENEMIGO;

        /*
            Ciro: Algunos enemigos dan vida extra en vez de fruta.
            Usamos Math.random() < 0.15 para que sea 15% de probabilidad.
            Estos enemigos especiales tienen un corazón.
        */
        const daVidaExtra = Math.random() < 0.15;  // 15% de probabilidad

        // Crear el enemigo
        const nuevoEnemigo = {
            x: posX,
            y: posY,
            ancho: 28,
            alto: 28,
            velocidadX: velocidad * direccion,
            velocidadY: 0,
            estado: 'libre',
            color: daVidaExtra ? '#ff69b4' : colores[(numeroNivel - 1) % colores.length],  // Rosa si da vida
            daVida: daVidaExtra  // true = da vida, false = da fruta
        };

        // Agregar al array
        enemigos.push(nuevoEnemigo);
    }

    console.log('¡Nivel ' + numeroNivel + ' con ' + cantidadEnemigos + ' enemigos!');
}

// Crear el primer nivel
crearNivel(1);

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
    if (estadoJuego === 'ingresandoNombre') {
        if (evento.key === 'Backspace') {
            evento.preventDefault();
            nombreJugador = nombreJugador.slice(0, -1);
        } else if (evento.key === 'Enter') {
            const nombreFinal = nombreJugador.trim() || 'Anon';
            agregarRecord(nombreFinal, puntuacion);
            estadoJuego = 'gameOver';
        } else if (evento.key.length === 1 && /[a-zA-Z0-9 ]/.test(evento.key)) {
            if (nombreJugador.length < 10) {
                nombreJugador = nombreJugador + evento.key;
            }
        }
        return;
    }

    /*
        Ciro: Si estamos en la pantalla de inicio, cualquier tecla
        comienza el juego. Usamos inicializarAudio() aquí porque
        el navegador solo permite sonidos después de una interacción.
    */
    if (estadoJuego === 'inicio') {
        inicializarAudio();
        estadoJuego = 'jugando';
        return;  // No procesar más esta tecla
    }

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

    // Tecla R para reiniciar (solo si es Game Over)
    if (evento.key === 'r' || evento.key === 'R') {
        if (estadoJuego === 'gameOver') {
            reiniciarJuego();
        }
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
// PASO 4.2: Controles tactiles para movil
// ===========================================

function iniciarJuegoSiHaceFalta() {
    if (estadoJuego === 'inicio') {
        inicializarAudio();
        estadoJuego = 'jugando';
        mostrarReiniciar(false);
    }
}

function finalizarNombreConPrompt() {
    const nombre = window.prompt('Nuevo record. Escribe tu nombre:');
    const nombreFinal = (nombre || '').trim() || 'Anon';
    agregarRecord(nombreFinal, puntuacion);
    estadoJuego = 'gameOver';
    mostrarReiniciar(true);
}

function manejarAccionTactil(accion, presionado) {
    if (accion === 'left') {
        teclas.izquierda = presionado;
    } else if (accion === 'right') {
        teclas.derecha = presionado;
    } else if (accion === 'jump') {
        teclas.arriba = presionado;
    } else if (accion === 'bubble') {
        teclas.espacio = presionado;
    } else if (accion === 'restart' && presionado) {
        if (estadoJuego === 'gameOver') {
            reiniciarJuego();
        }
    }
}

let botonReiniciar = null;

function mostrarReiniciar(visible) {
    if (!botonReiniciar) return;
    botonReiniciar.classList.toggle('oculto', !visible);
}

const controlesMovil = document.getElementById('controles-movil');
if (controlesMovil) {
    botonReiniciar = controlesMovil.querySelector('[data-action=\"restart\"]');
    mostrarReiniciar(false);
    const botones = controlesMovil.querySelectorAll('[data-action]');

    botones.forEach(function(boton) {
        boton.addEventListener('pointerdown', function(evento) {
            evento.preventDefault();
            if (evento.pointerType === 'touch') {
                boton.setPointerCapture(evento.pointerId);
            }

            if (estadoJuego === 'ingresandoNombre' && evento.pointerType === 'touch') {
                finalizarNombreConPrompt();
                return;
            }

            iniciarJuegoSiHaceFalta();
            const accion = boton.getAttribute('data-action');
            manejarAccionTactil(accion, true);
        });

        boton.addEventListener('pointerup', function(evento) {
            evento.preventDefault();
            const accion = boton.getAttribute('data-action');
            manejarAccionTactil(accion, false);
        });

        boton.addEventListener('pointercancel', function(evento) {
            evento.preventDefault();
            const accion = boton.getAttribute('data-action');
            manejarAccionTactil(accion, false);
        });

        boton.addEventListener('pointerout', function(evento) {
            evento.preventDefault();
            const accion = boton.getAttribute('data-action');
            manejarAccionTactil(accion, false);
        });
    });

    canvas.addEventListener('pointerdown', function(evento) {
        if (evento.pointerType === 'touch') {
            evento.preventDefault();
            if (estadoJuego === 'ingresandoNombre') {
                finalizarNombreConPrompt();
                return;
            }
            iniciarJuegoSiHaceFalta();
        }
    });
}

// ===========================================
// PASO 4.5: Función para reiniciar el juego
// ===========================================

/*
    Ciro: Esta función reinicia TODO el juego a su estado inicial.
    Es como presionar la bandera verde en Scratch.
*/
function reiniciarJuego() {
    // Resetear a Bub
    bub.x = 100;
    bub.y = 300;
    bub.velocidadX = 0;
    bub.velocidadY = 0;
    bub.direccion = 1;

    // Resetear variables del juego
    puntuacion = 0;
    nivel = 1;
    vidas = 3;
    estadoJuego = 'jugando';
    mostrarReiniciar(false);

    // Limpiar burbujas y frutas
    burbujas.length = 0;
    frutas.length = 0;

    // Crear primer nivel (genera plataformas y enemigos)
    crearNivel(1);

    console.log('¡Juego reiniciado!');
}

// ===========================================
// PASO 4.6: Función de colisión
// ===========================================

/*
    Ciro: Esta función responde la pregunta "¿están chocando dos rectángulos?"

    En Scratch usarías "¿tocando [sprite]?". Aquí lo calculamos matemáticamente.

    Dos rectángulos chocan SI Y SOLO SI:
    - No están separados horizontalmente (uno no está completamente a la izquierda del otro)
    - No están separados verticalmente (uno no está completamente arriba del otro)
*/
function hayColision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.ancho &&
           rect1.x + rect1.ancho > rect2.x &&
           rect1.y < rect2.y + rect2.alto &&
           rect1.y + rect1.alto > rect2.y;
}

// ===========================================
// PASO 4.7: Manejar Game Over y récords
// ===========================================

function activarGameOver() {
    teclas.izquierda = false;
    teclas.derecha = false;
    teclas.arriba = false;
    teclas.espacio = false;

    if (esNuevoRecord(puntuacion)) {
        estadoJuego = 'ingresandoNombre';
        nombreJugador = '';
        cursorVisible = true;
        mostrarReiniciar(false);
    } else {
        estadoJuego = 'gameOver';
        mostrarReiniciar(true);
    }
}

// ===========================================
// PASO 5: Actualizar el juego (la lógica)
// ===========================================

// Esta función se ejecuta muchas veces por segundo (como "por siempre" en Scratch)
function actualizar() {
    // Si estamos en inicio o Game Over, no actualizar nada
    if (estadoJuego === 'inicio' || estadoJuego === 'gameOver' || estadoJuego === 'ingresandoNombre') {
        return;  // "return" sale de la función inmediatamente
    }

    // --- Movimiento horizontal ---
    if (teclas.izquierda) {
        bub.velocidadX = -VELOCIDAD_MOVIMIENTO;
        bub.direccion = -1;  // Ahora mira a la izquierda
    } else if (teclas.derecha) {
        bub.velocidadX = VELOCIDAD_MOVIMIENTO;
        bub.direccion = 1;   // Ahora mira a la derecha
    } else {
        bub.velocidadX = 0;  // Si no presiona nada, se detiene
    }

    // --- Disparar burbuja ---
    /*
        Ciro: Cuando presionas espacio, creamos una burbuja nueva.
        Usamos "puedeDisparar" para que no dispare 60 burbujas por segundo
        mientras mantienes presionado el espacio.
    */
    if (teclas.espacio && puedeDisparar) {
        // Crear una nueva burbuja
        const nuevaBurbuja = {
            x: bub.x + bub.ancho / 2,  // Sale del centro de Bub
            y: bub.y + bub.alto / 2,
            velocidadX: BURBUJA_VELOCIDAD * bub.direccion,  // Va hacia donde mira Bub
            velocidadY: 0,
            edad: 0  // Contador de frames desde que se creó
        };

        // Agregar la burbuja al array (como "agregar a lista" en Scratch)
        burbujas.push(nuevaBurbuja);

        puedeDisparar = false;  // No puede disparar hasta soltar espacio
    }

    // Cuando suelta espacio, puede volver a disparar
    if (!teclas.espacio) {
        puedeDisparar = true;
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

    // --- Envolver de abajo hacia arriba (wrap-around) ---
    /*
        Ciro: En vez de tener un suelo, cuando Bub cae por abajo
        de la pantalla, reaparece por arriba. ¡Como en el Bubble Bobble original!

        Esto se llama "wrap-around" o "envolver".
    */
    if (bub.y > canvas.height) {
        bub.y = -bub.alto;  // Aparecer arriba (fuera de la pantalla, entrando)
        // Mantiene la velocidad, sigue cayendo
    }

    // --- Colisión con plataformas ---
    /*
        Ciro: Aquí usamos un "for" que es como el bloque "repetir para cada elemento de lista".
        Revisamos CADA plataforma para ver si Bub está tocándola.
    */
    for (let i = 0; i < plataformas.length; i++) {
        const plat = plataformas[i];

        // Solo verificamos si Bub está cayendo (velocidadY > 0)
        // Así puede saltar ATRAVESANDO las plataformas desde abajo
        if (bub.velocidadY > 0) {
            // ¿Los pies de Bub están tocando la parte de arriba de la plataforma?
            const piesDeBub = bub.y + bub.alto;
            const piesAntesDeSalto = piesDeBub - bub.velocidadY;

            // Si los pies pasaron por la plataforma en este frame
            if (piesAntesDeSalto <= plat.y && piesDeBub >= plat.y) {
                // Y está dentro del rango horizontal de la plataforma
                if (bub.x + bub.ancho > plat.x && bub.x < plat.x + plat.ancho) {
                    bub.y = plat.y - bub.alto;  // Ponerlo encima
                    bub.velocidadY = 0;
                    bub.enElSuelo = true;
                }
            }
        }
    }

    // --- No salirse por los lados ---
    if (bub.x < 0) {
        bub.x = 0;
    }
    if (bub.x + bub.ancho > canvas.width) {
        bub.x = canvas.width - bub.ancho;
    }

    // --- Actualizar burbujas ---
    /*
        Ciro: Recorremos todas las burbujas para moverlas.
        Pero ojo: recorremos de atrás hacia adelante (i--) porque
        vamos a eliminar algunas. Si las elimináramos yendo hacia adelante,
        nos saltaríamos elementos.
    */
    for (let i = burbujas.length - 1; i >= 0; i--) {
        const burbuja = burbujas[i];

        // Aumentar la edad de la burbuja
        burbuja.edad = burbuja.edad + 1;

        // Comportamiento según la edad:
        if (burbuja.edad < BURBUJA_TIEMPO_FLOTAR) {
            // FASE 1: Va recto horizontalmente
            burbuja.x = burbuja.x + burbuja.velocidadX;
        } else {
            // FASE 2: Flota hacia arriba y se mueve poco a poco
            burbuja.velocidadX = burbuja.velocidadX * 0.95;  // Se frena
            burbuja.x = burbuja.x + burbuja.velocidadX;
            burbuja.y = burbuja.y - 1.5;  // Flota hacia arriba
        }

        // Rebotar en los bordes laterales
        if (burbuja.x < BURBUJA_RADIO) {
            burbuja.x = BURBUJA_RADIO;
            burbuja.velocidadX = -burbuja.velocidadX;
        }
        if (burbuja.x > canvas.width - BURBUJA_RADIO) {
            burbuja.x = canvas.width - BURBUJA_RADIO;
            burbuja.velocidadX = -burbuja.velocidadX;
        }

        // --- Colisión burbuja con enemigos libres ---
        /*
            Ciro: Si una burbuja toca un enemigo que está "libre",
            lo atrapa. El enemigo pasa a estado "atrapado" y se mueve
            junto con la burbuja.

            ¡IMPORTANTE! Una burbuja solo puede tener UN enemigo.
            Si ya tiene uno, no puede atrapar más.
        */

        // Solo buscar enemigos si esta burbuja está vacía
        if (!burbuja.tieneEnemigo) {
            for (let j = 0; j < enemigos.length; j++) {
                const enemigo = enemigos[j];

                // Solo podemos atrapar enemigos libres
                if (enemigo.estado === 'libre') {
                    // Calcular distancia entre burbuja y centro del enemigo
                    const centroEnemigoX = enemigo.x + enemigo.ancho / 2;
                    const centroEnemigoY = enemigo.y + enemigo.alto / 2;
                    const distancia = Math.sqrt(
                        Math.pow(burbuja.x - centroEnemigoX, 2) +
                        Math.pow(burbuja.y - centroEnemigoY, 2)
                    );

                    // Si están lo suficientemente cerca, ¡atrapado!
                    if (distancia < BURBUJA_RADIO + 10) {
                        enemigo.estado = 'atrapado';
                        /*
                            Ciro: Aquí guardamos una REFERENCIA al objeto, no su índice.
                            Así no importa si los índices cambian cuando eliminamos enemigos.
                            Es como guardar el sprite directamente, no su número en la lista.
                        */
                        enemigo.burbuja = burbuja;  // El enemigo sabe en qué burbuja está
                        burbuja.tieneEnemigo = true;
                        burbuja.enemigo = enemigo;  // La burbuja sabe qué enemigo tiene

                        // ¡Sonido de atrapar!
                        sonidoAtrapar();

                        // ¡Ya atrapamos uno! Salir del bucle (una burbuja = un enemigo)
                        break;
                    }
                }
            }
        }

        // Determinar duración según si tiene enemigo o no
        /*
            Ciro: Las burbujas con enemigo duran más tiempo (15 segundos)
            para dar chance a Bub de llegar y explotarlas.
            Las burbujas vacías duran menos (3 segundos).
        */
        const duracionMaxima = burbuja.tieneEnemigo ? BURBUJA_DURACION_CON_ENEMIGO : BURBUJA_DURACION;

        // Eliminar burbuja si es muy vieja o sale por arriba
        if (burbuja.edad > duracionMaxima || burbuja.y < -BURBUJA_RADIO) {
            // Si la burbuja tenía un enemigo, lo libera (¡escapa!)
            if (burbuja.tieneEnemigo && burbuja.enemigo) {
                burbuja.enemigo.estado = 'libre';
                burbuja.enemigo.velocidadY = 0;  // Resetear velocidad
                burbuja.enemigo.burbuja = null;  // Ya no está en una burbuja
            }
            // "splice" elimina un elemento del array (como "borrar elemento de lista")
            burbujas.splice(i, 1);
        }
    }

    // --- Actualizar enemigos ---
    /*
        Ciro: Los enemigos tienen dos comportamientos según su estado:
        - Si están LIBRES: caminan, caen, y son peligrosos
        - Si están ATRAPADOS: flotan con la burbuja
    */
    for (let i = 0; i < enemigos.length; i++) {
        const enemigo = enemigos[i];

        if (enemigo.estado === 'libre') {
            // --- Enemigo libre: camina y cae ---

            // Aplicar gravedad
            enemigo.velocidadY = enemigo.velocidadY + GRAVEDAD;

            // Moverse
            enemigo.x = enemigo.x + enemigo.velocidadX;
            enemigo.y = enemigo.y + enemigo.velocidadY;

            // Envolver de abajo hacia arriba (igual que Bub)
            if (enemigo.y > canvas.height) {
                enemigo.y = -enemigo.alto;
            }

            // Colisión con plataformas (igual que Bub)
            for (let j = 0; j < plataformas.length; j++) {
                const plat = plataformas[j];
                if (enemigo.velocidadY > 0) {
                    const pies = enemigo.y + enemigo.alto;
                    const piesAntes = pies - enemigo.velocidadY;
                    if (piesAntes <= plat.y && pies >= plat.y) {
                        if (enemigo.x + enemigo.ancho > plat.x && enemigo.x < plat.x + plat.ancho) {
                            enemigo.y = plat.y - enemigo.alto;
                            enemigo.velocidadY = 0;
                        }
                    }
                }
            }

            // Rebotar en los bordes (cambiar dirección)
            if (enemigo.x <= 0 || enemigo.x + enemigo.ancho >= canvas.width) {
                enemigo.velocidadX = -enemigo.velocidadX;
            }

            // --- Colisión con Bub (¡peligro!) ---
            if (hayColision(bub, enemigo)) {
                // Perder una vida
                vidas = vidas - 1;

                // ¡Sonido de daño!
                sonidoPerderVida();

                if (vidas <= 0) {
                    // ¡Game Over!
                    activarGameOver();
                } else {
                    // Todavía tiene vidas: volver al inicio
                    bub.x = 100;
                    bub.y = 300;
                    bub.velocidadX = 0;
                    bub.velocidadY = 0;
                }
            }

        } else if (enemigo.estado === 'atrapado') {
            // --- Enemigo atrapado: sigue a la burbuja ---
            /*
                Ciro: Ahora usamos la REFERENCIA directa enemigo.burbuja
                en vez de buscar por índice. ¡Mucho más simple y seguro!
            */
            const burbuja = enemigo.burbuja;

            if (burbuja) {
                // Mover el enemigo al centro de la burbuja
                enemigo.x = burbuja.x - enemigo.ancho / 2;
                enemigo.y = burbuja.y - enemigo.alto / 2;

                // --- ¿Bub toca la burbuja con enemigo? ¡Explota y sale fruta! ---
                const distanciaBub = Math.sqrt(
                    Math.pow(burbuja.x - (bub.x + bub.ancho / 2), 2) +
                    Math.pow(burbuja.y - (bub.y + bub.alto / 2), 2)
                );

                if (distanciaBub < BURBUJA_RADIO + 20) {
                    /*
                        Ciro: Cuando Bub toca una burbuja con enemigo:
                        - Si el enemigo tiene daVida = true: ¡Vida extra!
                        - Si no: Aparece una fruta
                    */

                    // ¡Sonido de eliminar enemigo!
                    sonidoEliminar();

                    if (enemigo.daVida) {
                        // ¡Este enemigo da vida extra!
                        vidas = vidas + 1;
                        // También dar algunos puntos
                        puntuacion = puntuacion + 500;
                    } else {
                        // Crear una fruta en la posición de la burbuja
                        // El tipo de fruta depende del nivel (niveles más altos = mejores frutas)
                        const indiceFruta = Math.min(nivel - 1, TIPOS_FRUTAS.length - 1);
                        const tipoFruta = TIPOS_FRUTAS[indiceFruta];

                        const nuevaFruta = {
                            x: burbuja.x - 12,
                            y: burbuja.y - 12,
                            ancho: 24,
                            alto: 24,
                            velocidadY: 0,
                            tipo: tipoFruta,
                            edad: 0  // Para que desaparezca si no la recogen
                        };
                        frutas.push(nuevaFruta);
                    }

                    // Eliminar la burbuja del array
                    const indiceBurbuja = burbujas.indexOf(burbuja);
                    if (indiceBurbuja !== -1) {
                        burbujas.splice(indiceBurbuja, 1);
                    }

                    // Eliminar el enemigo del array
                    enemigos.splice(i, 1);
                    i--;  // Ajustar índice porque eliminamos un enemigo
                }
            }
        }
    }

    // --- Actualizar frutas ---
    /*
        Ciro: Las frutas caen por gravedad y Bub las puede recoger.
        Si pasa mucho tiempo sin recogerlas, desaparecen.
    */
    for (let i = frutas.length - 1; i >= 0; i--) {
        const fruta = frutas[i];

        // Aumentar edad
        fruta.edad = fruta.edad + 1;

        // Aplicar gravedad
        fruta.velocidadY = fruta.velocidadY + GRAVEDAD;
        fruta.y = fruta.y + fruta.velocidadY;

        // Envolver de abajo hacia arriba (igual que Bub y enemigos)
        if (fruta.y > canvas.height) {
            fruta.y = -fruta.alto;
        }

        // Colisión con plataformas
        for (let j = 0; j < plataformas.length; j++) {
            const plat = plataformas[j];
            if (fruta.velocidadY > 0) {
                const piesFruta = fruta.y + fruta.alto;
                if (piesFruta >= plat.y && fruta.y < plat.y) {
                    if (fruta.x + fruta.ancho > plat.x && fruta.x < plat.x + plat.ancho) {
                        fruta.y = plat.y - fruta.alto;
                        fruta.velocidadY = 0;
                    }
                }
            }
        }

        // ¿Bub recoge la fruta?
        if (hayColision(bub, fruta)) {
            // ¡Dar puntos según el tipo de fruta!
            puntuacion = puntuacion + fruta.tipo.puntos;
            frutas.splice(i, 1);
            continue;  // Pasar a la siguiente fruta
        }

        // Eliminar fruta si es muy vieja (10 segundos = 600 frames)
        if (fruta.edad > 600) {
            frutas.splice(i, 1);
        }
    }

    // --- Verificar si completamos el nivel ---
    /*
        Ciro: Si el array de enemigos está vacío (length === 0),
        significa que eliminamos a todos. ¡Siguiente nivel!

        Esto es como el bloque "si longitud de [lista] = 0" en Scratch.
    */
    if (enemigos.length === 0) {
        nivel = nivel + 1;  // Siguiente nivel

        // Bonus por completar nivel
        puntuacion = puntuacion + nivel * 100;

        // Limpiar burbujas y frutas del nivel anterior
        burbujas.length = 0;
        // Las frutas las dejamos por si quiere recogerlas

        // Crear el nuevo nivel (nuevas plataformas aleatorias + enemigos)
        crearNivel(nivel);

        // Poner a Bub en una posición segura
        bub.x = canvas.width / 2 - bub.ancho / 2;
        bub.y = 400;
        bub.velocidadX = 0;
        bub.velocidadY = 0;
    }
}

// ===========================================
// PASO 5.5: Pantalla de inicio
// ===========================================

/*
    Ciro: Esta variable cuenta los "frames" (imágenes) desde que empezó el juego.
    La usamos para hacer animaciones en la pantalla de inicio.
    60 frames = 1 segundo aproximadamente.
*/
let frameInicio = 0;

/*
    Ciro: Esta función dibuja la pantalla de título con estilo 8-bits.
    Usamos formas simples (rectángulos, círculos) para crear los gráficos,
    igual que hacían en los videojuegos antiguos.
*/
function dibujarPantallaInicio() {
    frameInicio++;

    // Fondo oscuro
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // --- Dibujar estrellas de fondo (efecto 8-bits) ---
    /*
        Ciro: Las estrellas titilan usando Math.sin() que crea un valor
        que sube y baja como una ola. Cada estrella tiene un "offset"
        diferente para que no titilen todas igual.
    */
    ctx.fillStyle = '#ffffff';
    const estrellas = [
        {x: 50, y: 80}, {x: 120, y: 40}, {x: 200, y: 90}, {x: 280, y: 30},
        {x: 350, y: 70}, {x: 420, y: 50}, {x: 480, y: 85}, {x: 70, y: 150},
        {x: 450, y: 140}, {x: 30, y: 200}, {x: 490, y: 200}, {x: 100, y: 280},
        {x: 400, y: 300}, {x: 250, y: 400}, {x: 60, y: 420}, {x: 470, y: 440}
    ];
    for (let i = 0; i < estrellas.length; i++) {
        const brillo = Math.sin(frameInicio * 0.1 + i) > 0 ? 1 : 0.3;
        ctx.globalAlpha = brillo;
        ctx.fillRect(estrellas[i].x, estrellas[i].y, 3, 3);
    }
    ctx.globalAlpha = 1;

    // --- Dibujar burbujas flotando ---
    /*
        Ciro: Las burbujas se mueven usando Math.sin() para hacer
        un movimiento ondulante de arriba a abajo.
    */
    const burbujasDeco = [
        {x: 80, y: 200, radio: 20},
        {x: 430, y: 180, radio: 25},
        {x: 150, y: 350, radio: 18},
        {x: 380, y: 380, radio: 22},
        {x: 60, y: 300, radio: 15},
        {x: 460, y: 320, radio: 17}
    ];
    for (let i = 0; i < burbujasDeco.length; i++) {
        const b = burbujasDeco[i];
        const offsetY = Math.sin(frameInicio * 0.03 + i * 2) * 15;

        ctx.beginPath();
        ctx.arc(b.x, b.y + offsetY, b.radio, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 200, 255, 0.4)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(150, 230, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Brillito
        ctx.beginPath();
        ctx.arc(b.x - b.radio * 0.3, b.y + offsetY - b.radio * 0.3, b.radio * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();
    }

    // --- Dibujar a Bub (el protagonista) en el centro ---
    /*
        Ciro: Dibujamos a Bub más grande para que se vea bien.
        Usamos rectángulos para darle ese aspecto de "pixels".
    */
    const bubX = 180;
    const bubY = 280;
    const bubEscala = 3;  // 3 veces más grande

    // Cuerpo de Bub (verde)
    ctx.fillStyle = '#88ff88';
    ctx.fillRect(bubX, bubY, 32 * bubEscala, 32 * bubEscala);

    // Ojos blancos
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bubX + 6 * bubEscala, bubY + 8 * bubEscala, 8 * bubEscala, 8 * bubEscala);
    ctx.fillRect(bubX + 18 * bubEscala, bubY + 8 * bubEscala, 8 * bubEscala, 8 * bubEscala);

    // Pupilas
    ctx.fillStyle = '#000000';
    ctx.fillRect(bubX + 10 * bubEscala, bubY + 10 * bubEscala, 4 * bubEscala, 4 * bubEscala);
    ctx.fillRect(bubX + 22 * bubEscala, bubY + 10 * bubEscala, 4 * bubEscala, 4 * bubEscala);

    // Boca sonriente (línea de rectángulos)
    ctx.fillStyle = '#006600';
    ctx.fillRect(bubX + 8 * bubEscala, bubY + 22 * bubEscala, 16 * bubEscala, 3 * bubEscala);

    // --- Dibujar un enemigo al lado ---
    const enemX = 340;
    const enemY = 300;
    const enemEscala = 2.5;

    // Cuerpo del enemigo (rojo)
    ctx.fillStyle = '#ff6666';
    ctx.fillRect(enemX, enemY, 28 * enemEscala, 28 * enemEscala);

    // Ojos
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(enemX + 6 * enemEscala, enemY + 8 * enemEscala, 6 * enemEscala, 6 * enemEscala);
    ctx.fillRect(enemX + 16 * enemEscala, enemY + 8 * enemEscala, 6 * enemEscala, 6 * enemEscala);
    ctx.fillStyle = '#000000';
    ctx.fillRect(enemX + 8 * enemEscala, enemY + 10 * enemEscala, 3 * enemEscala, 3 * enemEscala);
    ctx.fillRect(enemX + 18 * enemEscala, enemY + 10 * enemEscala, 3 * enemEscala, 3 * enemEscala);

    // --- Título del juego ---
    /*
        Ciro: Usamos sombras para dar un efecto de profundidad al texto.
        Primero dibujamos el texto en negro (sombra) y luego encima en color.
    */

    // Sombra del título
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 52px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BUBBLE BOBBLE', canvas.width / 2 + 4, 100 + 4);

    // Título principal (efecto arcoíris)
    const coloresTitulo = ['#ff6666', '#ffaa66', '#ffff66', '#66ff66', '#66ffff', '#6666ff'];
    ctx.fillStyle = '#66ffaa';
    ctx.fillText('BUBBLE BOBBLE', canvas.width / 2, 100);

    // Borde del título
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeText('BUBBLE BOBBLE', canvas.width / 2, 100);

    // --- Créditos ---
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Por Ciro, Juanda y Claude', canvas.width / 2, 160);

    // --- Texto "Pulsa una tecla" con parpadeo ---
    /*
        Ciro: Hacemos que el texto parpadee usando Math.sin().
        Cuando el valor es mayor que 0, mostramos el texto.
    */
    if (Math.sin(frameInicio * 0.08) > -0.3) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('- Pulsa cualquier tecla para empezar -', canvas.width / 2, 460);
    }

    // --- Borde decorativo estilo arcade ---
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Esquinas decorativas
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(6, 6, 12, 12);
    ctx.fillRect(canvas.width - 18, 6, 12, 12);
    ctx.fillRect(6, canvas.height - 18, 12, 12);
    ctx.fillRect(canvas.width - 18, canvas.height - 18, 12, 12);

    // Restaurar alineación
    ctx.textAlign = 'left';
}

// ===========================================
// PASO 6: Dibujar todo en pantalla
// ===========================================

function dibujar() {
    // --- Pantalla de inicio ---
    if (estadoJuego === 'inicio') {
        dibujarPantallaInicio();
        return;
    }
    // Obtener los colores del nivel actual
    /*
        Ciro: Usamos el operador % (módulo) para que los colores se repitan
        si llegamos a un nivel mayor que la cantidad de colores disponibles.
        Ej: nivel 9 usará los colores del nivel 1 (9 % 8 = 1)
    */
    const coloresActuales = COLORES_NIVEL[(nivel - 1) % COLORES_NIVEL.length];

    // Primero limpiamos todo (como "borrar todo" en Scratch)
    ctx.fillStyle = '#15138a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar borde de pantalla con el color del nivel
    ctx.strokeStyle = coloresActuales.bordePantalla;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

    // Dibujar las plataformas
    /*
        Ciro: Usamos otro "for" para dibujar CADA plataforma de la lista.
        Ahora usan el color del nivel actual.
    */
    for (let i = 0; i < plataformas.length; i++) {
        const plat = plataformas[i];
        // Parte principal de la plataforma (color del nivel)
        ctx.fillStyle = coloresActuales.plataforma;
        ctx.fillRect(plat.x, plat.y, plat.ancho, plat.alto);

        // Un borde más claro arriba para dar efecto 3D
        ctx.fillStyle = coloresActuales.borde;
        ctx.fillRect(plat.x, plat.y, plat.ancho, 4);
    }

    // Dibujar a Bub (por ahora es un cuadrado, luego lo haremos bonito)
    ctx.fillStyle = bub.color;
    ctx.fillRect(bub.x, bub.y, bub.ancho, bub.alto);

    // Ojos para indicar dirección
    const ojoY = bub.y + 8;
    const ojoIzqX = bub.x + 7;
    const ojoDerX = bub.x + 17;
    const pupilaOffset = bub.direccion === 1 ? 2 : -2;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ojoIzqX, ojoY, 6, 6);
    ctx.fillRect(ojoDerX, ojoY, 6, 6);

    ctx.fillStyle = '#000000';
    ctx.fillRect(ojoIzqX + 2 + pupilaOffset, ojoY + 2, 2, 2);
    ctx.fillRect(ojoDerX + 2 + pupilaOffset, ojoY + 2, 2, 2);

    // Dibujar las burbujas
    /*
        Ciro: Para dibujar círculos usamos "arc" (arco).
        Un arco de 0 a 2*PI (360 grados) es un círculo completo.
    */
    for (let i = 0; i < burbujas.length; i++) {
        const burbuja = burbujas[i];

        // Calcular transparencia según la edad y duración correspondiente
        const duracion = burbuja.tieneEnemigo ? BURBUJA_DURACION_CON_ENEMIGO : BURBUJA_DURACION;
        const vidaRestante = Math.max(0.3, 1 - (burbuja.edad / duracion));

        // Dibujar el círculo de la burbuja
        ctx.beginPath();  // Empezar a dibujar una forma
        ctx.arc(burbuja.x, burbuja.y, BURBUJA_RADIO, 0, Math.PI * 2);  // Círculo

        // Color diferente si tiene enemigo (más verde)
        if (burbuja.tieneEnemigo) {
            ctx.fillStyle = `rgba(100, 255, 150, ${vidaRestante * 0.6})`;
        } else {
            ctx.fillStyle = `rgba(100, 200, 255, ${vidaRestante * 0.6})`;
        }
        ctx.fill();  // Rellenar el círculo

        // Borde de la burbuja
        ctx.strokeStyle = `rgba(150, 230, 255, ${vidaRestante})`;
        ctx.lineWidth = 2;
        ctx.stroke();  // Dibujar el borde

        // Brillito de la burbuja (un círculo pequeño blanco)
        ctx.beginPath();
        ctx.arc(burbuja.x - 5, burbuja.y - 5, 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${vidaRestante * 0.8})`;
        ctx.fill();
    }

    // Dibujar las frutas
    /*
        Ciro: Las frutas son los premios que salen cuando explotas
        una burbuja con enemigo. ¡Recógelas para más puntos!
    */
    for (let i = 0; i < frutas.length; i++) {
        const fruta = frutas[i];

        // Parpadeo cuando está por desaparecer (últimos 2 segundos)
        const parpadeo = fruta.edad > 480 ? Math.sin(fruta.edad * 0.3) > 0 : true;

        if (parpadeo) {
            // Dibujar la fruta (círculo con su color)
            ctx.fillStyle = fruta.tipo.color;
            ctx.beginPath();
            ctx.arc(fruta.x + fruta.ancho / 2, fruta.y + fruta.alto / 2, 12, 0, Math.PI * 2);
            ctx.fill();

            // Borde blanco
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Brillito
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(fruta.x + fruta.ancho / 2 - 4, fruta.y + fruta.alto / 2 - 4, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Dibujar los enemigos
    /*
        Ciro: Los enemigos se dibujan diferente según su estado:
        - Libres: color rojo normal
        - Atrapados: más transparentes (están dentro de la burbuja)
    */
    for (let i = 0; i < enemigos.length; i++) {
        const enemigo = enemigos[i];

        if (enemigo.estado === 'libre') {
            // Enemigo libre: rojo sólido
            ctx.fillStyle = enemigo.color;
            ctx.fillRect(enemigo.x, enemigo.y, enemigo.ancho, enemigo.alto);

            // Ojitos para que se vea más simpático
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(enemigo.x + 6, enemigo.y + 8, 6, 6);
            ctx.fillRect(enemigo.x + 16, enemigo.y + 8, 6, 6);
            ctx.fillStyle = '#000000';
            ctx.fillRect(enemigo.x + 8, enemigo.y + 10, 3, 3);
            ctx.fillRect(enemigo.x + 18, enemigo.y + 10, 3, 3);

            /*
                Ciro: Si el enemigo da vida extra (daVida === true),
                le dibujamos un corazón encima para que sepas que es especial.
                ¡Estos enemigos son más valiosos porque te dan una vida!
            */
            if (enemigo.daVida) {
                ctx.fillStyle = '#ff0000';
                ctx.font = 'bold 14px Arial';
                ctx.fillText('♥', enemigo.x + 8, enemigo.y - 2);
            }
        } else {
            // Enemigo atrapado: más transparente
            ctx.fillStyle = 'rgba(255, 100, 100, 0.7)';
            ctx.fillRect(enemigo.x, enemigo.y, enemigo.ancho, enemigo.alto);

            // Ojitos
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillRect(enemigo.x + 6, enemigo.y + 8, 6, 6);
            ctx.fillRect(enemigo.x + 16, enemigo.y + 8, 6, 6);

            // Corazón también cuando está atrapado
            if (enemigo.daVida) {
                ctx.fillStyle = '#ff0000';
                ctx.font = 'bold 14px Arial';
                ctx.fillText('♥', enemigo.x + 8, enemigo.y - 2);
            }
        }
    }

    // Dibujar puntuación y nivel
    ctx.fillStyle = '#ffff00';  // Amarillo
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Puntos: ' + puntuacion, 10, 25);

    // Mostrar nivel actual
    ctx.fillStyle = '#00ffff';  // Cyan
    ctx.fillText('Nivel: ' + nivel, 230, 25);

    // Dibujar vidas (corazones)
    /*
        Ciro: Dibujamos las vidas como corazones.
        Usamos un bucle para dibujar tantos corazones como vidas tengamos.
    */
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 24px Arial';
    for (let i = 0; i < vidas; i++) {
        // Dibujamos un corazón por cada vida (usando emoji o texto)
        ctx.fillText('♥', 400 + i * 28, 27);
    }

    // Dibujar instrucciones (ahora arriba, al lado de las vidas ya no caben)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '12px Arial';
    ctx.fillText('←→: mover | ↑: saltar | Espacio: burbuja', 10, canvas.height - 10);

    // --- Tabla de récords (Top 3) ---
    function dibujarRecords(yInicial) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('TOP 3', canvas.width / 2, yInicial);

        if (records.length === 0) {
            ctx.fillStyle = '#cccccc';
            ctx.font = '16px Arial';
            ctx.fillText('Sin récords todavía', canvas.width / 2, yInicial + 24);
            return;
        }

        ctx.font = '18px Arial';
        for (let i = 0; i < records.length; i++) {
            const record = records[i];
            const texto = (i + 1) + '. ' + record.nombre + ' - ' + record.puntos;
            ctx.fillStyle = '#ffffff';
            ctx.fillText(texto, canvas.width / 2, yInicial + 24 + i * 22);
        }
    }

    // --- Pantalla de ingresar nombre (nuevo récord) ---
    if (estadoJuego === 'ingresandoNombre') {
        // Fondo oscuro semi-transparente
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 32px Arial';
        ctx.fillText('¡NUEVO RÉCORD!', canvas.width / 2, canvas.height / 2 - 60);

        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.fillText('Escribe tu nombre y pulsa Enter', canvas.width / 2, canvas.height / 2 - 25);

        // Cursor parpadeante
        cursorVisible = Math.sin(Date.now() * 0.008) > 0;
        const textoNombre = nombreJugador + (cursorVisible ? '_' : '');
        ctx.font = 'bold 24px Arial';
        ctx.fillText(textoNombre, canvas.width / 2, canvas.height / 2 + 10);

        dibujarRecords(canvas.height / 2 + 60);

        ctx.textAlign = 'left';
    }

    // --- Pantalla de Game Over ---
    /*
        Ciro: Si el estado es "gameOver", dibujamos un mensaje encima de todo.
        Usamos un rectángulo semi-transparente para oscurecer el fondo.
    */
    if (estadoJuego === 'gameOver') {
        // Fondo oscuro semi-transparente
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Texto "GAME OVER"
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';  // Centrar el texto
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);

        // Puntuación final
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('Puntuación final: ' + puntuacion, canvas.width / 2, canvas.height / 2 + 10);

        // Nivel alcanzado
        ctx.fillStyle = '#00ffff';
        ctx.fillText('Llegaste al nivel ' + nivel, canvas.width / 2, canvas.height / 2 + 45);

        // Instrucciones para reiniciar
        ctx.fillStyle = '#ffff00';
        ctx.font = '20px Arial';
        ctx.fillText('Presiona R para reiniciar', canvas.width / 2, canvas.height / 2 + 90);

        // Mostrar Top 3
        dibujarRecords(canvas.height / 2 + 130);

        // Restaurar alineación del texto
        ctx.textAlign = 'left';
    }
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
