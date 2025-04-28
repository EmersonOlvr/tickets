import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SenhasService {

  inputNovaSenha: string = '';
  public tiposDeSenha: any = {
    "SG": "Geral",
    "SP": "Prioritária",
    "SE": "Exame",
  };

  public qtdSenhasGeralGeradas: number = 0;
  public qtdSenhasPriorGeradas: number = 0;
  public qtdSenhasExameGeradas: number = 0;
  public qtdSenhasTotalGeradas: number = 0;
  public senhasGeradas: any[] = [];
  public senhasPendentes: any = {
    SG: [],
    SP: [],
    SE: [],
  };
  public senhasAtendidas: any[] = [];

  constructor() { }

  get qtdSenhasAtendidas() {
    return this.senhasAtendidas.length;
  }
  get qtdSenhasGeralAtendidas() {
    return this.senhasAtendidas.filter(s => s.tipo === 'SG').length;
  }
  get qtdSenhasPriorAtendidas() {
    return this.senhasAtendidas.filter(s => s.tipo === 'SP').length;
  }
  get qtdSenhasExameAtendidas() {
    return this.senhasAtendidas.filter(s => s.tipo === 'SE').length;
  }

  get hasSenhasPendentes(): boolean {
    return this.senhasPendentes.SG.length > 0 ||
      this.senhasPendentes.SP.length > 0 ||
      this.senhasPendentes.SE.length > 0;
  }

  get ultimaSenhaChamada(): any {
    if (!this.senhasAtendidas.length)
      return null;

    return this.senhasAtendidas[this.senhasAtendidas.length - 1];
  }

  get relatorio() {
    const atendidasMap = new Map(this.senhasAtendidas.map(s => [s.senha, {
      dataInicio: s.dataInicio,
      dataFim: s.dataFim,
      guicheIndex: s.guicheIndex,
    }]));

    return this.senhasGeradas.map(senha => {
      const atendimento = atendidasMap.get(senha.senha);

      return {
        ...senha,
        tipo: senha.tipo,
        dataAtendimento: atendimento?.dataInicio ?? null,
        dataFinalizacao: atendimento?.dataFim ?? null,
        guicheIndex: atendimento?.guicheIndex ?? null,
      }
    });
  }

  get mediasDeDuracao() {
    const duracoesPorTipo: { [tipo: string]: number[] } = {
      SG: [],
      SP: [],
      SE: [],
    };
    const todasDuracoes: number[] = [];

    this.relatorio.forEach(item => {
      if (item.dataAtendimento && item.dataFinalizacao) {
        const inicio = new Date(item.dataAtendimento).getTime();
        const fim = new Date(item.dataFinalizacao).getTime();
        const duracaoMs = fim - inicio;

        if (duracaoMs > 0) {
          duracoesPorTipo[item.tipo]?.push(duracaoMs);
          todasDuracoes.push(duracaoMs);
        }
      }
    });

    const calcularMedia = (duracoes: number[]) => {
      if (duracoes.length === 0) return 0;
      const soma = duracoes.reduce((acc, duracao) => acc + duracao, 0);
      return Math.round((soma / duracoes.length) / 60000); // converte de ms para minutos
    }

    return {
      SG: calcularMedia(duracoesPorTipo['SG']),
      SP: calcularMedia(duracoesPorTipo['SP']),
      SE: calcularMedia(duracoesPorTipo['SE']),
      total: calcularMedia(todasDuracoes),
    };
  }

  somaGeral() {
    this.qtdSenhasGeralGeradas++;
    this.qtdSenhasTotalGeradas++;
  }

  somaPrior() {
    this.qtdSenhasPriorGeradas++;
    this.qtdSenhasTotalGeradas++;
  }

  somaExame() {
    this.qtdSenhasExameGeradas++;
    this.qtdSenhasTotalGeradas++;
  }

  novaSenha(tipo: 'SG' | 'SP' | 'SE' = 'SG') {
    let deveDescartar = Math.random() * 100 < 5;

    if (tipo === 'SG') {
      this.inputNovaSenha =
        new Date().getFullYear().toString().substring(2, 4) +
        (new Date().getMonth() + 1).toString().padStart(2, '0') +
        new Date().getDate().toString().padStart(2, '0') +
        '-' +
        tipo +
        (this.qtdSenhasGeralGeradas + 1).toString().padStart(2, '0');

      if (!deveDescartar)
        this.senhasPendentes.SG.push(this.inputNovaSenha);

      this.senhasGeradas.push({ senha: this.inputNovaSenha, tipo: 'SG', dataCriacao: new Date(), descartada: deveDescartar });
      this.somaGeral();

    } else if (tipo === 'SP') {
      this.inputNovaSenha =
        new Date().getFullYear().toString().substring(2, 4) +
        (new Date().getMonth() + 1).toString().padStart(2, '0') +
        new Date().getDate().toString().padStart(2, '0') +
        '-' +
        tipo +
        (this.qtdSenhasPriorGeradas + 1).toString().padStart(2, '0');

      if (!deveDescartar)
        this.senhasPendentes.SP.push(this.inputNovaSenha);

      this.senhasGeradas.push({ senha: this.inputNovaSenha, tipo: 'SP', dataCriacao: new Date() });
      this.somaPrior();

    } else if (tipo === 'SE') {
      this.inputNovaSenha =
        new Date().getFullYear().toString().substring(2, 4) +
        (new Date().getMonth() + 1).toString().padStart(2, '0') +
        new Date().getDate().toString().padStart(2, '0') +
        '-' +
        tipo +
        (this.qtdSenhasExameGeradas + 1).toString().padStart(2, '0');

      if (!deveDescartar)
        this.senhasPendentes.SE.push(this.inputNovaSenha);

      this.senhasGeradas.push({ senha: this.inputNovaSenha, tipo: 'SE', dataCriacao: new Date() });
      this.somaExame();
    }

    console.log('senhasPendentes:', this.senhasPendentes);
  }

  obterProximaSenha() {
    if (this.senhasPendentes.SP.length)
      return {
        tipo: 'SP',
        senha: this.senhasPendentes.SP.shift(),
      };

    else if (this.senhasPendentes.SE.length)
      return {
        tipo: 'SE',
        senha: this.senhasPendentes.SE.shift(),
      };

    else if (this.senhasPendentes.SG.length)
      return {
        tipo: 'SG',
        senha: this.senhasPendentes.SG.shift(),
      };

    else
      return null;
  }

}
