// Add a hamburger menu to the header
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});


document.addEventListener('DOMContentLoaded', addClickToCards);

function addClickToCards() {
    const cards = document.querySelectorAll('.card');
    if (cards.length > 0) {
        cards.forEach(card => {
            const url = card.querySelector('.hidden-link').textContent.trim();
            if (url) {
                card.addEventListener('click', () => {
                    window.location.href = url;
                });
            }
            else {
                console.warn('No hidden link element found within the card.');
            }
        });
    }
}
