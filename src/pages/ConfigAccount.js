import "./style.css";

export default function ConfigAccount() {
    return (
        <div className="login-page">
            <div className="containerConfig">
                <div>
                    <h2>PJ</h2>

                    <h3>Quantas horas trabalha por dia?</h3>
                    <input placeholder="Horas"></input>

                    <h3>Quantos minutos?</h3>
                    <input placeholder="Minutos"></input>


                    <h3>Quanto ganha por hora?</h3>
                    <input placeholder="Ganha por hroa"></input>

                    <button>Salvar</button>
                </div>
                <div>
                    <h2>CLT</h2>
                </div>
            </div>
        </div>
    )
}

