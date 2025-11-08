// src/utils/parseValor.js
export function parseValor(valor) {
    if (valor === "" || valor === null || valor === undefined) return 0;
    if (typeof valor === "string") valor = valor.replace(",", ".");
    const num = parseFloat(valor);
    return isNaN(num) ? 0 : num;
}
