/*
 * Three-sensor sonar loop for the Pi side.
 *
 * Drop-in replacement for a single-sensor read loop. The client accepts either
 * shape, so you can run this with one sensor wired and add the others later:
 *
 *   single:  io.emit('distance', { distanceCm: 120 })
 *   three:   io.emit('distance', { left: 210, center: 120, right: null })
 *
 * THE ONE THING THAT MATTERS HERE: the sensors must fire one at a time, in
 * sequence, never in parallel. Three HC-SR04s pinging simultaneously hear each
 * other's bursts and return confident nonsense — crosstalk is the classic
 * failure of multi-sensor ultrasonic rigs, and it looks like a working sensor
 * reporting wrong numbers rather than an obvious fault.
 *
 * Wiring note: HC-SR04 ECHO is 5V and the Pi's GPIO is 3.3V tolerant only.
 * Use a divider (1k / 2k) or a level shifter on each ECHO line.
 */

const Gpio = require('pigpio').Gpio;

const SENSORS = [
  { name: 'left',   trigger: 23, echo: 24 },
  { name: 'center', trigger: 17, echo: 27 },
  { name: 'right',  trigger: 22, echo: 25 },
];

const MICROSEC_PER_CM = 1e6 / 34321;  // speed of sound at ~20C
const SETTLE_MS = 60;                  // gap between sensors: lets echoes die down
const CYCLE_MS = 30;                   // pause between full sweeps
const TIMEOUT_MS = 40;                 // no echo back = out of range
const MIN_CM = 2;
const MAX_CM = 400;

function setupSensor(spec) {
  const trigger = new Gpio(spec.trigger, { mode: Gpio.OUTPUT });
  const echo = new Gpio(spec.echo, { mode: Gpio.INPUT, alert: true });
  trigger.digitalWrite(0);

  let startTick = null;
  let pending = null;

  echo.on('alert', (level, tick) => {
    if (level === 1) {
      startTick = tick;
      return;
    }
    if (startTick === null || !pending) return;
    // pigpio ticks wrap at 2^32 microseconds (~72 minutes).
    const diff = (tick >> 0) - (startTick >> 0);
    const cm = (diff >>> 0) / 2 / MICROSEC_PER_CM;
    startTick = null;
    const resolve = pending;
    pending = null;
    resolve(cm >= MIN_CM && cm <= MAX_CM ? Math.round(cm) : null);
  });

  function read() {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        if (pending) { pending = null; resolve(null); }
      }, TIMEOUT_MS);

      pending = (value) => { clearTimeout(timer); resolve(value); };
      trigger.trigger(10, 1); // 10us pulse
    });
  }

  return { name: spec.name, read };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function startSonar(io) {
  const sensors = SENSORS.map(setupSensor);
  let stopped = false;

  (async function loop() {
    while (!stopped) {
      const frame = {};
      // Strictly sequential — see the crosstalk note at the top.
      for (const sensor of sensors) {
        frame[sensor.name] = await sensor.read();
        await sleep(SETTLE_MS);
      }
      // Nulls are sent through deliberately: the client treats a channel that
      // stops reporting as offline and greys it out, which is information.
      io.emit('distance', frame);
      await sleep(CYCLE_MS);
    }
  })();

  return () => { stopped = true; };
}

module.exports = { startSonar };