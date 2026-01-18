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
    va a cambiar cuando creemos nuevas oleadas.
    - const = no puede cambiar (constante)
    - let = puede cambiar (variable)
*/
let enemigos = [];

// Configuración de enemigos
const ENEMIGO_VELOCIDAD = 2;

// Puntuación del jugador
let puntuacion = 0;

// Número de oleada actual (empieza en 1)
let oleada = 1;

// Sistema de vidas
/*
    Ciro: Las vidas funcionan así:
    - Empezamos con 3 vidas
    - Cada vez que un enemigo nos toca, perdemos 1
    - Si llegamos a 0, es Game Over
    - Podemos reiniciar presionando R
*/
let vidas = 3;

// Estado del juego: 'jugando' o 'gameOver'
let estadoJuego = 'jugando';

/*
    Ciro: Esta FUNCIÓN crea una nueva oleada de enemigos.
    Una función es como un "bloque personalizado" en Scratch.
    La defines una vez y la puedes usar muchas veces.

    Recibe un parámetro: cuántos enemigos crear.
*/
function crearOleada(cantidadEnemigos) {
    // Limpiar el array de enemigos (por si acaso)
    enemigos = [];

    // Posiciones posibles para aparecer (para que no aparezcan todos juntos)
    const posicionesX = [50, 150, 250, 350, 450];
    const posicionesY = [50, 120, 190];

    // Colores diferentes para cada oleada (más variedad visual)
    const colores = ['#ff6666', '#ff66ff', '#66ffff', '#ffff66', '#ff9966'];

    for (let i = 0; i < cantidadEnemigos; i++) {
        // Elegir posición semi-aleatoria
        const posX = posicionesX[i % posicionesX.length];
        const posY = posicionesY[i % posicionesY.length];

        // Dirección aleatoria: -1 (izquierda) o 1 (derecha)
        const direccion = Math.random() < 0.5 ? -1 : 1;

        // Velocidad aumenta un poco con cada oleada
        const velocidad = ENEMIGO_VELOCIDAD + (oleada - 1) * 0.3;

        // Crear el enemigo
        const nuevoEnemigo = {
            x: posX,
            y: posY,
            ancho: 28,
            alto: 28,
            velocidadX: velocidad * direccion,
            velocidadY: 0,
            estado: 'libre',
            color: colores[(oleada - 1) % colores.length]  // Color según oleada
        };

        // Agregar al array
        enemigos.push(nuevoEnemigo);
    }

    console.log('¡Oleada ' + oleada + ' con ' + cantidadEnemigos + ' enemigos!');
}

// Crear la primera oleada con 3 enemigos
crearOleada(3);

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
    oleada = 1;
    vidas = 3;
    estadoJuego = 'jugando';

    // Limpiar burbujas y frutas
    burbujas.length = 0;
    frutas.length = 0;

    // Crear primera oleada
    crearOleada(3);

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
// PASO 5: Actualizar el juego (la lógica)
// ===========================================

// Esta función se ejecuta muchas veces por segundo (como "por siempre" en Scratch)
function actualizar() {
    // Si es Game Over, no actualizar nada (el juego se congela)
    if (estadoJuego === 'gameOver') {
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

    // --- Colisión con el suelo ---
    if (bub.y + bub.alto > SUELO_Y) {
        bub.y = SUELO_Y - bub.alto;  // Ponerlo justo encima del suelo
        bub.velocidadY = 0;           // Detener la caída
        bub.enElSuelo = true;
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

            // Colisión con el suelo
            if (enemigo.y + enemigo.alto > SUELO_Y) {
                enemigo.y = SUELO_Y - enemigo.alto;
                enemigo.velocidadY = 0;
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

                if (vidas <= 0) {
                    // ¡Game Over!
                    estadoJuego = 'gameOver';
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
                        1. El enemigo muere
                        2. Aparece una fruta en esa posición
                        3. La fruta da puntos si Bub la recoge
                    */

                    // Crear una fruta en la posición de la burbuja
                    // El tipo de fruta depende de la oleada (oleadas más altas = mejores frutas)
                    const indiceFruta = Math.min(oleada - 1, TIPOS_FRUTAS.length - 1);
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

        // Colisión con el suelo
        if (fruta.y + fruta.alto > SUELO_Y) {
            fruta.y = SUELO_Y - fruta.alto;
            fruta.velocidadY = 0;
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

    // --- Verificar si completamos la oleada ---
    /*
        Ciro: Si el array de enemigos está vacío (length === 0),
        significa que eliminamos a todos. ¡Nueva oleada!

        Esto es como el bloque "si longitud de [lista] = 0" en Scratch.
    */
    if (enemigos.length === 0) {
        oleada = oleada + 1;  // Siguiente oleada

        // Cada oleada tiene más enemigos: oleada 1 = 3, oleada 2 = 4, oleada 3 = 5...
        // Pero máximo 8 para que no sea imposible
        const cantidadEnemigos = Math.min(2 + oleada, 8);

        // Bonus por completar oleada
        puntuacion = puntuacion + oleada * 50;

        // Crear la nueva oleada
        crearOleada(cantidadEnemigos);
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

    // Dibujar las plataformas
    /*
        Ciro: Usamos otro "for" para dibujar CADA plataforma de la lista.
        Todas se dibujan del mismo color, pero cada una en su posición.
    */
    for (let i = 0; i < plataformas.length; i++) {
        const plat = plataformas[i];
        // Parte principal de la plataforma
        ctx.fillStyle = '#00aa00';  // Verde oscuro
        ctx.fillRect(plat.x, plat.y, plat.ancho, plat.alto);

        // Un borde más claro arriba para dar efecto 3D
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(plat.x, plat.y, plat.ancho, 4);
    }

    // Dibujar a Bub (por ahora es un cuadrado, luego lo haremos bonito)
    ctx.fillStyle = bub.color;
    ctx.fillRect(bub.x, bub.y, bub.ancho, bub.alto);

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
        } else {
            // Enemigo atrapado: más transparente
            ctx.fillStyle = 'rgba(255, 100, 100, 0.7)';
            ctx.fillRect(enemigo.x, enemigo.y, enemigo.ancho, enemigo.alto);

            // Ojitos
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillRect(enemigo.x + 6, enemigo.y + 8, 6, 6);
            ctx.fillRect(enemigo.x + 16, enemigo.y + 8, 6, 6);
        }
    }

    // Dibujar puntuación y oleada
    ctx.fillStyle = '#ffff00';  // Amarillo
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Puntos: ' + puntuacion, 10, 25);

    // Mostrar oleada actual
    ctx.fillStyle = '#00ffff';  // Cyan
    ctx.fillText('Oleada: ' + oleada, 230, 25);

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

    // Dibujar instrucciones
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText('Flechas: mover | Arriba: saltar | Espacio: burbuja', 10, 470);

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

        // Oleada alcanzada
        ctx.fillStyle = '#00ffff';
        ctx.fillText('Llegaste a la oleada ' + oleada, canvas.width / 2, canvas.height / 2 + 45);

        // Instrucciones para reiniciar
        ctx.fillStyle = '#ffff00';
        ctx.font = '20px Arial';
        ctx.fillText('Presiona R para reiniciar', canvas.width / 2, canvas.height / 2 + 90);

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
