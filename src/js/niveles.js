// Cada nivel es un objeto con sus medidas y sus límites.
// Los límites son un punto de partida: se ajustan jugando.
export const NIVELES = [
    { id: "muy-facil",   nombre: "Muy fácil",   columnas: 2,  filas: 2,  maxIntentos: 4,  maxTiempo: 5 },
    { id: "facil",       nombre: "Fácil",       columnas: 2,  filas: 3,  maxIntentos: 6,  maxTiempo: 10 },
    { id: "facil-plus",  nombre: "Fácil +",     columnas: 2,  filas: 4,  maxIntentos: 9,  maxTiempo: 20 },
    { id: "normal",      nombre: "Normal",      columnas: 3,  filas: 4,  maxIntentos: 15, maxTiempo: 40 },
    { id: "normal-plus", nombre: "Normal +",    columnas: 4,  filas: 4,  maxIntentos: 18, maxTiempo: 60 },
    { id: "medio",       nombre: "Medio",       columnas: 4,  filas: 5,  maxIntentos: 26, maxTiempo: 90 },
    { id: "dificil",     nombre: "Difícil",     columnas: 5,  filas: 6,  maxIntentos: 30, maxTiempo: 100 },
    { id: "muy-dificil", nombre: "Muy difícil", columnas: 6,  filas: 8,  maxIntentos: 46, maxTiempo: 200 },
    { id: "experto",     nombre: "Experto",     columnas: 8,  filas: 10, maxIntentos: 70, maxTiempo: 400 },
    { id: "maestro",     nombre: "Maestro",     columnas: 10, filas: 10, maxIntentos: 85, maxTiempo: 800 }
];