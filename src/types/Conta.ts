import { Armazernador } from "./Armazenador.js";
import { ValidaDebito, ValidaDeposito } from "./Decorators.js";
import { GrupoTransacao } from "./GrupoTransacao.js";
import { TipoTransacao } from "./TipoTransacao.js";
import { Transacao } from "./Transacao.js";

export class Conta {
    protected nome: string
    protected saldo: number = Armazernador.obter<number>("saldo") || 0;
    private transacoes: Transacao[] = Armazernador.obter<Transacao[]>(("transacoes"), (key: string, value: any) => {
        if (key === "data") {
            return new Date(value);
        }
        return value;
    }) || [];

    constructor(nome: string) {
        this.nome = nome;
    }

    public getTitular() {
        return this.nome;
    }

    public getGruposTransacoes(): GrupoTransacao[] {
            const gruposTransacoes: GrupoTransacao[] = [];
            const listaTransacoes: Transacao[] = structuredClone(this.transacoes);
            const transacoesOrdenadas: Transacao[] = listaTransacoes.sort((t1, t2) => t2.data.getTime() - t1.data.getTime());
            let labelAtualGrupoTransacao: string = "";
    
            for (let transacao of transacoesOrdenadas) {
                let labelGrupoTransacao: string = transacao.data.toLocaleDateString("pt-br", { month: "long", year: "numeric" });
                if (labelAtualGrupoTransacao !== labelGrupoTransacao) {
                    labelAtualGrupoTransacao = labelGrupoTransacao;
                    gruposTransacoes.push({
                        label: labelGrupoTransacao,
                        transacoes: []
                    });
                }
                gruposTransacoes.at(-1).transacoes.push(transacao);
            }
    
            return gruposTransacoes;
    }

    public getSaldo() {
        return this.saldo;
    }

    public getDataAcesso(): Date {
        return new Date();
    }

    public registrarTransacao(novaTransacao: Transacao): void {
            if (novaTransacao.tipoTransacao == TipoTransacao.DEPOSITO) {
                this.depositar(novaTransacao.valor);
            } 
            else if (novaTransacao.tipoTransacao == TipoTransacao.TRANSFERENCIA || novaTransacao.tipoTransacao == TipoTransacao.PAGAMENTO_BOLETO) {
                this.depositar(novaTransacao.valor);
                novaTransacao.valor *= -1;
            } 
            else {
                throw new Error("Tipo de Transação é inválido!");
            }
    
            this.transacoes.push(novaTransacao);
            console.log(this.getGruposTransacoes());
            Armazernador.salvar("transacoes", JSON.stringify(this.transacoes));
    }

    @ValidaDebito
    protected debitar(valor: number): void {
        this.saldo -= valor;
        Armazernador.salvar("saldo", this.saldo.toString());
    }

    @ValidaDeposito
    protected depositar(valor: number): void {
        this.saldo += valor;
        Armazernador.salvar("saldo", this.saldo.toString());
    }
}

export class ContaPremium extends Conta {
    registrarTransacao(transacao: Transacao): void {
        if (transacao.tipoTransacao === TipoTransacao.DEPOSITO) {
            console.log("Ganhou um bônus de 0.50 centavos");
            super.registrarTransacao(transacao)
        }
    }
}

const conta = new Conta("Joana da Silva Oliveira");
const contaPremium = new ContaPremium("Yan Carlo");

export default conta;