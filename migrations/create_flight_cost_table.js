// migrations/create_flight_cost_table.js

const connectionString = 'postgres://postgres@localhost:5432/postgres'; // Move to .env file and setup secret management
const pgp = require('pg-promise')();
const db = pgp(connectionString);

const createFlightCostTableQuery = `
  CREATE TABLE flight_cost (
    id SERIAL PRIMARY KEY,
    flight_id UUID REFERENCES flights (id) ON DELETE CASCADE,
    cost NUMERIC NOT NULL,
    currency TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
`;

db.none(createFlightCostTableQuery)
  .then(() => {
    console.log('flight_cost table created successfully.');
    pgp.end();
  })
  .catch((error) => {
    console.error('Error creating flight_cost table:', error);
    pgp.end();
  });
