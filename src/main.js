import '../sass/estilos.scss';
import Game from './js/Game.js';
import Perfil from './js/Perfil.js';
import Ranking from './js/Ranking.js';
import { NIVELES } from './js/niveles.js';

const juego = new Game(
    document.getElementById("tablero"),
    document.getElementById("mensaje"),
    document.getElementById("intentos"),
    document.getElementById("tiempo")
);
const perfil = new Perfil();
const ranking = new Ranking();

// Elementos del HTML
const mensaje = document.getElementById("mensaje");
const formulario = document.getElementById("config");
const contenedorNiveles = document.getElementById("niveles");
const botonNueva = document.getElementById("nueva-partida");

const formPerfil = document.getElementById("form-perfil");
const inputNombre = document.getElementById("nombre");
const saludo = document.getElementById("saludo");
const nombreJugador = document.getElementById("nombre-jugador");
const botonCambiar = document.getElementById("cambiar-jugador");

const tituloRanking = document.getElementById("titulo-ranking");
const listaRanking = document.getElementById("ranking");

// ----- Perfil -----

// Muestra el formulario de nombre o el saludo, según haya perfil o no
function pintarPerfil() {
    const nombre = perfil.obtener();
    formPerfil.hidden = nombre !== null;
    saludo.hidden = nombre === null;
    nombreJugador.textContent = nombre ?? "";   // textContent: nunca se interpreta como HTML
}

formPerfil.addEventListener("submit", (event) => {
    event.preventDefault();
    const nombre = inputNombre.value.trim().slice(0, 12);
    if (!nombre) return;

    perfil.guardar(nombre);
    inputNombre.value = "";
    pintarPerfil();
});

// Cambiar de jugador solo borra el nombre; los récords ya guardados se mantienen
botonCambiar.addEventListener("click", () => {
    perfil.borrar();
    pintarPerfil();
});

// ----- Ranking -----

// Pinta el top 5 del nivel actual (en el modo personalizado no hay ranking)
function mostrarRanking() {
    listaRanking.textContent = "";

    const id = juego.config ? juego.config.id : null;
    tituloRanking.hidden = id === null;
    listaRanking.hidden = id === null;
    if (id === null) return;

    const nivel = NIVELES.find((n) => n.id === id);
    tituloRanking.textContent = `Top 5 · ${nivel.nombre}`;

    const lista = ranking.obtener(id);
    if (lista.length === 0) {
        const vacio = document.createElement("li");
        vacio.textContent = "Todavía no hay récords";
        listaRanking.appendChild(vacio);
        return;
    }

    lista.forEach((registro) => {
        const li = document.createElement("li");
        const segundos = (registro.tiempo / 1000).toFixed(1);
        li.textContent = `${registro.nombre} — ${segundos} s (${registro.intentos} intentos)`;
        listaRanking.appendChild(li);
    });
}

// Game avisa aquí cuando se GANA una partida de un nivel con ranking
juego.alTerminar = ({ nivelId, tiempo, intentos }) => {
    const nombre = perfil.obtener();

    if (nombre === null) {
        mensaje.textContent += " Escribe tu nombre arriba para guardar tus récords.";
        return;
    }

    const entro = ranking.guardar(nivelId, { nombre, tiempo, intentos, fecha: Date.now() });
    if (entro) mensaje.textContent += " ¡Estás en el top 5!";

    mostrarRanking();
};

// ----- Partidas -----

// Si hay una partida empezada, pide confirmación antes de abandonarla
function puedeCambiar() {
    return !juego.enCurso || confirm("Tienes una partida en curso. ¿Seguro que quieres abandonarla?");
}

// Empieza una partida y actualiza el ranking mostrado
function empezar(config) {
    juego.iniciar(config);
    mostrarRanking();
}

// Un botón por cada nivel de la tabla
NIVELES.forEach((nivel) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.textContent = `${nivel.nombre} (${nivel.columnas} x ${nivel.filas})`;

    boton.addEventListener("click", () => {
        if (!puedeCambiar()) return;
        empezar(nivel);
    });

    contenedorNiveles.appendChild(boton);
});

// Nueva partida: reinicia con la misma modalidad
botonNueva.addEventListener("click", () => {
    if (!juego.config) return;   // todavía no se ha elegido modalidad
    if (!puedeCambiar()) return;
    empezar(juego.config);
});

// Modo personalizado (sin límites ni récords)
formulario.addEventListener("submit", (event) => {
    event.preventDefault();

    const columnas = Number(document.getElementById("columnas").value);
    const filas = Number(document.getElementById("filas").value);
    const total = columnas * filas;

    if (!Number.isInteger(columnas) || !Number.isInteger(filas)) {
        mensaje.textContent = "Introduce números enteros";
        return;
    }

    if (total % 2 !== 0) {
        mensaje.textContent = "Introduce un número de columnas y filas que dé un número par de cajas";
        return;
    }

    if (!puedeCambiar()) return;

    mensaje.textContent = "";
    empezar({ columnas, filas });
});

// ----- Arranque -----

pintarPerfil();
juego.arrancar();   // continúa la partida guardada (si la hay)
mostrarRanking();

// Si se restauró una partida del modo personalizado, refleja sus medidas
if (juego.config && juego.config.id === null) {
    document.getElementById("columnas").value = juego.config.columnas;
    document.getElementById("filas").value = juego.config.filas;
}