let deckId = '';
const newDeckBtn = document.getElementById('new-deck-btn');
const drawCardBtn = document.getElementById('draw-card-btn');
let cardsContainer = document.getElementById('cards-container');

newDeckBtn.addEventListener('click', () => {
    fetch('https://deckofcardsapi.com/api/deck/new/')
        .then(res => res.json())
        .then(data => {
            console.log(deckId)
            deckId = data.deck_id;
        })
})

drawCardBtn.addEventListener('click', () => {
    fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=52`)
        .then(res => res.json())
        .then(data => {
            console.log(data)
            for(let i = 0; i < data.cards.length; i++) {
                cardsContainer.children[i].innerHTML = `<img src="${data.cards[i].image}"/>`
            }
        })
})


