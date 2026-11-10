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

const panelRanking = document.getElementById("ranking-panel");
const selectRanking = document.getElementById("ranking-nivel");
const listaRanking = document.getElementById("ranking");
const rankingVacio = document.getElementById("ranking-vacio");

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

// Rellena el selector con todas las modalidades
NIVELES.forEach((nivel) => {
    const opcion = document.createElement("option");
    opcion.value = nivel.id;
    opcion.textContent = `${nivel.nombre} (${nivel.columnas} x ${nivel.filas})`;
    selectRanking.appendChild(opcion);
});

// Pinta el top 5 de la modalidad elegida en el selector
function mostrarRanking() {
    listaRanking.textContent = "";

    const lista = ranking.obtener(selectRanking.value);
    rankingVacio.hidden = lista.length > 0;

    lista.forEach((registro) => {
        const li = document.createElement("li");
        const segundos = (registro.tiempo / 1000).toFixed(1);
        li.textContent = `${registro.nombre} — ${segundos} s (${registro.intentos} intentos)`;
        listaRanking.appendChild(li);
    });
}

// Al cambiar de modalidad en el selector, se actualiza la lista
selectRanking.addEventListener("change", mostrarRanking);

// Game avisa aquí cuando se GANA una partida de un nivel con ranking
juego.alTerminar = ({ nivelId, tiempo, intentos }) => {
    const nombre = perfil.obtener();

    if (nombre === null) {
        mensaje.textContent += " Escribe tu nombre arriba para guardar tus récords.";
    } else {
        const entro = ranking.guardar(nivelId, { nombre, tiempo, intentos, fecha: Date.now() });
        if (entro) mensaje.textContent += " ¡Estás en el top 5!";
    }

    // Enseña el ranking de ese nivel, desplegado
    selectRanking.value = nivelId;
    mostrarRanking();
    panelRanking.open = true;
};

// ----- Partidas -----

// Si hay una partida empezada, pide confirmación antes de abandonarla
function puedeCambiar() {
    return !juego.enCurso || confirm("Tienes una partida en curso. ¿Seguro que quieres abandonarla?");
}

// Empieza una partida; si es un nivel, el selector se coloca en esa modalidad
function empezar(config) {
    juego.iniciar(config);

    if (config.id) {
        selectRanking.value = config.id;
        mostrarRanking();
    }
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

// Si se restauró una partida de un nivel, el selector se coloca en ese nivel
if (juego.config && juego.config.id !== null) {
    selectRanking.value = juego.config.id;
}
mostrarRanking();

// Si se restauró una partida del modo personalizado, refleja sus medidas
if (juego.config && juego.config.id === null) {
    document.getElementById("columnas").value = juego.config.columnas;
    document.getElementById("filas").value = juego.config.filas;
}