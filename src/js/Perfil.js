// Perfil del jugador: solo un nombre, guardado en este navegador.
// Si algún día hay servidor, solo habría que cambiar el interior de estos métodos.
const CLAVE = "perfilParejas";

export default class Perfil {
    // Devuelve el nombre guardado o null si no hay
    obtener() {
        return localStorage.getItem(CLAVE);
    }

    guardar(nombre) {
        localStorage.setItem(CLAVE, nombre);
    }

    borrar() {
        localStorage.removeItem(CLAVE);
    }
}