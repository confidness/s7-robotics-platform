import type { Course, Lesson, Module, Component, PlatformId, Platform } from './types'
import { localizeLesson, localizeModule } from '../i18n/content'

export const PLATFORMS: Platform[] = [
  { id: 'arduino', name: 'Arduino', vendor: 'Arduino', language: 'C++', color: '#0E9AA7' },
  { id: 'esp32', name: 'ESP32', vendor: 'Espressif', language: 'C++ / MicroPython', color: '#7C3AED' },
  { id: 'pico', name: 'Raspberry Pi Pico', vendor: 'Raspberry Pi', language: 'MicroPython', color: '#E11D48' },
  { id: 'wedo', name: 'LEGO WeDo 2.0', vendor: 'LEGO Education', language: 'Block coding', color: '#F59E0B' },
  { id: 'spike', name: 'LEGO SPIKE Prime', vendor: 'LEGO Education', language: 'Word blocks / Python', color: '#EAB308' },
  { id: 'python', name: 'Python', vendor: 'Software', language: 'Python 3', color: '#2563EB' },
]

export const platformById = (id: PlatformId) => PLATFORMS.find((p) => p.id === id)!

const C = {
  uno: { id: 'arduino-uno', name: 'Arduino Uno R3', qty: 1, role: 'Controller', description: 'The brain of the project. Runs your program and drives every pin.', icon: 'board' } as Component,
  hcsr04: { id: 'hc-sr04', name: 'HC-SR04 Ultrasonic Sensor', qty: 1, role: 'Distance sensing', description: 'Sends a 40 kHz burst and measures how long the echo takes to return.', icon: 'sensor' } as Component,
  breadboard: { id: 'breadboard', name: 'Breadboard 830 pts', qty: 1, role: 'Prototyping', description: 'Solderless board that connects components in rows without any wiring permanence.', icon: 'breadboard' } as Component,
  jumpers: { id: 'jumpers', name: 'Jumper wires (M-M)', qty: 8, role: 'Connections', description: 'Carry signal, 5 V and GND between the board, the sensor and the LED.', icon: 'wire' } as Component,
  led: { id: 'led-red', name: 'LED 5 mm (red)', qty: 1, role: 'Indicator', description: 'Visual output — turns on when the measured distance crosses your threshold.', icon: 'led' } as Component,
  resistor: { id: 'res-220', name: 'Resistor 220 Ω', qty: 1, role: 'Current limiting', description: 'Protects the LED and the Arduino pin from excess current.', icon: 'resistor' } as Component,
  servo: { id: 'sg90', name: 'Servo SG90', qty: 1, role: 'Actuator', description: 'Positional motor with 180° of travel, controlled by a PWM pulse width.', icon: 'motor' } as Component,
  motor: { id: 'dc-motor', name: 'DC gear motor', qty: 2, role: 'Drive', description: 'Geared motors that move the chassis. Driven through an H-bridge.', icon: 'motor' } as Component,
  l298n: { id: 'l298n', name: 'L298N motor driver', qty: 1, role: 'Power stage', description: 'H-bridge that lets a 5 V logic pin control a motor drawing far more current.', icon: 'board' } as Component,
  pot: { id: 'pot-10k', name: 'Potentiometer 10 kΩ', qty: 1, role: 'Analog input', description: 'A variable voltage divider — the classic way to read a knob position.', icon: 'resistor' } as Component,
  battery: { id: 'battery', name: '6×AA battery pack', qty: 1, role: 'Power', description: 'Separate motor supply so the controller never browns out under load.', icon: 'battery' } as Component,
  dht11: { id: 'dht11', name: 'DHT11 sensor', qty: 1, role: 'Environment', description: 'Digital temperature and humidity sensor on a single data line.', icon: 'sensor' } as Component,
  irsensor: { id: 'ir-array', name: 'IR reflectance sensor', qty: 2, role: 'Line following', description: 'Measures how much infrared light bounces back — dark tape reflects far less.', icon: 'sensor' } as Component,
  spikeHub: { id: 'spike-hub', name: 'SPIKE Prime Hub', qty: 1, role: 'Controller', description: 'Six-port programmable hub with gyro, speaker and 5×5 light matrix.', icon: 'board' } as Component,
  spikeMotor: { id: 'spike-motor', name: 'SPIKE medium motor', qty: 2, role: 'Drive', description: 'Motor with a built-in rotation sensor — it reports its own angle.', icon: 'motor' } as Component,
  spikeColor: { id: 'spike-color', name: 'SPIKE colour sensor', qty: 1, role: 'Perception', description: 'Reads colour and reflected light intensity for line and marker detection.', icon: 'sensor' } as Component,
  wedoHub: { id: 'wedo-hub', name: 'WeDo 2.0 Smarthub', qty: 1, role: 'Controller', description: 'Bluetooth hub with two ports that powers the motor and the sensor.', icon: 'board' } as Component,
  wedoMotor: { id: 'wedo-motor', name: 'WeDo medium motor', qty: 1, role: 'Movement', description: 'Simple geared motor with adjustable power and direction.', icon: 'motor' } as Component,
  wedoMotion: { id: 'wedo-motion', name: 'WeDo motion sensor', qty: 1, role: 'Detection', description: 'Detects an object moving closer or further away within ~15 cm.', icon: 'sensor' } as Component,
}

export const COURSES: Course[] = [
  {
    id: 'wedo',
    title: 'WeDo 2.0 — First Robots',
    tagline: 'Build, move and sense with LEGO Education WeDo 2.0',
    description:
      'A gentle entry into robotics. Students build motorised models, discover how a motor and a sensor talk to a hub, and finish with a working machine they designed themselves.',
    platform: 'wedo',
    level: 'Beginner',
    ageRange: '7–10 years',
    hours: 18,
    instructorId: 'u-mentor-2',
    gradient: 'from-amber-400 to-orange-500',
    accent: '#F59E0B',
    tags: ['LEGO', 'Motors', 'First steps'],
    outcomes: ['Assemble a motorised model from a plan', 'Explain what a sensor does', 'Program a simple action sequence'],
  },
  {
    id: 'spike',
    title: 'SPIKE Prime Engineering',
    tagline: 'Gyro, colour and force sensors with real engineering method',
    description:
      'Students move from guided builds to engineering challenges: measured turns, line following and a mission-style attachment system. Every module ends with a tested, documented robot.',
    platform: 'spike',
    level: 'Intermediate',
    ageRange: '10–14 years',
    hours: 32,
    instructorId: 'u-mentor-1',
    gradient: 'from-yellow-400 to-amber-600',
    accent: '#EAB308',
    tags: ['LEGO', 'Sensors', 'Missions'],
    outcomes: ['Drive accurately with the gyro sensor', 'Follow a line with proportional control', 'Design a mission attachment'],
  },
  {
    id: 'arduino',
    title: 'Arduino Electronics & Code',
    tagline: 'From your first LED to an autonomous obstacle-avoiding robot',
    description:
      'The core hardware course of the academy. Students wire real circuits on a breadboard, write C++ for the Arduino Uno, read sensors, drive motors and finish with a robot that navigates a room on its own.',
    platform: 'arduino',
    level: 'Intermediate',
    ageRange: '12–17 years',
    hours: 48,
    instructorId: 'u-mentor-1',
    gradient: 'from-cyan-500 to-blue-600',
    accent: '#0891B2',
    tags: ['Electronics', 'C++', 'Sensors', 'Robotics'],
    outcomes: [
      'Read a wiring diagram and build the circuit correctly',
      'Write and debug Arduino C++ with the Serial Monitor',
      'Combine sensors and motors into an autonomous behaviour',
    ],
  },
  {
    id: 'programming',
    title: 'Programming for Robotics',
    tagline: 'Python fundamentals aimed straight at robot control',
    description:
      'Variables, loops, functions and state machines taught entirely through robot problems — no abstract exercises. Ends with a simulated robot controller written from scratch.',
    platform: 'python',
    level: 'Intermediate',
    ageRange: '12–17 years',
    hours: 36,
    instructorId: 'u-mentor-2',
    gradient: 'from-blue-500 to-indigo-600',
    accent: '#4F46E5',
    tags: ['Python', 'Algorithms', 'Control'],
    outcomes: ['Write clean functions with clear inputs and outputs', 'Model robot behaviour as a state machine', 'Debug logic systematically'],
  },
  {
    id: 'competition',
    title: 'Competition Academy',
    tagline: 'Strategy, reliability and speed for national robotics tournaments',
    description:
      'For teams preparing for FLL-style tournaments. Covers mission strategy, attachment design, run consistency, the engineering notebook and how judging actually works.',
    platform: 'spike',
    level: 'Advanced',
    ageRange: '12–18 years',
    hours: 40,
    instructorId: 'u-mentor-1',
    gradient: 'from-violet-500 to-fuchsia-600',
    accent: '#7C3AED',
    tags: ['Teamwork', 'Strategy', 'Tournament'],
    outcomes: ['Plan a scoring strategy under time pressure', 'Make runs repeatable', 'Present a project to judges'],
  },
]

