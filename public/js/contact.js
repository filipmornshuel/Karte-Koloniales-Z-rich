/**
 * Sending the email with a fetch
 * @author JoksimovicM
 * @since 01.03.2023
 */

/**
 * function to send the email with a post request
 * @author JoksimovicM
 * @param {*} event if the contact-formular is sent
 */
function sendEmail(event) {
  const name = document.getElementById('nameInput').value;
  const email = document.getElementById('emailInput').value;
  const phone = document.getElementById('phoneInput').value;
  const message = document.getElementById('message').value;

  fetch('/sendEmail', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: name,
      email: email,
      phone: phone,
      message: message,
    }),
  })
    .then((response) => {
      if (response.ok) {
        console.log('Email sent successfully');
      } else {
        console.log('Failed to send email');
      }
    })
    .catch((error) => {
      console.error('Error sending email', error);
    });
}
