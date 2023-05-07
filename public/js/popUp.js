/**
 * Modal-class for showing the modal
 * @author filipmornshuel
 * @since 01.03.2023
 */

var modal = document.getElementById('myModal');

var btn = document.getElementById('myBtn');

var span = document.getElementsByClassName('close')[0];

/**
 * event listener for clicking the btn
 * @author filipmornshuel
 */
btn.onclick = function () {
  modal.style.display = 'block';
};

/**
 * Eventlister for closing the span
 * @author filipmornshuel
 */
span.onclick = function () {
  modal.style.display = 'none';
};

/**
 * event.listener for outclicking the modal
 * @author filipmornshuel
 */
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = 'none';
  }
};