export const MODULES: Module[] = [
  { id: 'ar-m1', courseId: 'arduino', order: 1, title: 'Electronics Foundations', summary: 'Voltage, current, the breadboard and your first controlled output.' },
  { id: 'ar-m2', courseId: 'arduino', order: 2, title: 'Sensors & Perception', summary: 'Giving the board a way to measure the world around it.' },
  { id: 'ar-m3', courseId: 'arduino', order: 3, title: 'Motion & Control', summary: 'Servos, DC motors and the electronics that drive them safely.' },
  { id: 'ar-m4', courseId: 'arduino', order: 4, title: 'Autonomous Systems', summary: 'Combining perception and motion into a robot that decides for itself.' },

  { id: 'wd-m1', courseId: 'wedo', order: 1, title: 'Machines that Move', summary: 'Hub, motor and your first programmed movement.' },
  { id: 'wd-m2', courseId: 'wedo', order: 2, title: 'Machines that Sense', summary: 'Motion and tilt sensors, and reacting to them.' },

  { id: 'sp-m1', courseId: 'spike', order: 1, title: 'Precise Driving', summary: 'Motors with encoders, gyro turns and repeatable movement.' },
  { id: 'sp-m2', courseId: 'spike', order: 2, title: 'Sensing the Mat', summary: 'Colour and reflected light for lines, markers and stops.' },

  { id: 'pg-m1', courseId: 'programming', order: 1, title: 'Python for Control', summary: 'Values, conditions and loops as robot instructions.' },
  { id: 'pg-m2', courseId: 'programming', order: 2, title: 'Structure & State', summary: 'Functions, data structures and state machines.' },

  { id: 'cp-m1', courseId: 'competition', order: 1, title: 'Strategy & Scoring', summary: 'Reading the field, choosing missions, budgeting time.' },
  { id: 'cp-m2', courseId: 'competition', order: 2, title: 'Reliability & Judging', summary: 'Repeatable runs, the notebook and the judging room.' },
]

/** Compact spec → full Lesson. Keeps the seed readable without a per-lesson wall of boilerplate. */
interface LessonSpec {
  id: string
  moduleId: string
  courseId: string
  order: number
  title: string
  summary: string
  minutes: number
  difficulty: Lesson['difficulty']
  xp: number
  objectives: string[]
  theory: Lesson['theory']
  components: Component[]
  wiring: Lesson['wiring']
  code: Lesson['code']
  task: Lesson['task']
  challenge: Omit<Lesson['challenge'], 'id'>
  checks?: string[]
  requiresProject?: boolean
}

const build = (s: LessonSpec): Lesson => ({
  ...s,
  challenge: { ...s.challenge, id: `${s.id}-challenge` },
  checks: s.checks ?? ['serial', 'loop'],
  requiresProject: s.requiresProject ?? false,
})

const ULTRASONIC_CODE = `/*  S7 Robotics · Arduino · Lesson 2.1
 *  Ultrasonic distance meter with a proximity LED
 *  Board: Arduino Uno R3   Sensor: HC-SR04   Indicator: LED on D6
 */

const int TRIG_PIN = 9;
const int ECHO_PIN = 10;
const int LED_PIN  = 6;

// Speed of sound at 20 °C, in cm per microsecond.
// Calibrate this if your room is much warmer or colder: +0.6 m/s per °C.
const float SPEED_OF_SOUND = 0.0343;

void setup() {
  Serial.begin(9600);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("Ultrasonic distance meter ready");
}

float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);   // 10 us burst starts the measurement
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000UL);  // timeout ~5 m
  if (duration == 0) return -1;                      // no echo came back

  return (duration * SPEED_OF_SOUND) / 2.0;          // there and back
}

void loop() {
  float distance = readDistanceCm();

  if (distance < 0) {
    Serial.println("Out of range");
    digitalWrite(LED_PIN, LOW);
  } else {
    Serial.print("Distance: ");
    Serial.print(distance, 1);
    Serial.println(" cm");
    digitalWrite(LED_PIN, distance < 20 ? HIGH : LOW);
  }

  delay(200);
}`

