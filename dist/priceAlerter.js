"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('T9twZe45xxC4p4YMT2QU');
function sendFlightPriceAlert(email, flightDetails, newPrice) {
    return __awaiter(this, void 0, void 0, function* () {
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
            yield sgMail.send(msg);
            console.log('Email sent');
        }
        catch (error) {
            console.error('Error sending email:', error);
        }
    });
}
exports.default = sendFlightPriceAlert;
