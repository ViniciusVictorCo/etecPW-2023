  const BACK_CARD = "https://deckofcardsapi.com/static/img/back.png";

  // Temporizador para ações do rival
  const DEALER_PAUSE = 1500;

  document.addEventListener('alpine:init', () => {
    Alpine.data('app', () => ({

      async init() {
        await this.embaralhoCartas();
        await this.distribuiCartas();
      },

      // Embaralha as cartas usando deck of cards API
      async embaralhoCartas() {
        let response = await fetch(`https://www.deckofcardsapi.com/api/deck/new/shuffle/?deck_count=${this.deckSize}`);
        this.deck = await response.json();
      },

      // Lançe inicial embaralhado de 2 cartas para PC/Player
      async distribuiCartas() {

        // Primeiro para o Player, Depois para PC e assim sucessivamente
        this.playerCards.push(await this.drawCard());
        
        // Para o rival uma carta firacá virada
        let novaCarta = await this.drawCard();
        novaCarta.showback = true;
        this.pcCards.push(novaCarta);

        this.playerCards.push(await this.drawCard());
        this.pcCards.push(await this.drawCard());
      },

      async drawCard(count=1) {
        let resp = await fetch(`https://www.deckofcardsapi.com/api/deck/${this.deck.deck_id}/draw/?count=${count}`);
        let cardArr = await resp.json();
        let card = cardArr.cards[0];
        card.title = `${card.value} of ${card.suit}`;
        return card;
      },

      pegarConta(hand) {
        /*
        Para uma mão, retorno 2 valores, um valor baixo, onde ases são considerados 1s, e um valor alto, onde ases são 11. Observe que isso não consegue lidar adequadamente com um caso em que tenho 3 ases.
        e poderia ter uma mistura... embora pensando bem, você só pode ter UM ás em 11, então
        talvez a lógica seja: baixo == todos os ases em 1. alto = UM ás em 11. fixo!
        */
        let result = {};
        // primeiro faremos baixo, todos 1s
        let lowCount = 0;
        for(card of hand) {
          if(card.value === 'JACK' || card.value === 'KING' || card.value === 'QUEEN') lowCount+=10;
          else if(card.value === 'ACE') lowCount += 1;
          else lowCount += Number(card.value);
          // console.log(card);        
        }
        //console.log('lowCount', lowCount);
        let highCount = 0;
        let oneAce = false;
        for(card of hand) {
          if(card.value === 'JACK' || card.value === 'KING' || card.value === 'QUEEN') highCount+=10;
          else if(card.value === 'ACE') {
            if(oneAce) highCount += 1;
            else {
              highCount += 10;
              oneAce = true;
            }
          }
          else highCount += Number(card.value);
        }
        //console.log('highCount', highCount);
        return { lowCount, highCount };
      },

      async entregarMeBaralho() {
        this.hitMeDisabled = true;
        this.playerCards.push(await this.drawCard());
        let count = this.pegarConta(this.playerCards);
        if(count.lowCount >= 22) {
          this.playerTurn = false;
          this.playerBusted = true;
        }
        this.hitMeDisabled = false;
      },

      async novoJogo() {
        this.pcBusted = false;
        this.playerBusted = false;
        this.playerWon = false;
        this.pcWon = false;
        this.playerCards = [];
        this.pcCards = [];
        await this.embaralhoCartas();
        await this.distribuiCartas();
        this.playerTurn = true;
      },
      
      async ficarComBaralho() {
        this.playerTurn = false;
        this.pcTurn = true;
        this.startDealer();
      },
      async startDealer() {
        /*
        A ideia é: eu pego uma carta toda vez que tenho <17, então verifico minha mão
        e faço, veja se vou ficar ou bater. se for atingido, eu faço um atraso
        então o jogo não é instantâneo.
        */  

        // Aqui o pc esta realizando seu primeiro movimento
        this.pcText = 'O oponente vai virar a carta...';
        await delay(DEALER_PAUSE);

        // Primeira pause enquanto ele fala
        this.pcText = 'Oponente vai mostrar a carta...';
        await delay(DEALER_PAUSE);
        
        // Revela a segunda mão
        this.pcCards[0].showback = false;
        
        // Aqui onde decide quem vence tendo o numero mais próximo do 21
        let playerCount = this.pegarConta(this.playerCards);
        let playerScore = playerCount.lowCount;
        if(playerCount.highCount < 22) playerScore = playerCount.highCount;
        // console.log('dealer needs to beat', playerScore);

        // Agora será feito um looping até que tenha um vencedor
        let dealerLoop = true;
        while(dealerLoop) {
          let count = this.pegarConta(this.pcCards);
          
          /*
          NÃO estamos fazendo 'soft 17', então 1 ás sempre conta como 11
          */
          if(count.highCount <= 16) {

            this.pcText = 'Oponente decide se pega outra carta...';
            await delay(DEALER_PAUSE);
            this.pcCards.push(await this.drawCard());

          } else if(count.highCount <= 21) {

            this.pcText = 'Oponente não arrisca...';
            await delay(DEALER_PAUSE);
            dealerLoop = false;
            this.pcTurn = false;

            if(count.highCount >= playerScore) this.pcWon = true;
            else this.playerWon = true;

          } else {
            
            dealerLoop = false;
            this.pcTurn = false;
            this.pcBusted = true;
          }
        }
      },
      deckSize: 6,
      hitMeDisabled:false,
      playerCards:[], 
      pcCards:[],
      pcText:'',
      pcBusted: false,
      pcWon: false,
      playerBusted: false,
      playerWon: false, 
      pcTurn:false,
      playerTurn: true
    }))
  });

  async function delay(x) {
    return new Promise(resolve => {
      setTimeout(() => resolve(), x);
    });
  }


