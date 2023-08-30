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
// TODO: Switch to commonJS
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const database_1 = __importDefault(require("./database"));
// TODO: Support for cluster
const app = (0, express_1.default)();
const port = 3001;
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000',
}));
app.get('/status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const queryResult = yield database_1.default.query('SELECT * FROM test');
    console.log(queryResult.rows);
    res.send('Hello, World!');
}));
app.post('/api/flights', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body);
    const { flightNumber, aircraftNumber, sourceCity, destinationCity, flightDate, departureTime, arrivalTime, } = req.body;
    try {
        const queryText = `
      INSERT INTO flights
        (id, flight_number, aircraft_number, source_city, destination_city, flight_date, departure_time, arrival_time)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
        const id = (0, uuid_1.v4)(); // Generate random UUID
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
        const queryResult = yield database_1.default.query(queryText, values);
        const newFlight = queryResult.rows[0];
        res.json(newFlight);
    }
    catch (error) {
        console.error('Error creating flight:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}));
// Add the route for updating flight information
app.put('/api/flights/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const { rows } = yield database_1.default.query(updateQuery, [
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
    }
    catch (error) {
        console.error('Error updating flight:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}));
app.put('/api/flights/:id/cost', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body);
    const flightId = req.params.id;
    const { cost, currency } = req.body.updatedFlight;
    try {
        yield database_1.default.query('BEGIN');
        // Check if a flight_cost record already exists for the flight_id
        const existingCostQuery = 'SELECT * FROM flight_cost WHERE flight_id = $1';
        const existingCostResult = yield database_1.default.query(existingCostQuery, [flightId]);
        if (existingCostResult.rows.length > 0) {
            // If a record exists, update the existing record
            const updateQuery = `
        UPDATE flight_cost
        SET cost = $1, currency = $2, updated_at = NOW()
        WHERE flight_id = $3
        RETURNING *;
      `;
            const { rows } = yield database_1.default.query(updateQuery, [cost, currency, flightId]);
            yield database_1.default.query('COMMIT');
            res.status(200).json(rows[0]);
        }
        else {
            // If no record exists, insert a new record
            const insertQuery = `
        INSERT INTO flight_cost (flight_id, cost, currency, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING *;
      `;
            const { rows } = yield database_1.default.query(insertQuery, [flightId, cost, currency]);
            yield database_1.default.query('COMMIT');
            res.status(200).json(rows[0]);
        }
    }
    catch (error) {
        yield database_1.default.query('ROLLBACK');
        console.error('Error updating flight cost:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}));
app.get('/api/flights', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const queryResult = yield database_1.default.query(queryText);
        res.json(queryResult.rows);
    }
    catch (error) {
        console.error('Error returning flights: ', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}));
app.post('/api/track-flight', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { flightId, email, priceThreshold } = req.body;
    try {
        const query = `
      INSERT INTO flight_cost_tracker (flight_id, email, price_threshold, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *;
    `;
        const { rows } = yield database_1.default.query(query, [flightId, email, priceThreshold]);
        res.status(201).json(rows[0]);
    }
    catch (error) {
        console.error('Error tracking flight:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}));
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
