// migrations/create_flight_cost_table.js

const connectionString = 'postgres://postgres@localhost:5432/postgres'; // Move to .env file and setup secret management
const pgp = require('pg-promise')();
const db = pgp(connectionString);

const createFlightCostTrackerTableQuery = `
  CREATE TABLE flight_cost_tracker (
    id SERIAL PRIMARY KEY,
    flight_id UUID REFERENCES flights (id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    price_threshold NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
`;

db.none(createFlightCostTrackerTableQuery)
  .then(() => {
    console.log('flight_cost_tracker table created successfully.');
    pgp.end();
  })
  .catch((error) => {
    console.error('Error creating flight_cost_tracker table:', error);
    pgp.end();
  });
