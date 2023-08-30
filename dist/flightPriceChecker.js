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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const database_1 = __importDefault(require("./database"));
// Start Email integration
// ---------------------------------------------------------------------
const SibApiV3Sdk = require('sib-api-v3-sdk');
let defaultClient = SibApiV3Sdk.ApiClient.instance;
let apiKey = defaultClient.authentications['api-key'];
// TODO: Move this to .env file and secrets management system
apiKey.apiKey = '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';
let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
sendSmtpEmail.subject = "Flight Price Alert";
sendSmtpEmail.htmlContent =
    `
      <p>Your flight price alert has been triggered!</p>
      <p>Flight Details:</p>
      <ul>
        <li>Flight Number: {{params.flight_number}}</li>
        <li>Departure: {{params.departure}}</li>
        <!-- Add more flight details here -->
      </ul>
      <p>New Price: {{params.newPrice}}</p>
      <p>Book your flight now!</p>
    `;
sendSmtpEmail.sender = { "name": "Flight Tracker", "email": "test@example.com" };
sendSmtpEmail.replyTo = { "email": "replyto@domain.com", "name": "Flight Tracker" };
sendSmtpEmail.headers = { "Demo": "unique-id-1234" };
// ---------------------------------------------------------------------
// End Email integration
// Function to check flight prices
// TODO: Handle flight trackers that have already been sent 
function checkFlightPrices() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const client = yield database_1.default.connect();
            try {
                const flightCostTrackerQuery = 'SELECT * FROM flight_cost_tracker WHERE email_sent = FALSE'; // TODO where last updated is after the last time the job ran
                const flightCostTrackerResult = yield client.query(flightCostTrackerQuery);
                // TODO: Look to improve the performance here
                for (const flightCostTracker of flightCostTrackerResult.rows) {
                    console.log(flightCostTracker);
                    const flightCostQuery = 'SELECT * FROM flight_cost WHERE flight_id = $1'; // TODO: Where last updated is after the last time the job ran
                    const flightCostResult = yield client.query(flightCostQuery, [flightCostTracker.flight_id]);
                    if (Number(flightCostResult.rows[0].cost) <= Number(flightCostTracker.price_threshold)) {
                        const flightQuery = 'SELECT * FROM flights WHERE id = $1';
                        const flightResult = yield client.query(flightQuery, [flightCostTracker.flight_id]);
                        console.log("YAY! Price is within threshold");
                        sendSmtpEmail.to = [{ "email": flightCostTracker.email, "name": "Jordan Doe" }];
                        sendSmtpEmail.params = { "flight_number": flightResult.rows[0].flight_number, "departure": flightResult.rows[0].source_city, "newPrice": flightCostResult.rows[0].cost };
                        apiInstance.sendTransacEmail(sendSmtpEmail).then(function (data) {
                            return __awaiter(this, void 0, void 0, function* () {
                                console.log('API called successfully. Returned data: ' + JSON.stringify(data));
                                const updateFlightCostTrackerQuery = 'UPDATE flight_cost_tracker SET email_sent = TRUE WHERE flight_id = $1';
                                yield client.query(updateFlightCostTrackerQuery, [flightCostTracker.flight_id]);
                            });
                        }, function (error) {
                            console.error(error);
                        });
                    }
                }
            }
            catch (error) {
                console.error('Error updating flight prices:', error);
            }
            finally {
                client.release();
            }
        }
        catch (error) {
            console.error('Error connecting to the database:', error);
        }
    });
}
// TODO: Change the schedule. Currently set to every 5 seconds for testing/demo purposes.
node_cron_1.default.schedule('5 * * * * *', () => {
    checkFlightPrices();
});