export const LESSONS: Lesson[] = [
  build({
    id: 'ar-l1',
    moduleId: 'ar-m1',
    courseId: 'arduino',
    order: 1,
    title: 'Meet the Arduino & the Breadboard',
    summary: 'What the board actually does, how a breadboard is wired inside, and how to power a circuit safely.',
    minutes: 35,
    difficulty: 'Beginner',
    xp: 60,
    objectives: ['Identify the pins you will use all course', 'Explain how breadboard rows connect', 'Power a simple circuit without shorting it'],
    theory: [
      {
        id: 'ar-l1-t1',
        title: 'The board in one minute',
        body: 'An Arduino Uno is a small computer that runs one program forever. It has digital pins that are either 0 V or 5 V, analog pins that measure a voltage, a 5 V and a GND pin to power your parts, and a USB connection used for both power and messages back to your computer.',
        callout: { kind: 'info', text: 'Every circuit you build needs a complete path: out of a pin, through the component, back to GND.' },
      },
      {
        id: 'ar-l1-t2',
        title: 'How a breadboard is wired',
        body: 'The long rails along the edges run the whole length of the board — those are your 5 V and GND buses. The short rows in the middle connect five holes together, across the central channel they are separate. That channel exists so a chip can straddle it with each leg on its own row.',
        callout: { kind: 'warning', text: 'Never connect 5 V straight to GND. That is a short circuit and the board will shut down to protect itself.' },
      },
    ],
    components: [C.uno, C.breadboard, C.jumpers, C.led, C.resistor],
    wiring: {
      description: 'A single LED on pin 13 — the smallest complete circuit you can build.',
      rows: [
        { from: 'Arduino D13', to: 'Resistor 220 Ω', color: 'Yellow', note: 'Signal out of the pin' },
        { from: 'Resistor', to: 'LED anode (long leg)', color: '—', note: 'Current limited to ~15 mA' },
        { from: 'LED cathode (short leg)', to: 'Arduino GND', color: 'Black', note: 'Completes the circuit' },
      ],
    },
    code: {
      filename: 'blink.ino',
      explain: ['pinMode tells the board the pin is an output', 'digitalWrite sets it to 5 V or 0 V', 'delay pauses in milliseconds'],
      source: `const int LED_PIN = 13;

void setup() {
  Serial.begin(9600);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  Serial.println("LED on");
  delay(500);
  digitalWrite(LED_PIN, LOW);
  Serial.println("LED off");
  delay(500);
}`,
    },
    task: {
      title: 'Build and blink',
      brief: 'Wire the LED through the resistor to pin 13 and make it blink once per second.',
      requirements: ['LED wired through a 220 Ω resistor', 'Blink cycle of exactly one second', 'Serial Monitor prints the LED state'],
      xp: 40,
    },
    challenge: {
      title: 'SOS signal',
      brief: 'Change the timing so the LED blinks · · · — — — · · · in Morse code, then repeats after a two second pause.',
      hints: ['Short = 200 ms, long = 600 ms', 'A helper function like flash(int ms) will save you a lot of typing'],
      xp: 60,
    },
    checks: ['serial', 'loop', 'pinmode'],
  }),
  build({
    id: 'ar-l2',
    moduleId: 'ar-m1',
    courseId: 'arduino',
    order: 2,
    title: 'Digital Output & PWM',
    summary: 'Switching things on and off is easy — making them dim, fade and pulse needs PWM.',
    minutes: 40,
    difficulty: 'Beginner',
    xp: 70,
    objectives: ['Distinguish digital and PWM pins', 'Use analogWrite to fade an LED', 'Read a duty cycle from a graph'],
    theory: [
      {
        id: 'ar-l2-t1',
        title: 'A pin has only two voltages',
        body: 'A digital pin can only be 0 V or 5 V. To get "half brightness" the board switches between them very fast — roughly 490 times a second — and your eye averages the result. The share of time spent high is the duty cycle.',
        formula: 'brightness ≈ duty cycle = value / 255',
      },
      {
        id: 'ar-l2-t2',
        title: 'Which pins can do it',
        body: 'On the Uno only pins 3, 5, 6, 9, 10 and 11 have PWM hardware — they are marked with a ~ on the board. analogWrite on any other pin just turns it fully on or off.',
        callout: { kind: 'tip', text: 'If a fade looks like a switch, check that you are on a ~ pin.' },
      },
    ],
    components: [C.uno, C.breadboard, C.led, C.resistor, C.jumpers],
    wiring: {
      description: 'Same LED circuit, moved to a PWM-capable pin.',
      rows: [
        { from: 'Arduino D6 (~)', to: 'Resistor 220 Ω', color: 'Yellow', note: 'PWM capable pin' },
        { from: 'Resistor', to: 'LED anode', color: '—', note: '' },
        { from: 'LED cathode', to: 'GND rail', color: 'Black', note: '' },
      ],
    },
    code: {
      filename: 'fade.ino',
      explain: ['analogWrite takes 0–255', 'A for loop sweeps the value smoothly', 'Serial output lets you watch the value change'],
      source: `const int LED_PIN = 6;

void setup() {
  Serial.begin(9600);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  for (int value = 0; value <= 255; value += 5) {
    analogWrite(LED_PIN, value);
    Serial.println(value);
    delay(20);
  }
  for (int value = 255; value >= 0; value -= 5) {
    analogWrite(LED_PIN, value);
    Serial.println(value);
    delay(20);
  }
}`,
    },
    task: {
      title: 'Smooth breathing light',
      brief: 'Make the LED fade up and down continuously with no visible steps.',
      requirements: ['Uses analogWrite on a ~ pin', 'Full fade cycle takes about 2 seconds', 'Prints the current value to Serial'],
      xp: 45,
    },
    challenge: { title: 'Heartbeat pattern', brief: 'Replace the even fade with a double-pulse heartbeat: two quick bright pulses, then a rest.', hints: ['Two short fades then a longer delay', 'Try 120 ms per pulse'], xp: 60 },
    checks: ['serial', 'loop'],
  }),
  build({
    id: 'ar-l3',
    moduleId: 'ar-m1',
    courseId: 'arduino',
    order: 3,
    title: 'Analog Input: Reading a Knob',
    summary: 'The ADC, the 0–1023 range, and mapping a raw reading into something useful.',
    minutes: 40,
    difficulty: 'Beginner',
    xp: 70,
    objectives: ['Read an analog pin', 'Explain the 10-bit ADC range', 'Map a sensor range onto an output range'],
    theory: [
      {
        id: 'ar-l3-t1',
        title: 'From volts to numbers',
        body: 'analogRead compares the pin voltage against 5 V and returns a whole number from 0 to 1023. That is 10 bits of resolution, roughly 4.9 mV per step. Every analog sensor you meet later works the same way — only the meaning of the number changes.',
        formula: 'voltage = reading × 5.0 / 1023',
      },
      {
        id: 'ar-l3-t2',
        title: 'map() is just proportion',
        body: 'map(value, 0, 1023, 0, 255) rescales one range onto another. It does integer maths, so it truncates — for smooth results on floats, do the proportion yourself.',
        callout: { kind: 'tip', text: 'Always print the raw value first. Debug the reading before you debug the maths.' },
      },
    ],
    components: [C.uno, C.pot, C.breadboard, C.led, C.resistor, C.jumpers],
    wiring: {
      description: 'Potentiometer as a voltage divider into A0, LED brightness as the output.',
      rows: [
        { from: 'Pot left leg', to: '5 V rail', color: 'Red', note: 'Top of the divider' },
        { from: 'Pot middle leg', to: 'Arduino A0', color: 'Blue', note: 'The wiper — this is the reading' },
        { from: 'Pot right leg', to: 'GND rail', color: 'Black', note: 'Bottom of the divider' },
        { from: 'Arduino D6 (~)', to: 'LED via 220 Ω', color: 'Yellow', note: 'Output' },
      ],
    },
    code: {
      filename: 'knob.ino',
      explain: ['analogRead returns 0–1023', 'map rescales it to the PWM range', 'Serial shows both numbers side by side'],
      source: `const int POT_PIN = A0;
const int LED_PIN = 6;

void setup() {
  Serial.begin(9600);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  int raw = analogRead(POT_PIN);
  int brightness = map(raw, 0, 1023, 0, 255);

  analogWrite(LED_PIN, brightness);

  Serial.print("raw: ");
  Serial.print(raw);
  Serial.print("  brightness: ");
  Serial.println(brightness);

  delay(50);
}`,
    },
    task: { title: 'Dimmer switch', brief: 'Control LED brightness with the potentiometer and print both the raw and mapped values.', requirements: ['Reads A0', 'Uses map()', 'Prints raw and mapped values'], xp: 45 },
    challenge: { title: 'Three-zone indicator', brief: 'Split the knob range into low / medium / high and print which zone you are in — only when the zone actually changes.', hints: ['Remember the previous zone in a variable', 'Only print when zone != lastZone'], xp: 65 },
    checks: ['serial', 'loop', 'analog'],
  }),

  // ---------------------------------------------------------------- the demo lesson
  build({
    id: 'ar-l4',
    moduleId: 'ar-m2',
    courseId: 'arduino',
    order: 1,
    title: 'Ultrasonic Sensor',
    summary: 'Measure distance with sound: trigger a burst, time the echo, turn microseconds into centimetres.',
    minutes: 50,
    difficulty: 'Intermediate',
    xp: 120,
    objectives: [
      'Explain how an ultrasonic sensor measures distance',
      'Wire an HC-SR04 correctly to an Arduino Uno',
      'Convert echo time into centimetres in code',
      'Drive an output based on a distance threshold',
    ],
    theory: [
      {
        id: 'ar-l4-t1',
        title: 'How the sensor sees',
        body: 'The HC-SR04 has two cylinders: one is a speaker, the other a microphone. When you pulse TRIG high for 10 microseconds, the speaker emits eight bursts at 40 kHz — far above hearing. The moment the microphone hears them come back, the ECHO pin goes high for exactly as long as the round trip took.',
        callout: { kind: 'info', text: 'You are not measuring distance. You are measuring time, and converting it.' },
      },
      {
        id: 'ar-l4-t2',
        title: 'From microseconds to centimetres',
        body: 'Sound travels about 343 metres per second at 20 °C — that is 0.0343 cm per microsecond. The echo travelled to the object and back, so the one-way distance is half the total. This is the single most important line of the whole lesson.',
        formula: 'distance (cm) = duration (µs) × 0.0343 ÷ 2',
      },
      {
        id: 'ar-l4-t3',
        title: 'Where it fails',
        body: 'Soft fabric absorbs the burst and returns nothing. A surface at a steep angle reflects the sound away like a mirror. Below about 2 cm the echo returns before the sensor is listening. And temperature changes the speed of sound by roughly 0.6 m/s per degree — worth calibrating if your readings drift between a cold morning and a warm afternoon.',
        callout: { kind: 'warning', text: 'Always give pulseIn a timeout. Without one, a missing echo freezes your loop for a full second.' },
      },
    ],
    components: [C.uno, C.hcsr04, C.breadboard, C.jumpers, C.led, C.resistor],
    wiring: {
      description: 'Four wires to the sensor, three to the indicator LED. Power the sensor from the 5 V rail, not from a digital pin.',
      rows: [
        { from: 'HC-SR04 VCC', to: 'Arduino 5 V', color: 'Red', note: 'The sensor needs a full 5 V to fire' },
        { from: 'HC-SR04 TRIG', to: 'Arduino D9', color: 'Yellow', note: 'You pulse this to start a measurement' },
        { from: 'HC-SR04 ECHO', to: 'Arduino D10', color: 'Green', note: 'Stays high for the round-trip time' },
        { from: 'HC-SR04 GND', to: 'Arduino GND', color: 'Black', note: 'Shared ground — without it nothing works' },
        { from: 'Arduino D6 (~)', to: 'LED via 220 Ω', color: 'Orange', note: 'Proximity indicator' },
        { from: 'LED cathode', to: 'GND rail', color: 'Black', note: 'Back to ground' },
      ],
    },
    code: {
      filename: 'ultrasonic_distance.ino',
      explain: [
        'setup() opens the Serial Monitor at 9600 baud and sets pin directions',
        'readDistanceCm() sends the 10 µs trigger burst and times the echo',
        'pulseIn returns 0 on timeout — we return -1 so the caller can tell',
        'loop() prints the distance and lights the LED under 20 cm',
      ],
      source: ULTRASONIC_CODE,
      starter: `/*  Lesson 2.1 — your turn.
 *  The pins and the skeleton are here. The measurement is not.
 */

const int TRIG_PIN = 9;
const int ECHO_PIN = 10;
const int LED_PIN  = 6;

void setup() {
  // TODO: open the Serial Monitor at 9600 baud
  // TODO: set the pin directions
}

float readDistanceCm() {
  // TODO: send a 10 us pulse on TRIG
  // TODO: time the ECHO pulse with pulseIn()
  // TODO: convert microseconds to centimetres
  return 0;
}

void loop() {
  float distance = readDistanceCm();
  // TODO: print the distance
  // TODO: light the LED when something is closer than 20 cm
  delay(200);
}`,
    },
    task: {
      title: 'Build a distance meter',
      brief:
        'Wire the HC-SR04 and write a sketch that measures the distance to the nearest object and prints it to the Serial Monitor in centimetres, several times per second.',
      requirements: [
        'HC-SR04 wired to D9 (TRIG) and D10 (ECHO)',
        'Distance calculated from the echo duration, not a library guess',
        'Value printed to the Serial Monitor in centimetres',
        'Readings refresh at least 4 times per second',
      ],
      xp: 80,
    },
    challenge: {
      title: 'Proximity alarm',
      brief:
        'Make the system react to distance: LED off when the way is clear, blinking between 20 cm and 10 cm, and solid on below 10 cm. Print the state name whenever it changes.',
      hints: [
        'Three zones means two thresholds — name them as constants',
        'Store the previous zone so you only print on a change',
        'Blinking inside loop() is easier with millis() than with delay()',
      ],
      xp: 100,
    },
    checks: ['serial', 'loop', 'trig-pin', 'echo-pin', 'pulsein', 'distance-math', 'threshold'],
    requiresProject: true,
  }),

  build({
    id: 'ar-l5',
    moduleId: 'ar-m2',
    courseId: 'arduino',
    order: 2,
    title: 'Temperature & Humidity (DHT11)',
    summary: 'A digital sensor that speaks its own protocol, and what a library is actually doing for you.',
    minutes: 40,
    difficulty: 'Intermediate',
    xp: 90,
    objectives: ['Wire a three-pin digital sensor', 'Use a sensor library correctly', 'Handle a failed reading instead of printing nonsense'],
    theory: [
      {
        id: 'ar-l5-t1',
        title: 'One wire, forty bits',
        body: 'The DHT11 does not give you a voltage. It answers a request by sending 40 bits down a single data line with precise timing: humidity, temperature and a checksum. The library exists because timing that by hand is miserable.',
      },
      {
        id: 'ar-l5-t2',
        title: 'Trust, then verify',
        body: 'The last byte is a checksum. If it does not match, the reading is garbage and the library returns NaN. Real firmware checks for that instead of printing it.',
        callout: { kind: 'warning', text: 'The DHT11 needs about two seconds between readings. Polling faster returns stale data.' },
      },
    ],
    components: [C.uno, C.dht11, C.breadboard, C.jumpers],
    wiring: {
      description: 'Three connections, plus a pull-up already present on most breakout boards.',
      rows: [
        { from: 'DHT11 VCC', to: '5 V rail', color: 'Red', note: '' },
        { from: 'DHT11 DATA', to: 'Arduino D2', color: 'Blue', note: 'Bidirectional data line' },
        { from: 'DHT11 GND', to: 'GND rail', color: 'Black', note: '' },
      ],
    },
    code: {
      filename: 'climate.ino',
      explain: ['begin() prepares the timing', 'isnan() catches a failed read', 'Two seconds between readings'],
      source: `#include <DHT.h>

#define DHT_PIN  2
#define DHT_TYPE DHT11

DHT dht(DHT_PIN, DHT_TYPE);

void setup() {
  Serial.begin(9600);
  dht.begin();
}

void loop() {
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Sensor read failed");
  } else {
    Serial.print(temperature);
    Serial.print(" C  ");
    Serial.print(humidity);
    Serial.println(" %");
  }

  delay(2000);
}`,
    },
    task: { title: 'Room climate logger', brief: 'Print temperature and humidity every two seconds, and a clear message when a reading fails.', requirements: ['Handles NaN readings', 'Two second interval', 'Units printed with the values'], xp: 55 },
    challenge: { title: 'Comfort zone alert', brief: 'Light the LED when temperature leaves the 20–25 °C comfort band and print which side it left on.', hints: ['Two comparisons, one message each', 'Only print on change'], xp: 70 },
    checks: ['serial', 'loop'],
  }),
  build({
    id: 'ar-l6',
    moduleId: 'ar-m2',
    courseId: 'arduino',
    order: 3,
    title: 'Infrared Line Sensor',
    summary: 'Reflectance sensing, calibration thresholds, and why every robot needs to be re-tuned on a new mat.',
    minutes: 45,
    difficulty: 'Intermediate',
    xp: 95,
    objectives: ['Read a reflectance sensor', 'Calibrate a black/white threshold', 'Explain why a fixed threshold fails'],
    theory: [
      {
        id: 'ar-l6-t1',
        title: 'Light in, light out',
        body: 'An IR sensor shines infrared down and measures how much bounces back. White tape reflects most of it, black tape swallows it. The number itself is meaningless — only the gap between the two matters.',
      },
      {
        id: 'ar-l6-t2',
        title: 'Calibrate, never hardcode',
        body: 'Room lighting, sensor height and mat finish all shift the readings. Sample the white surface, sample the black line, and put your threshold halfway between. Do it at the start of every run.',
        formula: 'threshold = (white + black) / 2',
        callout: { kind: 'tip', text: 'A robot that worked yesterday and fails today has usually just moved into different light.' },
      },
    ],
    components: [C.uno, C.irsensor, C.breadboard, C.jumpers],
    wiring: {
      description: 'Two sensors straddling the line, both on analog pins.',
      rows: [
        { from: 'Left sensor OUT', to: 'Arduino A0', color: 'Blue', note: '' },
        { from: 'Right sensor OUT', to: 'Arduino A1', color: 'Green', note: '' },
        { from: 'Both VCC', to: '5 V rail', color: 'Red', note: '' },
        { from: 'Both GND', to: 'GND rail', color: 'Black', note: '' },
      ],
    },
    code: {
      filename: 'line_sensor.ino',
      explain: ['Calibration runs once in setup', 'Threshold is derived, not guessed', 'loop prints which sensor sees the line'],
      source: `const int LEFT_PIN  = A0;
const int RIGHT_PIN = A1;

int threshold = 500;   // replaced by calibration

void setup() {
  Serial.begin(9600);

  Serial.println("Hold both sensors over WHITE, then wait...");
  delay(3000);
  int white = (analogRead(LEFT_PIN) + analogRead(RIGHT_PIN)) / 2;

  Serial.println("Now hold them over the BLACK line...");
  delay(3000);
  int black = (analogRead(LEFT_PIN) + analogRead(RIGHT_PIN)) / 2;

  threshold = (white + black) / 2;
  Serial.print("Calibrated threshold: ");
  Serial.println(threshold);
}

void loop() {
  bool leftOnLine  = analogRead(LEFT_PIN)  < threshold;
  bool rightOnLine = analogRead(RIGHT_PIN) < threshold;

  Serial.print(leftOnLine ? "L" : "-");
  Serial.println(rightOnLine ? "R" : "-");

  delay(100);
}`,
    },
    task: { title: 'Line detector', brief: 'Calibrate both sensors at startup and continuously report which of them is over the line.', requirements: ['Calibration step in setup', 'Derived threshold', 'Live Serial report'], xp: 55 },
    challenge: { title: 'Intersection counter', brief: 'Count how many times both sensors see black at once — that is a crossing line — and print the running total.', hints: ['Only count on the rising edge', 'Debounce with a short minimum gap'], xp: 75 },
    checks: ['serial', 'loop', 'analog'],
  }),
  build({
    id: 'ar-l7',
    moduleId: 'ar-m3',
    courseId: 'arduino',
    order: 1,
    title: 'Servo Control',
    summary: 'Position control with pulse widths, and why a servo must never be powered from the board alone.',
    minutes: 40,
    difficulty: 'Intermediate',
    xp: 90,
    objectives: ['Drive a servo to an angle', 'Explain PWM pulse width vs angle', 'Power actuators separately'],
    theory: [
      { id: 'ar-l7-t1', title: 'Angle is a pulse width', body: 'A hobby servo listens for a pulse every 20 ms. A 1.0 ms pulse means 0°, 1.5 ms means 90°, 2.0 ms means 180°. The Servo library hides this, but that is all it is doing.' },
      { id: 'ar-l7-t2', title: 'Current matters', body: 'A stalled SG90 pulls far more than the Uno regulator likes. Give the servo its own 5 V supply and join the grounds.', callout: { kind: 'warning', text: 'Jittering servo, resetting board: almost always a power problem, not a code problem.' } },
    ],
    components: [C.uno, C.servo, C.battery, C.jumpers],
    wiring: {
      description: 'Signal from the board, power from the pack, grounds joined.',
      rows: [
        { from: 'Servo signal (orange)', to: 'Arduino D9', color: 'Orange', note: 'PWM pin' },
        { from: 'Servo V+ (red)', to: 'Battery pack +5 V', color: 'Red', note: 'Not the Arduino 5 V pin' },
        { from: 'Servo GND (brown)', to: 'Common GND', color: 'Black', note: 'Battery GND and Arduino GND joined' },
      ],
    },
    code: {
      filename: 'servo_sweep.ino',
      explain: ['attach() binds the servo to a pin', 'write() takes degrees', 'Give it time to actually move'],
      source: `#include <Servo.h>

Servo scanner;
const int SERVO_PIN = 9;

void setup() {
  Serial.begin(9600);
  scanner.attach(SERVO_PIN);
}

void loop() {
  for (int angle = 0; angle <= 180; angle += 5) {
    scanner.write(angle);
    Serial.println(angle);
    delay(30);
  }
  for (int angle = 180; angle >= 0; angle -= 5) {
    scanner.write(angle);
    Serial.println(angle);
    delay(30);
  }
}`,
    },
    task: { title: 'Scanning head', brief: 'Sweep the servo smoothly from 0° to 180° and back, printing the angle.', requirements: ['Uses the Servo library', 'Smooth sweep both ways', 'Angle printed to Serial'], xp: 55 },
    challenge: { title: 'Radar sweep', brief: 'Mount the ultrasonic sensor on the servo and print an angle/distance pair at every step — your first scan of a room.', hints: ['Reuse readDistanceCm() from lesson 2.1', 'Print as "angle,distance" so it pastes straight into a spreadsheet'], xp: 90 },
    checks: ['serial', 'loop'],
  }),
  build({
    id: 'ar-l8',
    moduleId: 'ar-m3',
    courseId: 'arduino',
    order: 2,
    title: 'DC Motors with an H-Bridge',
    summary: 'Direction, speed and the driver chip that stands between a 5 V pin and a real motor.',
    minutes: 45,
    difficulty: 'Advanced',
    xp: 110,
    objectives: ['Explain what an H-bridge does', 'Control direction and speed', 'Wire a separate motor supply safely'],
    theory: [
      { id: 'ar-l8-t1', title: 'Four switches', body: 'An H-bridge is four electronic switches around the motor. Close one diagonal pair and current flows one way; close the other pair and it reverses. Close a vertical pair and you short the supply — which is why you never set both direction pins high.' },
      { id: 'ar-l8-t2', title: 'Speed is still PWM', body: 'The ENA pin takes an analogWrite value. Below roughly 60 most small geared motors will hum without turning — that is the stall band, and it belongs in your calibration notes.', callout: { kind: 'tip', text: 'Find your motor minimum once, store it as a constant, and map your speed range above it.' } },
    ],
    components: [C.uno, C.l298n, C.motor, C.battery, C.jumpers],
    wiring: {
      description: 'Logic from the Arduino, power from the pack, one shared ground.',
      rows: [
        { from: 'Arduino D5 (~)', to: 'L298N ENA', color: 'Yellow', note: 'Speed via PWM' },
        { from: 'Arduino D7', to: 'L298N IN1', color: 'Blue', note: 'Direction A' },
        { from: 'Arduino D8', to: 'L298N IN2', color: 'Green', note: 'Direction B' },
        { from: 'Battery +', to: 'L298N 12 V', color: 'Red', note: 'Motor supply only' },
        { from: 'Battery −', to: 'L298N GND + Arduino GND', color: 'Black', note: 'Common ground is mandatory' },
      ],
    },
    code: {
      filename: 'motor_drive.ino',
      explain: ['Direction pins are a pair, never both high', 'ENA sets the speed', 'MIN_SPEED is a calibration constant'],
      source: `const int ENA = 5;
const int IN1 = 7;
const int IN2 = 8;

// Measured on our chassis: below this the motor hums but does not turn.
const int MIN_SPEED = 60;

void setup() {
  Serial.begin(9600);
  pinMode(ENA, OUTPUT);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
}

void drive(int speed) {          // -255..255
  bool forward = speed >= 0;
  int magnitude = abs(speed);
  if (magnitude > 0) magnitude = max(magnitude, MIN_SPEED);

  digitalWrite(IN1, forward ? HIGH : LOW);
  digitalWrite(IN2, forward ? LOW : HIGH);
  analogWrite(ENA, magnitude);

  Serial.print("drive ");
  Serial.println(speed);
}

void loop() {
  drive(180);
  delay(1500);
  drive(0);
  delay(500);
  drive(-180);
  delay(1500);
  drive(0);
  delay(500);
}`,
    },
    task: { title: 'Forward, stop, reverse', brief: 'Drive one motor forward, stop, then reverse on a repeating cycle with the speed printed each time.', requirements: ['Never sets both direction pins high', 'Speed controlled with analogWrite', 'State printed to Serial'], xp: 65 },
    challenge: { title: 'Soft start', brief: 'Ramp the speed up over half a second instead of jumping to full power, and ramp it down before stopping.', hints: ['A for loop over the speed value', 'Respect MIN_SPEED at the bottom of the ramp'], xp: 85 },
    checks: ['serial', 'loop'],
  }),
  build({
    id: 'ar-l9',
    moduleId: 'ar-m4',
    courseId: 'arduino',
    order: 1,
    title: 'Autonomous Obstacle Robot',
    summary: 'The capstone: perception, decision and motion in one loop that runs without you.',
    minutes: 90,
    difficulty: 'Advanced',
    xp: 200,
    objectives: ['Combine a sensor and two motors', 'Write a simple state machine', 'Tune thresholds on a real floor'],
    theory: [
      { id: 'ar-l9-t1', title: 'Sense, decide, act', body: 'Every autonomous robot is that loop. Keep the three steps as separate functions and debugging stays possible; mix them together and you will never find out why it turned.' },
      { id: 'ar-l9-t2', title: 'States, not if-chains', body: 'DRIVING, BACKING, TURNING. Each state has one job and one exit condition. A nest of ifs that tries to do all three at once is how robots end up vibrating in a corner.', callout: { kind: 'tip', text: 'Print the state name every time it changes. That log is your whole debugging story.' } },
    ],
    components: [C.uno, C.hcsr04, C.l298n, C.motor, C.battery, C.jumpers],
    wiring: {
      description: 'Everything from modules 2 and 3 on one chassis.',
      rows: [
        { from: 'HC-SR04 TRIG / ECHO', to: 'D9 / D10', color: 'Yellow / Green', note: 'Front-facing' },
        { from: 'L298N ENA / IN1 / IN2', to: 'D5 / D7 / D8', color: 'Mixed', note: 'Left motor' },
        { from: 'L298N ENB / IN3 / IN4', to: 'D3 / D11 / D12', color: 'Mixed', note: 'Right motor' },
        { from: 'Battery', to: 'L298N 12 V + common GND', color: 'Red / Black', note: 'Shared ground with the Uno' },
      ],
    },
    code: {
      filename: 'obstacle_robot.ino',
      explain: ['One enum, three states', 'Transitions are explicit and logged', 'Distance thresholds are constants you tune on the floor'],
      source: `enum State { DRIVING, BACKING, TURNING };
State state = DRIVING;
unsigned long stateStarted = 0;

const int STOP_CM = 20;

void setState(State next, const char* name) {
  state = next;
  stateStarted = millis();
  Serial.print("-> ");
  Serial.println(name);
}

void loop() {
  float distance = readDistanceCm();
  unsigned long elapsed = millis() - stateStarted;

  switch (state) {
    case DRIVING:
      drive(180, 180);
      if (distance > 0 && distance < STOP_CM) setState(BACKING, "BACKING");
      break;
    case BACKING:
      drive(-150, -150);
      if (elapsed > 500) setState(TURNING, "TURNING");
      break;
    case TURNING:
      drive(160, -160);
      if (elapsed > 400) setState(DRIVING, "DRIVING");
      break;
  }

  delay(50);
}`,
    },
    task: { title: 'Robot that survives a room', brief: 'Build a robot that drives forward, detects obstacles and recovers without help for two full minutes.', requirements: ['Uses the ultrasonic sensor for detection', 'Implements at least three states', 'Logs every state change', 'Runs two minutes unattended'], xp: 140 },
    challenge: { title: 'Choose the better way out', brief: 'Before turning, scan left and right with the servo and turn toward whichever side has more space.', hints: ['Reuse the radar sweep from lesson 3.1', 'Compare two readings, pick the larger'], xp: 150 },
    checks: ['serial', 'loop', 'trig-pin', 'echo-pin'],
    requiresProject: true,
  }),

  // ---------------------------------------------------------------- other courses
  build({
    id: 'wd-l1',
    moduleId: 'wd-m1',
    courseId: 'wedo',
    order: 1,
    title: 'Your First Moving Model',
    summary: 'Connect the Smarthub, attach a motor and make something move on purpose.',
    minutes: 30,
    difficulty: 'Beginner',
    xp: 50,
    objectives: ['Pair the hub', 'Run a motor at a chosen power', 'Read a program left to right'],
    theory: [
      { id: 'wd-l1-t1', title: 'Blocks are instructions', body: 'Each block is one command and the hub runs them in order, left to right. The green flag starts the sequence — nothing happens until something starts it.' },
      { id: 'wd-l1-t2', title: 'Power is not speed', body: 'The power number is how hard the motor pushes. A heavy model at power 5 may not move at all, while a light one races away. Test, then choose.' },
    ],
    components: [C.wedoHub, C.wedoMotor],
    wiring: { description: 'One cable from the motor into port A of the Smarthub.', rows: [{ from: 'Motor', to: 'Smarthub port A', color: 'Grey cable', note: 'Push until it clicks' }] },
    code: { filename: 'drive.wedo', explain: ['Start on the green flag', 'Set power before starting the motor', 'Always stop the motor at the end'], source: `[green flag]\n  set motor A power to 7\n  turn motor A on for 3 seconds\n  turn motor A off` },
    task: { title: 'Three second drive', brief: 'Make your model move forward for exactly three seconds and stop.', requirements: ['Motor in port A', 'Runs three seconds', 'Stops cleanly'], xp: 30 },
    challenge: { title: 'There and back', brief: 'Drive forward, pause, then return to roughly the starting point.', hints: ['Reverse means negative direction, same time'], xp: 40 },
  }),
  build({
    id: 'wd-l2',
    moduleId: 'wd-m1',
    courseId: 'wedo',
    order: 2,
    title: 'Gears and Speed',
    summary: 'Why a big gear driving a small one makes your model faster but weaker.',
    minutes: 35,
    difficulty: 'Beginner',
    xp: 55,
    objectives: ['Identify a gear ratio', 'Trade speed for strength on purpose'],
    theory: [
      { id: 'wd-l2-t1', title: 'Counting teeth', body: 'A 24-tooth gear driving an 8-tooth gear turns it three times for every one of its own turns. Three times the speed, one third of the strength. Nothing is free.' },
      { id: 'wd-l2-t2', title: 'Choosing a ratio', body: 'A climbing model needs strength. A racing model needs speed. Look at the job first and pick the gears second.' },
    ],
    components: [C.wedoHub, C.wedoMotor],
    wiring: { description: 'Motor into port A; the gear train is mechanical, not electrical.', rows: [{ from: 'Motor', to: 'Smarthub port A', color: 'Grey cable', note: '' }] },
    code: { filename: 'gears.wedo', explain: ['Same program, different gearing', 'Time the run to compare'], source: `[green flag]\n  set motor A power to 10\n  turn motor A on for 5 seconds\n  turn motor A off` },
    task: { title: 'Fast build vs strong build', brief: 'Build the same model with two different gear ratios and time both over one metre.', requirements: ['Two gear ratios tested', 'Times written down', 'A conclusion in your own words'], xp: 35 },
    challenge: { title: 'Hill climber', brief: 'Gear your model so it can climb a book without stalling.', hints: ['Small gear driving a big gear', 'Slower is fine'], xp: 45 },
  }),
  build({
    id: 'wd-l3',
    moduleId: 'wd-m2',
    courseId: 'wedo',
    order: 1,
    title: 'Reacting to the Motion Sensor',
    summary: 'The hub can wait for the world instead of just counting seconds.',
    minutes: 35,
    difficulty: 'Beginner',
    xp: 60,
    objectives: ['Use a wait-until block', 'Explain the sensor range', 'Design a reaction'],
    theory: [
      { id: 'wd-l3-t1', title: 'Waiting for something real', body: 'A wait-until block pauses the program until a condition becomes true. That single idea turns a timed toy into a machine that responds.' },
      { id: 'wd-l3-t2', title: 'Fifteen centimetres', body: 'The WeDo motion sensor only sees about 15 cm ahead. Knowing the limits of your sensor is as important as knowing what it measures.' },
    ],
    components: [C.wedoHub, C.wedoMotor, C.wedoMotion],
    wiring: { description: 'Motor in port A, motion sensor in port B.', rows: [{ from: 'Motor', to: 'Port A', color: 'Grey', note: '' }, { from: 'Motion sensor', to: 'Port B', color: 'Grey', note: 'Facing forward' }] },
    code: { filename: 'sense.wedo', explain: ['Wait until the object is close', 'Then act'], source: `[green flag]\n  set motor A power to 6\n  turn motor A on\n  wait until distance < 15\n  turn motor A off\n  play sound "alarm"` },
    task: { title: 'Stop before you crash', brief: 'Drive forward and stop automatically when something appears in front.', requirements: ['Uses the motion sensor', 'Stops without a timer', 'Plays a sound on stop'], xp: 40 },
    challenge: { title: 'Automatic gate', brief: 'Open a barrier when something approaches and close it again once the way is clear.', hints: ['Two wait-until blocks, one for each direction'], xp: 55 },
  }),
  build({
    id: 'sp-l1',
    moduleId: 'sp-m1',
    courseId: 'spike',
    order: 1,
    title: 'Driving a Measured Distance',
    summary: 'Wheel circumference, motor degrees and the arithmetic that makes a robot repeatable.',
    minutes: 45,
    difficulty: 'Intermediate',
    xp: 80,
    objectives: ['Convert centimetres to motor degrees', 'Explain why time-based driving drifts'],
    theory: [
      { id: 'sp-l1-t1', title: 'Degrees, not seconds', body: 'SPIKE motors count their own rotation. Driving "for 2 seconds" changes with battery level; driving "for 720 degrees" does not.', formula: 'degrees = distance_cm ÷ (π × wheel_diameter_cm) × 360' },
      { id: 'sp-l1-t2', title: 'Measure your own wheel', body: 'The standard SPIKE wheel is 5.6 cm across, giving about 17.6 cm per rotation — but measure yours. Tyre wear and rim type both shift it.', callout: { kind: 'tip', text: 'Drive 10 rotations, measure the real distance, divide. That is your true circumference.' } },
    ],
    components: [C.spikeHub, C.spikeMotor],
    wiring: { description: 'Two motors in ports A and E, wheels on the same axle line.', rows: [{ from: 'Left motor', to: 'Port A', color: '—', note: '' }, { from: 'Right motor', to: 'Port E', color: '—', note: 'Reversed direction' }] },
    code: {
      filename: 'drive_cm.py',
      explain: ['One constant for the wheel', 'One function that converts', 'The program reads in centimetres'],
      source: `from spike import MotorPair
import math

pair = MotorPair('A', 'E')
WHEEL_DIAMETER_CM = 5.6   # measure yours and replace this

def drive_cm(distance_cm, speed=40):
    circumference = math.pi * WHEEL_DIAMETER_CM
    degrees = distance_cm / circumference * 360
    pair.move(degrees, 'degrees', speed=speed)

drive_cm(50)
print('done')`,
    },
    task: { title: 'Fifty centimetres, every time', brief: 'Write a drive_cm function and prove it lands within 2 cm over three runs.', requirements: ['Distance converted from cm', 'Three measured runs', 'Error under 2 cm'], xp: 50 },
    challenge: { title: 'Square path', brief: 'Drive a 40 cm square and finish within 5 cm of where you started.', hints: ['Four sides, four gyro turns', 'Error accumulates — measure the turn too'], xp: 70 },
  }),
  build({
    id: 'sp-l2',
    moduleId: 'sp-m2',
    courseId: 'spike',
    order: 1,
    title: 'Proportional Line Following',
    summary: 'Why a robot that only knows left and right wobbles, and how one multiplication fixes it.',
    minutes: 50,
    difficulty: 'Advanced',
    xp: 110,
    objectives: ['Compute an error from a sensor reading', 'Apply a proportional correction', 'Tune a gain value'],
    theory: [
      { id: 'sp-l2-t1', title: 'Error is the whole idea', body: 'Aim for the edge of the line, where reflected light reads about 50. Error is how far off you are. Correction is proportional to that error — small error, gentle nudge.', formula: 'correction = (target − reading) × gain' },
      { id: 'sp-l2-t2', title: 'Tuning the gain', body: 'Too low and it drifts off the line. Too high and it oscillates violently. Start at 0.5, double until it wobbles, then back off by a third.', callout: { kind: 'tip', text: 'Change one value at a time and write down what happened. That is engineering, not guessing.' } },
    ],
    components: [C.spikeHub, C.spikeMotor, C.spikeColor],
    wiring: { description: 'Colour sensor centred at the front, about 1 cm above the mat.', rows: [{ from: 'Colour sensor', to: 'Port C', color: '—', note: 'Facing down' }, { from: 'Motors', to: 'Ports A and E', color: '—', note: '' }] },
    code: {
      filename: 'line_follow.py',
      explain: ['TARGET is the edge value', 'GAIN is the tuning knob', 'steering is clamped to the legal range'],
      source: `from spike import MotorPair, ColorSensor

pair = MotorPair('A', 'E')
sensor = ColorSensor('C')

TARGET = 50     # reflected light at the edge of the line
GAIN = 0.8      # tune this on your own mat
BASE_SPEED = 30

while True:
    reading = sensor.get_reflected_light()
    error = TARGET - reading
    steering = max(-100, min(100, int(error * GAIN)))
    pair.start(steering=steering, speed=BASE_SPEED)`,
    },
    task: { title: 'Follow the loop', brief: 'Follow a closed line course without leaving it, using a proportional correction.', requirements: ['Error calculated from the sensor', 'Gain used as a constant', 'Completes a full loop'], xp: 70 },
    challenge: { title: 'Fast and stable', brief: 'Raise the base speed as high as you can while still completing the loop cleanly, and record the gain you needed.', hints: ['Faster needs a higher gain', 'Write down every pair you try'], xp: 90 },
  }),
  build({
    id: 'pg-l1',
    moduleId: 'pg-m1',
    courseId: 'programming',
    order: 1,
    title: 'Values, Conditions and Loops',
    summary: 'The three building blocks every robot program is made of, taught on a robot problem.',
    minutes: 40,
    difficulty: 'Beginner',
    xp: 60,
    objectives: ['Use variables to hold sensor data', 'Branch on a condition', 'Repeat with a loop'],
    theory: [
      { id: 'pg-l1-t1', title: 'A variable is a labelled box', body: 'distance = 42 puts a number in a box named distance. Later code reads the box, not the number — which is why updating one line changes the whole program.' },
      { id: 'pg-l1-t2', title: 'Robots live in while loops', body: 'Almost every robot program is a loop that reads, decides and acts. If your program ends, your robot stops.' },
    ],
    components: [],
    wiring: { description: 'No hardware — this lesson runs against the simulator.', rows: [] },
    code: {
      filename: 'zones.py',
      explain: ['A list stands in for sensor readings', 'One branch per zone', 'The loop does the repeating'],
      source: `readings = [120, 80, 45, 22, 11, 6]

for distance in readings:
    if distance < 10:
        state = 'STOP'
    elif distance < 25:
        state = 'SLOW'
    else:
        state = 'CLEAR'
    print(distance, '->', state)`,
    },
    task: { title: 'Zone classifier', brief: 'Turn a list of distance readings into state names with clear thresholds.', requirements: ['Three zones', 'Thresholds as named constants', 'Prints each reading with its state'], xp: 40 },
    challenge: { title: 'Only on change', brief: 'Print a line only when the state is different from the previous reading.', hints: ['Keep a previous variable', 'Initialise it to None'], xp: 55 },
  }),
  build({
    id: 'pg-l2',
    moduleId: 'pg-m2',
    courseId: 'programming',
    order: 1,
    title: 'State Machines for Robots',
    summary: 'Replace tangled if-chains with named states and explicit transitions.',
    minutes: 50,
    difficulty: 'Intermediate',
    xp: 95,
    objectives: ['Model behaviour as states', 'Write explicit transitions', 'Explain why this beats nested ifs'],
    theory: [
      { id: 'pg-l2-t1', title: 'One job per state', body: 'A state knows what to do now and what would make it stop. Nothing else. That constraint is what keeps the program readable when it grows.' },
      { id: 'pg-l2-t2', title: 'Transitions are the contract', body: 'Write them down before you code: DRIVING → BACKING when an obstacle is close; BACKING → TURNING after 0.5 s. The code should read exactly like that sentence.' },
    ],
    components: [],
    wiring: { description: 'No hardware — simulated distances.', rows: [] },
    code: {
      filename: 'state_machine.py',
      explain: ['States are plain strings', 'Each branch has one exit rule', 'Transitions are logged'],
      source: `state = 'DRIVING'
timer = 0

def step(distance):
    global state, timer
    timer += 1

    if state == 'DRIVING' and distance < 20:
        state, timer = 'BACKING', 0
    elif state == 'BACKING' and timer > 5:
        state, timer = 'TURNING', 0
    elif state == 'TURNING' and timer > 4:
        state, timer = 'DRIVING', 0

    return state

for d in [100, 80, 15, 15, 15, 15, 15, 15, 90, 90, 90, 90, 90]:
    print(d, step(d))`,
    },
    task: { title: 'Three state controller', brief: 'Implement DRIVING, BACKING and TURNING with explicit transitions and a printed log.', requirements: ['Three named states', 'Transitions on clear conditions', 'Log of every change'], xp: 60 },
    challenge: { title: 'Add a STUCK state', brief: 'If the robot backs up three times within ten steps, enter STUCK and stop.', hints: ['Count recent transitions', 'A short history list is enough'], xp: 80 },
  }),
  build({
    id: 'cp-l1',
    moduleId: 'cp-m1',
    courseId: 'competition',
    order: 1,
    title: 'Reading the Field & Choosing Missions',
    summary: 'Points per second is the only metric that matters in a 150 second round.',
    minutes: 45,
    difficulty: 'Advanced',
    xp: 100,
    objectives: ['Score missions by value per second', 'Build a run plan', 'Decide what to skip'],
    theory: [
      { id: 'cp-l1-t1', title: 'The clock is the constraint', body: 'Teams lose by attempting everything. Estimate the time each mission costs including the trip there, divide the points by it, and start from the top of that list.', formula: 'priority = points ÷ (travel + execution seconds)' },
      { id: 'cp-l1-t2', title: 'Group by geography', body: 'Missions near each other belong in the same run. Every return to base costs seconds you will not get back.', callout: { kind: 'tip', text: 'Four short reliable runs beat one heroic run that fails half the time.' } },
    ],
    components: [],
    wiring: { description: 'Field planning — mat, tape measure and a stopwatch.', rows: [] },
    code: { filename: 'run_plan.md', explain: ['Every run has a launch position', 'Every run has an abort rule'], source: `RUN 1 — North cluster (est. 32 s, 65 pts)\n  launch: left wall, 10 cm from north edge\n  missions: M04 crane, M05 cargo\n  abort rule: if the crane misses, skip M05 and return\n\nRUN 2 — Centre (est. 28 s, 40 pts)\n  launch: centre notch\n  missions: M08 lever, M09 switch\n\nRUN 3 — South cluster (est. 40 s, 80 pts)\n  launch: right wall\n  missions: M12 delivery, M14 gate` },
    task: { title: 'Build your run plan', brief: 'Write a full run plan with launch positions, mission groups, time estimates and abort rules.', requirements: ['At least three runs', 'Time estimate per run', 'An abort rule for each'], xp: 65 },
    challenge: { title: 'Ninety second cut', brief: 'Your round is cut to 90 seconds. Decide what to drop and justify each cut in one sentence.', hints: ['Rank by points per second', 'Reliability counts as value'], xp: 80 },
  }),
  build({
    id: 'cp-l2',
    moduleId: 'cp-m2',
    courseId: 'competition',
    order: 1,
    title: 'Repeatability & the Judging Room',
    summary: 'Ten identical runs, one honest notebook, and how to answer the question you were not expecting.',
    minutes: 45,
    difficulty: 'Advanced',
    xp: 100,
    objectives: ['Measure run consistency', 'Keep an engineering notebook judges respect', 'Present a design decision clearly'],
    theory: [
      { id: 'cp-l2-t1', title: 'Consistency is a number', body: 'Run the same routine ten times and record the result of each. Eight out of ten is a strategy you can plan around; "it usually works" is not.' },
      { id: 'cp-l2-t2', title: 'Judges reward reasoning', body: 'They are not looking for the cleverest robot. They want to hear what you tried, what failed, and why you chose what you chose. Bring the failures — they are the evidence.' },
    ],
    components: [],
    wiring: { description: 'Notebook, stopwatch and a test log.', rows: [] },
    code: { filename: 'test_log.md', explain: ['One row per run', 'Record failures in full'], source: `Routine: RUN 1 (north cluster)\n\n| # | Result  | Time | Note                          |\n|---|---------|------|-------------------------------|\n| 1 | success | 31 s |                               |\n| 2 | success | 32 s |                               |\n| 3 | fail    | —    | crane arm caught on the frame |\n| 4 | success | 31 s | arm bent 2 mm outward         |\n| 5 | success | 30 s |                               |\n\nReliability: 4/5. Fix applied after run 3: widened arm clearance.` },
    task: { title: 'Ten run reliability test', brief: 'Test one routine ten times, log every result, and state your reliability as a fraction.', requirements: ['Ten logged runs', 'Failures described honestly', 'A stated reliability figure'], xp: 65 },
    challenge: { title: 'Two minute defence', brief: 'Prepare a two minute explanation of your hardest design decision, including what you rejected.', hints: ['Problem, options, choice, evidence', 'Practise it out loud, timed'], xp: 80 },
  }),
]

/**
 * The constants above are the English canonical. Everything that reads curriculum for display
 * goes through these helpers, so translating here covers every screen at once — and it is the
 * only place that has to know a translation exists.
 */
export const modulesForCourse = (courseId: string) =>
  MODULES.filter((m) => m.courseId === courseId)
    .sort((a, b) => a.order - b.order)
    .map(localizeModule)

/** Course order is module order first, then lesson order inside the module. */
const moduleRank = (moduleId: string) => MODULES.find((m) => m.id === moduleId)?.order ?? 0

const orderedLessons = (courseId: string) =>
  LESSONS.filter((l) => l.courseId === courseId).sort((a, b) => moduleRank(a.moduleId) - moduleRank(b.moduleId) || a.order - b.order)

export const lessonsForCourse = (courseId: string) => orderedLessons(courseId).map(localizeLesson)

/** Flat ordered lesson ids — the unlock chain follows this order. Ids never translate, so skip the work. */
export const courseLessonOrder = (courseId: string): string[] => orderedLessons(courseId).map((l) => l.id)
