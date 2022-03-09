fetch('nav.html')
.then(res => res.text())
.then(text => {
    const placeholder = document.querySelector('script#nav-bar')
    const navbar = document.createElement('nav')
    navbar.innerHTML = text
    placeholder.parentNode.replaceChild(navbar, placeholder)
})

function menuOnClick() {
    const nav = document.querySelector('nav')
    nav.classList.toggle('open-menu')
}

function bodyOnClick() {
    document.getElementById('nav-checkbox').checked=false
    const nav = document.querySelector('nav')
    nav.classList.remove('open-menu')
}