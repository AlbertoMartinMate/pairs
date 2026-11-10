import Box from './Box.js';

// Nombre con el que guardamos la partida en localStorage
const CLAVE = "partidaParejas";

// Pasa segundos a formato m:ss (75 -> "1:15")
function formatear(segundos) {
    const minutos = Math.floor(segundos / 60);
    const resto = segundos % 60;
    return `${minutos}:${String(resto).padStart(2, "0")}`;
}

export default class Game {
    constructor(tablero, mensaje, contadorIntentos, contadorTiempo) {
        // Elementos del HTML
        this.tablero = tablero;
        this.mensaje = mensaje;
        this.contadorIntentos = contadorIntentos;
        this.contadorTiempo = contadorTiempo;

        // Configuración de la partida actual: { id, columnas, filas, maxIntentos, maxTiempo }
        this.config = null;
        this.alTerminar = null;   // función que asigna main.js para avisar de una victoria

        // Estado del juego
        this.cajas = [];                 // array de objetos Box
        this.seleccionada = null;        // primera Box levantada de un intento
        this.bloqueado = false;          // true mientras se tapa un fallo
        this.terminada = false;          // true cuando se gana o se pierde
        this.parejasEncontradas = 0;
        this.pares = 0;
        this.inicio = null;              // momento en que empezó el cronómetro
        this.intentos = 0;
        this.reloj = null;               // id del setInterval
        this.guardarAlSalir = true;      // si es false, no se guarda al cerrar/recargar

        this.escucharEventos();          // se registra una sola vez
    }

    // true si hay una partida empezada (alguna pareja acertada) y sin terminar
    get enCurso() {
        return this.parejasEncontradas > 0 && !this.terminada;
    }

    // Al cargar la página: continúa la partida guardada (si la hay)
    arrancar() {
        const guardada = this.cargarPartida();
        if (guardada) {
            this.iniciar(guardada.config, guardada);
        }
    }

    // Empieza una partida con la configuración dada (nueva o restaurada)
    iniciar(config, guardada = null) {
        this.pararReloj();

        // 1. Guardar la configuración (los límites son null en el modo personalizado)
        this.config = {
            id: config.id ?? null,
            columnas: config.columnas,
            filas: config.filas,
            maxIntentos: config.maxIntentos ?? null,
            maxTiempo: config.maxTiempo ?? null
        };
        this.pares = (this.config.columnas * this.config.filas) / 2;
        this.tablero.style.setProperty("--columnas", this.config.columnas);

        // 2. Limpiar la partida anterior
        this.tablero.textContent = "";
        this.mensaje.textContent = "";
        this.cajas = [];
        this.seleccionada = null;
        this.bloqueado = false;
        this.terminada = false;
        this.parejasEncontradas = 0;
        this.inicio = null;
        this.intentos = 0;
        this.guardarAlSalir = true;

        // 3. Crear la partida
        const colores = this.generarColores(this.pares);
        const orden = guardada ? guardada.orden : this.mezclar([...colores, ...colores]);

        this.crearCajas(orden);
        if (guardada) this.restaurar(guardada);

        this.mostrarIntentos();

        // Si ya había tiempo corriendo, el reloj continúa; si no, se muestra 0:00
        if (this.inicio !== null) {
            this.arrancarReloj();
        } else {
            this.actualizarTiempo();
        }

        // Por si se recargó justo tras gastar el último intento
        if (this.sinIntentos()) this.perder("intentos");
    }

