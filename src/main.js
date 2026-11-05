import '../sass/estilos.scss';
import Game from './js/Game.js';

const juego = new Game(
    document.getElementById("tablero"),
    document.getElementById("mensaje"),
    document.getElementById("intentos"),
    document.getElementById("nueva-partida"),
);
juego.arrancar();

// Si se ha restaurado una partida, reflejar sus medidas en los inputs
if (juego.columnas) {
    document.getElementById("columnas").value = juego.columnas;
    document.getElementById("filas").value = juego.filas;
}

const formulario = document.getElementById("config");

formulario.addEventListener("submit", (event) => {
    // 1. Evita que el formulario recargue la página al enviarse
    event.preventDefault();

    // 2. Lee los valores de los inputs y los convierte a número
    const columnas = Number(document.getElementById("columnas").value);
    const filas = Number(document.getElementById("filas").value);

    const total = columnas * filas;

    if (!Number.isInteger(columnas) || !Number.isInteger(filas)) {
        mensaje.textContent = "Introduce números enteros";
        return;
    
    }

    if (total%2 !== 0) {
        mensaje.textContent = "Introduce un numero de columnas y filas que den un número par ";
        return;
    }

    // si llega aquí, los datos son válidos
    mensaje.textContent = "";
    juego.iniciar(columnas, filas);
});