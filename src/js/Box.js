export default class Box {
    constructor(color, indice) {
        this.color = color;
        this.indice = indice;
        this.matched = false;

        this.element = document.createElement("div");
        this.element.classList.add("caja");
        this.element.dataset.indice = indice;
    }

    reveal() {
        this.element.style.backgroundColor = this.color;
        this.element.classList.add("revelada");
    }

    hide() {
        this.element.style.backgroundColor = "black";
        this.element.classList.remove("revelada");
    }

    match() {
        this.matched = true;
        this.element.style.backgroundColor = this.color;
        this.element.classList.remove("revelada");
        this.element.classList.add("emparejada");
    }
}