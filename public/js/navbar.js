console.log("navbar.js loaded");
console.log(document.querySelector(".nav"));

function inverseMousePosition(element, event) {
  const rect = element.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const res = {
    x1: -(x - rect.width / 2) / 20, // top left
    y1: -(y - rect.height / 2) / 20,
    x2: -(x - rect.width / 2) / 20, // top right
    y2: (y - rect.height / 2) / 20,
    x3: (x - rect.width / 2) / 20, // bottom left
    y3: -(y - rect.height / 2) / 20,
    x4: (x - rect.width / 2) / 20, // bottom right
    y4: (y - rect.height / 2) / 20
  };

  const resKey =
    "x" + (x < rect.width / 2 ? 1 : 2) + (y < rect.height / 2 ? 1 : 3);
  const tilt = res;
  return tilt !== undefined ? tilt : 0; // default to 0 if undefined
}

function handleClick(event) {
  const nav = document.querySelector('.nav');
  const target = event.target.parentNode;
  const width = target.offsetWidth;
  const { left } = target.getBoundingClientRect();
  const offsetLeft = left - nav.getBoundingClientRect().left;

  [...nav.querySelectorAll('li')].map(link => link.classList.remove('active'))
  event.target.parentNode.classList.add('active');

  nav.style.setProperty('--after-bg-position', offsetLeft);
  nav.style.setProperty('--after-radial-bg-position', (left + width / 2) - nav.getBoundingClientRect().left);
  nav.style.setProperty('--after-bg-width', width);
}

const nav = document.querySelector('.nav');

const links = nav.querySelectorAll('li a');

for (let i = 0; i < links.length; i++) {
  links[i].addEventListener('click', handleClick);
  links[i].addEventListener("mousemove", (event) => {
    const tilt = inverseMousePosition(event.target, event);

    nav.style.setProperty("--tilt-bg-y", tilt.x1 * 2); // tone down the movement a bit
    nav.style.setProperty("--tilt-bg-x", tilt.y1 * 2); // tone down the movement a bit
  });
}

window.addEventListener('DOMContentLoaded', () => {

    const activeLink = nav.querySelector('li.active a');

    if (!activeLink) return;

    const { width, left } =
        activeLink.parentNode.getBoundingClientRect();

    const offsetLeft =
        left - nav.getBoundingClientRect().left;
    
    nav.style.setProperty('--after-bg-position', offsetLeft);
    nav.style.setProperty('--after-radial-bg-position', offsetLeft + width / 2);
    nav.style.setProperty('--after-bg-width', width);
});