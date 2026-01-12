import { useState } from "react";
import { parseValor } from "./utils";

export default function Lista({ itens, tipo, onRemover, onEditar, onAddValor }) {
    const [editIndex, setEditIndex] = useState(null);
    const [editItem, setEditItem] = useState({});
    const [addValueIndex, setAddValueIndex] = useState(null);
    const [addValue, setAddValue] = useState("");

    const togglePago = (i) => {
        const item = itens[i];
        const atualizado = { ...item, pago: !item.pago };
        onEditar(i, atualizado);
    };

    return (
        <div className="backgroundLista">
            <ul>
                {itens.map((item, i) => (
                    <li
                        key={i}
                        className={item.pago ? "item-pago" : ""}
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            opacity: item.pago ? 0.6 : 1,
                            textDecoration: item.pago ? "line-through" : "none",
                        }}
                    >
                        {editIndex === i ? (
                            <>
                                <input
                                    className="list"
                                    type="text"
                                    value={editItem.nome}
                                    onChange={(e) => setEditItem({ ...editItem, nome: e.target.value })}
                                />
                                <input
                                    className="list"
                                    type="number"
                                    value={editItem.valor}
                                    onChange={(e) => setEditItem({ ...editItem, valor: parseValor(e.target.value) })}
                                />

                                <div className="acoes-item">
                                    <button
                                        className="btn-acao salvar"
                                        onClick={() => {
                                            onEditar(i, editItem);
                                            setEditIndex(null);
                                        }}
                                        title="Salvar alterações"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </button>

                                    <button
                                        className="btn-acao cancelar"
                                        onClick={() => setEditIndex(null)}
                                        title="Cancelar edição"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </button>
                                </div>
                            </>
                        ) : addValueIndex === i ? (
                            <>
                                <span>{item.nome} - R$ {item.valor.toFixed(2)}</span>
                                <input
                                    className="list"
                                    type="number"
                                    placeholder="Valor a adicionar"
                                    value={addValue}
                                    onChange={(e) => setAddValue(e.target.value)}
                                />

                                <div className="acoes-item">
                                    <button
                                        className="btn-acao salvar"
                                        onClick={() => {
                                            const valorSomado = item.valor + parseValor(addValue || 0);
                                            onAddValor(i, valorSomado);
                                            setAddValue("");
                                            setAddValueIndex(null);
                                        }}
                                        title="Adicionar valor"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="12" y1="8" x2="12" y2="16"></line>
                                            <line x1="8" y1="12" x2="16" y2="12"></line>
                                        </svg>
                                    </button>

                                    <button
                                        className="btn-acao cancelar"
                                        onClick={() => setAddValueIndex(null)}
                                        title="Cancelar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <span>
                                    {tipo === "gasto" && `${item.nome} - R$ ${item.valor.toFixed(2)}`}
                                    {tipo === "extra" && `${item.horas}h ${item.minutos}m - R$ ${item.valorHora.toFixed(2)}/h`}
                                    {tipo === "banco" && (
                                        <>
                                            {item.ehMeu === false
                                                ? `${item.nome} - de ${item.dono} - R$ ${item.valor.toFixed(2)}`
                                                : `${item.nome} - R$ ${item.valor.toFixed(2)}`}
                                        </>
                                    )}
                                    {" "}
                                    <strong style={{ color: item.pago ? "green" : "red" }}>
                                        ({item.pago ? "Pago" : "Pendente"})
                                    </strong>
                                </span>

                                <div className="acoes-item">
                                    {tipo !== "extra" && (
                                        <button
                                            className="btn-acao pago"
                                            onClick={() => togglePago(i)}
                                            title={item.pago ? "Marcar como não pago" : "Marcar como pago"}
                                        >
                                            <span className="iconPay">
                                                {item.pago ? "💸" : "⬜"}
                                            </span>
                                        </button>
                                    )}

                                    {tipo !== "extra" && (
                                        <button
                                            className="btn-acao adicionar"
                                            onClick={() => { setAddValueIndex(i); setAddValue(""); }}
                                            title="Adicionar ao valor"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <line x1="12" y1="8" x2="12" y2="16"></line>
                                                <line x1="8" y1="12" x2="16" y2="12"></line>
                                            </svg>
                                        </button>
                                    )}
                                    {tipo !== "extra" && (
                                        <button
                                            className="btn-acao editar"
                                            onClick={() => { setEditIndex(i); setEditItem(item); }}
                                            title="Editar item"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 20h9"></path>
                                                <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"></path>
                                            </svg>
                                        </button>
                                    )}
                                    <button
                                        className="btn-acao remover"
                                        onClick={() => onRemover(i)}
                                        title="Remover item"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                                            <line x1="10" y1="11" x2="10" y2="17"></line>
                                            <line x1="14" y1="11" x2="14" y2="17"></line>
                                        </svg>
                                    </button>
                                </div>
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
