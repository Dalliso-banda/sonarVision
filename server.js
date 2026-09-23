// server.js
// Reads "Distance: X cm" from the Arduino over serial and pushes each new
// reading to connected browser clients in real time via Socket.IO.
//
// Setup:
//   npm init -y
//   npm install serialport @serialport/parser-readline express socket.io
//
// Run:
//   node server.js /dev/ttyUSB0 [port]
//
// Then open:
//   http://localhost:3000

const path = require('path');
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const serialPath = process.argv[2] || '/dev/ttyUSB0';
const baudRate = 9600; // must match Serial.begin(9600) in the sketch
const httpPort = process.argv[3] || 3000;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.static(path.join(__dirname, 'public')));

let latest = {
  distanceCm: null,
  objectDetected: false,
  lastUpdated: null,
  connected: false,
};

// --- Serial setup ---
const serial = new SerialPort({ path: serialPath, baudRate }, (err) => {
  if (err) {
    console.error(`Could not open ${serialPath}: ${err.message}`);
    console.error('Tip: pass the correct port, e.g. node server.js /dev/ttyUSB0');
    process.exit(1);
  }
});

const parser = serial.pipe(new ReadlineParser({ delimiter: '\r\n' }));

serial.on('open', () => {
  latest.connected = true;
  console.log(`Serial open on ${serialPath} @ ${baudRate} baud`);
  io.emit('status', { connected: true });
});

serial.on('close', () => {
  latest.connected = false;
  io.emit('status', { connected: false });
});

serial.on('error', (err) => {
  console.error('Serial port error:', err.message);
});

parser.on('data', (line) => {
  line = line.trim();
  const match = line.match(/Distance:\s*(-?\d+)\s*cm/i);
  if (!match) return;

  const distanceCm = parseInt(match[1], 10);
  latest = {
    distanceCm,
    objectDetected: distanceCm > 0 && distanceCm < 20,
    lastUpdated: new Date().toISOString(),
    connected: true,
  };

  io.emit('distance', latest); // push to every connected browser
});

// --- Socket.IO ---
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.emit('distance', latest); // send current state immediately on connect

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

httpServer.listen(httpPort, () => {
  console.log(`Server running at http://localhost:${httpPort}`);
});
