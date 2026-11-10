// Ranking local: los 5 mejores resultados de cada nivel.
// Se guarda como { "normal": [ {nombre, tiempo, intentos, fecha}, ... ], "facil": [...] }
const CLAVE = "rankingParejas";
const MAX_REGISTROS = 5;

export default class Ranking {
    // Lee todo el ranking (o un objeto vacío si no hay nada o está corrupto)
    leerTodo() {
        try {
            const datos = JSON.parse(localStorage.getItem(CLAVE));
            return datos && typeof datos === "object" ? datos : {};
        } catch (error) {
            return {};
        }
    }

    // Lista ordenada de los mejores resultados de un nivel
    obtener(nivelId) {
        const lista = this.leerTodo()[nivelId];
        return Array.isArray(lista) ? lista : [];
    }

    // Añade un resultado. Devuelve true si ha entrado en el top 5.
    // Orden: menos tiempo primero; a igualdad de tiempo, menos intentos.
    guardar(nivelId, registro) {
        const todo = this.leerTodo();
        const lista = this.obtener(nivelId);

        lista.push(registro);
        lista.sort((a, b) => a.tiempo - b.tiempo || a.intentos - b.intentos);

        todo[nivelId] = lista.slice(0, MAX_REGISTROS);
        localStorage.setItem(CLAVE, JSON.stringify(todo));

        return todo[nivelId].includes(registro);
    }
}