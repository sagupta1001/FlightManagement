// TODO: Switch to commonJS
import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bodyParser from 'body-parser';
import cors from 'cors';
import pool from './database';

// TODO: Support for cluster

const app : express.Application = express();
const port: number = 3001;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors({
  origin: 'http://localhost:3000',
}));
app.get('/status', async (req: Request, res: Response) => {
  const queryResult = await pool.query('SELECT * FROM test');
  console.log(queryResult.rows);
  res.send('Hello, World!');
});


app.post('/api/flights', async (req: Request, res: Response) => {
  console.log(req.body);
  const {
    flightNumber,
    aircraftNumber,
    sourceCity,
    destinationCity,
    flightDate,
    departureTime,
    arrivalTime,
  } = req.body;

  try {
    const queryText = `
      INSERT INTO flights
        (id, flight_number, aircraft_number, source_city, destination_city, flight_date, departure_time, arrival_time)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const id = uuidv4(); // Generate random UUID

    const values = [
      id,
      flightNumber,
      aircraftNumber,
      sourceCity,
      destinationCity,
      flightDate,
      departureTime,
      arrivalTime,
    ];

    const queryResult = await pool.query(queryText, values);
    const newFlight = queryResult.rows[0];

    res.json(newFlight);
  } catch (error) {
    console.error('Error creating flight:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Add the route for updating flight information
app.put('/api/flights/:id', async (req, res) => {
  const flightId = req.params.id;
  const updatedFlight = req.body;

  // TODO: Add transactions here
  try {
    const updateQuery = `
      UPDATE flights
      SET flight_number = $1,
          aircraft_number = $2,
          source_city = $3,
          destination_city = $4,
          departure_time = $5,
          arrival_time = $6,
          flight_date = $7,
          updated_at = $8
      WHERE id = $9
      RETURNING *;
    `;

    const { rows } = await pool.query(updateQuery, [
      updatedFlight.flight_number,
      updatedFlight.aircraft_number,
      updatedFlight.source_city,
      updatedFlight.destination_city,
      updatedFlight.departure_time,
      updatedFlight.arrival_time,
      updatedFlight.flight_date,
      new Date(),
      flightId,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error updating flight:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/flights/:id/cost', async (req, res) => {
  console.log(req.body);
  const flightId = req.params.id;
  const { cost, currency } = req.body.updatedFlight;

  try {
    await pool.query('BEGIN');

    // Check if a flight_cost record already exists for the flight_id
    const existingCostQuery = 'SELECT * FROM flight_cost WHERE flight_id = $1';
    const existingCostResult = await pool.query(existingCostQuery, [flightId]);

    if (existingCostResult.rows.length > 0) {
      // If a record exists, update the existing record
      const updateQuery = `
        UPDATE flight_cost
        SET cost = $1, currency = $2, updated_at = NOW()
        WHERE flight_id = $3
        RETURNING *;
      `;

      const { rows } = await pool.query(updateQuery, [cost, currency, flightId]);
      await pool.query('COMMIT');
      res.status(200).json(rows[0]);
    } else {
      // If no record exists, insert a new record
      const insertQuery = `
        INSERT INTO flight_cost (flight_id, cost, currency, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING *;
      `;

      const { rows } = await pool.query(insertQuery, [flightId, cost, currency]);
      await pool.query('COMMIT');
      res.status(200).json(rows[0]);
    }
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error updating flight cost:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/flights', async(req: Request, res: Response) => {
  console.log("Getting flights...");
  try {
    const queryText = `
      SELECT 
        f.*,
        fc.cost,
        fc.currency 
      FROM 
        flights f
        LEFT JOIN flight_cost fc on f.id = fc.flight_id;
    `;

    const queryResult = await pool.query(queryText);

    res.json(queryResult.rows);
  } catch (error) {
    console.error('Error returning flights: ', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/track-flight', async (req, res) => {
  const { flightId, email, priceThreshold } = req.body;

  try {
    const query = `
      INSERT INTO flight_cost_tracker (flight_id, email, price_threshold, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *;
    `;

    const { rows } = await pool.query(query, [flightId, email, priceThreshold]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error tracking flight:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
