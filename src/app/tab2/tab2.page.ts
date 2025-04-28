import { SenhasService } from './../services/senhas.service';
import { Component } from '@angular/core';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page {

  qtdQuiches: number = 4;
  quiches: any[] = Array(this.qtdQuiches).fill(0);
  atendimentosAtuais: any = {};

  temposRestantes: string[] = [];
  intervalId: any;

  constructor(public senhasService: SenhasService) { }

  ngOnInit() {
    this.temposRestantes = this.quiches.map(() => '');
    this.updateTimers();
    this.startTimers();
  }

  updateTimers() {
    const now = new Date().getTime();

    this.quiches.forEach((_, index) => {
      const atendimento = this.atendimentosAtuais[index];
      if (atendimento) {
        const fim = new Date(atendimento.dataFim).getTime();
        const diff = fim - now;

        if (diff <= 0) {
          delete this.atendimentosAtuais[index];
        } else {
          this.temposRestantes[index] = this.formatarTempo(diff);
        }
      }
    });
  }

  startTimers() {
    this.intervalId = setInterval(() => {
      this.updateTimers();
    }, 1000);
  }

  formatarTempo(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutos = Math.floor(totalSeconds / 60);
    const segundos = totalSeconds % 60;

    if (minutos > 0) {
      return `${minutos} min e ${segundos} seg`;
    } else {
      return `${segundos} seg`;
    }
  }

  chamarProximaSenha(guicheIndex: number) {
    let proximaSenha = this.senhasService.obterProximaSenha();

    if (proximaSenha !== null) {
      console.log(`Chamando próxima senha para o guichê ${guicheIndex + 1}:`, proximaSenha);

      let inicioAtendimento = new Date();
      let fimAtendimento = new Date(inicioAtendimento.getTime());

      if (proximaSenha.tipo === 'SG') {
        // (os 5 minutos) varia em igual proporção 3 minutos para baixo ou para cima
        const duracaoEmMinutosSorteada = this.obterTMAleatorio(2, 8);

        fimAtendimento.setMinutes(fimAtendimento.getMinutes() + duracaoEmMinutosSorteada);

      } else if (proximaSenha.tipo === 'SP') {
        // (os 15 minutos) pode variar aleatoriamente 5 minutos para baixo ou para cima, em igual distribuição
        const duracaoEmMinutosSorteada = this.obterTMAleatorio(10, 20);

        fimAtendimento.setMinutes(fimAtendimento.getMinutes() + duracaoEmMinutosSorteada);

      } else if (proximaSenha.tipo === 'SE') {
        // pode variar entre 1 minuto para 95% dos SA e 5 minutos para 5% dos SA
        const duracaoEmMinutosSorteada = this.obterTMAleatorioParaSE();

        fimAtendimento.setMinutes(fimAtendimento.getMinutes() + duracaoEmMinutosSorteada);
      }

      this.atendimentosAtuais[guicheIndex] = {
        senha: proximaSenha.senha,
        dataInicio: inicioAtendimento,
        dataFim: fimAtendimento
      };
      this.updateTimers();

      this.senhasService.senhasAtendidas.push({
        senha: proximaSenha.senha,
        tipo: proximaSenha.tipo,
        guicheIndex,
        dataInicio: inicioAtendimento,
        dataFim: fimAtendimento,
      });

      console.log('senhasAtendidas:', this.senhasService.senhasAtendidas);

    } else {
      console.log('Não há senhas a serem chamadas!');
    }
  }

  finalizarAtendimento(guicheIndex: number) {
    if (this.atendimentosAtuais[guicheIndex]) {
      const dataAtual = new Date();
      this.atendimentosAtuais[guicheIndex].dataFim = dataAtual;

      let findedIndex = this.senhasService.senhasAtendidas.findIndex(s => s.senha === this.atendimentosAtuais[guicheIndex].senha);
      if (findedIndex >= 0)
        this.senhasService.senhasAtendidas[findedIndex].dataFim = dataAtual;

      this.updateTimers();
    }
  }

  obterTMAleatorio(min: number, max: number) {
    min = Math.ceil(min); // arredonda o mínimo para cima (caso não seja inteiro)
    max = Math.floor(max); // arredonda o máximo para baixo (caso não seja inteiro)
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  obterTMAleatorioParaSE(): number {
    const chance = Math.random() * 100; // número de 0 a 100

    if (chance < 95) {
      return 1; // 95% dos casos
    } else {
      return 5; // 5% dos casos
    }
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

}
