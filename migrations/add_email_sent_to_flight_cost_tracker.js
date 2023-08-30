const connectionString = 'postgres://postgres@localhost:5432/postgres'; // Move to .env file and setup secret management
const pgp = require('pg-promise')();
const db = pgp(connectionString);


const alterTableFlightCostTracker = `
  ALTER TABLE flight_cost_tracker
  ADD COLUMN email_sent BOOLEAN DEFAULT FALSE
`;

db.none(alterTableFlightCostTracker)
  .then(() => {
    console.log('flight_cost_tracker table updated successfully.');
    pgp.end();
  })
  .catch((error) => {
    console.error('Error updating flight_cost_tracker table:', error);
    pgp.end();
  });