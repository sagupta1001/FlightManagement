const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('T9twZe45xxC4p4YMT2QU');

async function sendFlightPriceAlert(email, flightDetails, newPrice) {
  const msg = {
    to: email,
    from: 'test@example.com',
    subject: 'Flight Price Alert',
    html: `
      <p>Your flight price alert has been triggered!</p>
      <p>Flight Details:</p>
      <ul>
        <li>Flight Number: ${flightDetails.flightNumber}</li>
        <li>Departure: ${flightDetails.departure}</li>
        <!-- Add more flight details here -->
      </ul>
      <p>New Price: $${newPrice}</p>
      <p>Book your flight now!</p>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log('Email sent');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}


module.exports = sendFlightPriceAlert;