    // Baraja un array (Fisher-Yates)
    mezclar(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Genera "cantidad" colores distintos con hsl()
    generarColores(cantidad) {
        const colores = [];
        const luminosidades = [45, 60, 75];
        const desfase = Math.random() * 360;

        for (let i = 0; i < cantidad; i++) {
            const tono = (desfase + i * 137.5) % 360;
            const luz = luminosidades[i % luminosidades.length];
            colores.push(`hsl(${tono}, 80%, ${luz}%)`);
        }
        return colores;
    }

    // Crea un objeto Box por cada color y lo añade al tablero
    crearCajas(orden) {
        this.cajas = orden.map((color, indice) => {
            const caja = new Box(color, indice);
            this.tablero.appendChild(caja.element);
            return caja;
        });
    }

    // A partir de un evento, devuelve el objeto Box pulsado (o null)
    obtenerCaja(event) {
        const elemento = event.target.closest(".caja");
        return elemento ? this.cajas[Number(elemento.dataset.indice)] : null;
    }

    // ----- Intentos y tiempo -----

    // true si hay límite de intentos y ya se han gastado todos
    sinIntentos() {
        return this.config.maxIntentos !== null && this.intentos >= this.config.maxIntentos;
    }

    mostrarIntentos() {
        const max = this.config.maxIntentos;
        this.contadorIntentos.textContent = max === null ? this.intentos : `${this.intentos} / ${max}`;
    }

    arrancarReloj() {
        this.pararReloj();
        this.reloj = setInterval(() => this.actualizarTiempo(), 250);
        this.actualizarTiempo();
    }

    pararReloj() {
        clearInterval(this.reloj);
        this.reloj = null;
    }

    // Pinta el tiempo y comprueba si se ha agotado
    actualizarTiempo() {
        if (!this.config) return;

        const segundos = this.inicio === null ? 0 : Math.floor((Date.now() - this.inicio) / 1000);
        const max = this.config.maxTiempo;

        this.contadorTiempo.textContent = max === null
            ? formatear(segundos)
            : `${formatear(segundos)} / ${formatear(max)}`;

        if (max !== null && segundos >= max && !this.terminada) {
            this.perder("tiempo");
        }
    }

    // ----- Guardado en localStorage -----

    cargarPartida() {
        try {
            const datos = JSON.parse(localStorage.getItem(CLAVE));
            if (
                datos &&
                Array.isArray(datos.orden) &&
                datos.config &&
                Number.isInteger(datos.config.columnas) &&
                Number.isInteger(datos.config.filas) &&
                datos.orden.length === datos.config.columnas * datos.config.filas
            ) {
                return datos;
            }
        } catch (error) {
            // dato corrupto: lo ignoramos
        }
        return null;
    }

    guardarPartida() {
        const emparejadas = [];
        this.cajas.forEach((caja, indice) => {
            if (caja.matched) emparejadas.push(indice);
        });

        const datos = {
            config: this.config,
            orden: this.cajas.map((caja) => caja.color),
            emparejadas: emparejadas,
            intentos: this.intentos,
            tiempo: this.inicio === null ? 0 : Date.now() - this.inicio
        };

        localStorage.setItem(CLAVE, JSON.stringify(datos));
    }

    restaurar(guardada) {
        guardada.emparejadas.forEach((indice) => this.cajas[indice].match());

        this.parejasEncontradas = guardada.emparejadas.length / 2;
        this.intentos = guardada.intentos;

        if (guardada.tiempo > 0) {
            this.inicio = Date.now() - guardada.tiempo;
        }
    }

    // ----- Eventos -----

    escucharEventos() {
        this.tablero.addEventListener("click", (event) => this.onClick(event));

        window.addEventListener("beforeunload", () => {
            if (this.guardarAlSalir && this.cajas.length > 0) this.guardarPartida();
        });
    }

    onClick(event) {
        const caja = this.obtenerCaja(event);

        // Ignora: fuera de una caja, fallo en curso, partida terminada,
        // cajas emparejadas y la misma caja pulsada dos veces
        if (!caja || this.bloqueado || this.terminada || caja.matched || caja === this.seleccionada) return;

        // El cronómetro arranca en el primer clic
        if (this.inicio === null) {
            this.inicio = Date.now();
            this.arrancarReloj();
        }

        caja.reveal();

        // Primera caja del intento: la guardamos y esperamos la segunda
        if (!this.seleccionada) {
            this.seleccionada = caja;
            return;
        }

        // Segunda caja: comparamos
        const origen = this.seleccionada;
        this.intentos++;
        this.mostrarIntentos();

        if (origen.color === caja.color) {
            this.acierto(origen, caja);
        } else {
            this.fallo(origen, caja);
        }
    }

    acierto(origen, destino) {
        origen.match();
        destino.match();
        this.seleccionada = null;
        this.parejasEncontradas++;

        if (this.parejasEncontradas === this.pares) {
            this.terminar();
        } else if (this.sinIntentos()) {
            this.perder("intentos");
        } else {
            this.guardarPartida();
        }
    }

    fallo(origen, destino) {
        this.bloqueado = true;
        this.guardarPartida();

        setTimeout(() => {
            origen.hide();
            destino.hide();
            this.seleccionada = null;
            this.bloqueado = false;

            // Si era el último intento permitido, se acaba el juego
            if (this.sinIntentos()) this.perder("intentos");
        }, 700);
    }

    // ----- Fin de partida -----

    terminar() {
        this.terminada = true;
        this.actualizarTiempo();   // deja el reloj con el tiempo final
        this.pararReloj();

        const segundos = ((Date.now() - this.inicio) / 1000).toFixed(1);
        this.mensaje.textContent = `¡Lo has conseguido en ${segundos} segundos y ${this.intentos} intentos!`;

        this.guardarAlSalir = false;
        localStorage.removeItem(CLAVE);

        if (this.config.id !== null && this.alTerminar) {
            this.alTerminar({
                nivelId: this.config.id,
                tiempo: Date.now() - this.inicio,
                intentos: this.intentos
            });
        }
    }

    perder(motivo) {
        if (this.terminada) return;   // evita avisar dos veces
        this.terminada = true;
        this.pararReloj();

        this.mensaje.textContent = motivo === "tiempo"
            ? "Se acabó el tiempo. ¡Inténtalo de nuevo!"
            : "Has agotado los intentos. ¡Inténtalo de nuevo!";

        this.guardarAlSalir = false;
        localStorage.removeItem(CLAVE);
    }
}