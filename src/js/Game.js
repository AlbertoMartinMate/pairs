import Box from './Box.js';

// Nombre con el que guardamos la partida en localStorage
const CLAVE = "partidaParejas";

export default class Game {
    constructor(tablero, mensaje, contadorIntentos, botonNueva) {
        // Elementos del HTML
        this.tablero = tablero;
        this.mensaje = mensaje;
        this.contadorIntentos = contadorIntentos;
        this.botonNueva = botonNueva;

        // Estado del juego
        this.cajas = [];                 // array de objetos Box
        this.seleccionada = null;        // Box pinchada y boca arriba
        this.bloqueado = false;          // true mientras se tapa un fallo
        this.parejasEncontradas = 0;
        this.inicio = null;              // momento en que empezó el cronómetro
        this.intentos = 0;
        this.guardarAlSalir = true;      // si es false, no se guarda al cerrar/recargar
        this.escucharEventos();
    }

    // Arranca el juego: nueva partida o la guardada
    iniciar(columnas, filas, guardada = null) {
        // 1. Guardar las medidas y calcular los pares
        this.columnas = columnas;
        this.filas = filas;
        this.pares = (columnas * filas) / 2;
        this.tablero.style.setProperty("--columnas", columnas);

        // 2. Limpiar la partida anterior
        this.tablero.textContent = "";
        this.mensaje.textContent = "";
        this.cajas = [];
        this.seleccionada = null;
        this.bloqueado = false;
        this.parejasEncontradas = 0;
        this.inicio = null;
        this.intentos = 0;
        this.guardarAlSalir = true;

        // 3. Crear la partida

        // Provisional: usamos solo los colores que hacen falta (máximo 15 pares)
        const colores = this.generarColores(this.pares);
        const orden = guardada ? guardada.orden : this.mezclar([...colores, ...colores]);

        this.crearCajas(orden);
        if (guardada) this.restaurar(guardada);

        this.mostrarIntentos();
    }

    arrancar() {
        const guardada = this.cargarPartida();

        if (guardada) {
            this.iniciar(guardada.columnas, guardada.filas, guardada);
        } else {
            this.mensaje.textContent = "Elige columnas y filas para empezar";
        }
    }

    // Baraja un array (Fisher-Yates)
    mezclar(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    //generamos colores
    generarColores(cantidad) {
        const colores = [];
        const luminosidades = [45, 60, 75];
        const desfase = Math.random() * 360;   // hace que cada partida tenga colores distintos

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

    mostrarIntentos() {
        this.contadorIntentos.textContent = this.intentos;
    }

    // ----- Guardado en localStorage -----

    cargarPartida() {
        try {
            const datos = JSON.parse(localStorage.getItem(CLAVE));
            if (
                datos &&
                Array.isArray(datos.orden) &&
                Number.isInteger(datos.columnas) &&
                Number.isInteger(datos.filas) &&
                datos.orden.length === datos.columnas * datos.filas
            )  {
                return datos;
            }
        } catch (error) {
            // dato corrupto: lo ignoramos y empezamos de cero
        }
        return null;
    }

    guardarPartida() {
        const emparejadas = [];
        this.cajas.forEach((caja, indice) => {
            if (caja.matched) emparejadas.push(indice);
        });

        const datos = {
            columnas: this.columnas,
            filas: this.filas,
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
        // Funciones flecha para que "this" siga siendo el juego dentro de cada método
        this.tablero.addEventListener("click", (event) => this.onClick(event));
        
        window.addEventListener("beforeunload", () => {
            if (this.guardarAlSalir && this.cajas.length > 0) this.guardarPartida();
        });

        this.botonNueva.addEventListener("click", () => {
            this.guardarAlSalir = false;
            localStorage.removeItem(CLAVE);
            location.reload();
        });
    }

    onClick(event) {
        const caja = this.obtenerCaja(event);

        // Ignora: fuera de una caja, mientras se tapa un fallo,
        // cajas ya emparejadas y la misma caja pulsada dos veces
        if (!caja || this.bloqueado || caja.matched || caja === this.seleccionada) return;

        // El cronómetro arranca en el primer clic
        if (this.inicio === null) this.inicio = Date.now();

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
        }, 700);
    }

    terminar() {
        const segundos = ((Date.now() - this.inicio) / 1000).toFixed(1);
        this.mensaje.textContent = `¡Lo has conseguido en ${segundos} segundos y ${this.intentos} intentos!`;
        this.guardarAlSalir = false;
        localStorage.removeItem(CLAVE);
    }
}