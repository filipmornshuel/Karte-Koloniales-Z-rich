/**
 * Class for the navbar menu
 * source: https://www.youtube.com/watch?v=flItyHiDm7E&t=33s
 */

const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

/**
 * eventlistener if the navbar is clicked
 */
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navMenu.classList.toggle('active');
});

/**
 * query selector for each evenlistener
 */
document.querySelector('.nav-link').forEach((n) =>
  n.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
  })
);
