let musicShader;
// these variables keep track of opacity of visual elements (correspond to audio)
let beat = 0;
let perc1 = 0;
let perc1b = 0;
let perc1c = 0;
let perc2 = 0;
let perc2b = 0;
let perc2c = 0;
let sibeat = 0;

let rAdd = 0;
let gAdd = 0;
let bAdd = 0;

const addSets = [
  { r: 0, g: 0, b: 0 },
  { r: 0.2, g: 0.3, b: 0.3 },
];

// these variables keep track of the zoom transition
let transition1 = 0;
let transition1State = "pre";

let playerState = "intro"; // intro / play / pause

function preload() {
  musicShader = loadShader("shader.vert", "shader.frag");
}

function setup() {
  // shaders require WEBGL mode to work
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();
}

function isHighDensity() {
  return (
    (window.matchMedia &&
      (window.matchMedia(
        "only screen and (min-resolution: 124dpi), only screen and (min-resolution: 1.3dppx), only screen and (min-resolution: 48.8dpcm)"
      ).matches ||
        window.matchMedia(
          "only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (min--moz-device-pixel-ratio: 1.3), only screen and (min-device-pixel-ratio: 1.3)"
        ).matches)) ||
    (window.devicePixelRatio && window.devicePixelRatio > 1.3)
  );
}

function isRetina() {
  return (
    ((window.matchMedia &&
      (window.matchMedia(
        "only screen and (min-resolution: 192dpi), only screen and (min-resolution: 2dppx), only screen and (min-resolution: 75.6dpcm)"
      ).matches ||
        window.matchMedia(
          "only screen and (-webkit-min-device-pixel-ratio: 2), only screen and (-o-min-device-pixel-ratio: 2/1), only screen and (min--moz-device-pixel-ratio: 2), only screen and (min-device-pixel-ratio: 2)"
        ).matches)) ||
      (window.devicePixelRatio && window.devicePixelRatio >= 2)) &&
    /(iPad|iPhone|iPod)/g.test(navigator.userAgent)
  );
}

function keyPressed() {
  if (keyCode === 70) {
    let fs = fullscreen();
    fullscreen(!fs);
  }
}

function draw() {
  // shader() sets the active shader with our shader
  shader(musicShader);

  musicShader.setUniform("u_time", frameCount * 0.01);
  musicShader.setUniform("u_resolution", [windowWidth, windowHeight]);

  // bass note / circle
  musicShader.setUniform("u_beat", beat);

  // zoom transition
  musicShader.setUniform("u_transition1", transition1);

  // percussive lines
  musicShader.setUniform("u_perc1", perc1);
  musicShader.setUniform("u_perc1b", perc1b);
  musicShader.setUniform("u_perc1c", perc1c);
  musicShader.setUniform("u_perc2", perc2);
  musicShader.setUniform("u_perc2b", perc2b);
  musicShader.setUniform("u_perc2c", perc2c);
  musicShader.setUniform("u_perc2c", perc2c);

  // high drone
  musicShader.setUniform("u_sibeat", sibeat);

  // colour diff
  musicShader.setUniform("u_rAdd", rAdd);
  musicShader.setUniform("u_gAdd", gAdd);
  musicShader.setUniform("u_bAdd", bAdd);

  // rect gives us some geometry on the screen
  rect(0, 0, width, height);

  // fade out elements gradually if currently visible
  if (beat > 0) {
    beat -= 0.01;
  }
  if (perc1 > 0) {
    perc1 -= 0.1;
  }
  if (perc1b > 0) {
    perc1b -= 0.1;
  }
  if (perc1c > 0) {
    perc1c -= 0.1;
  }
  if (perc2 > 0) {
    perc2 -= 0.1;
  }
  if (perc2b > 0) {
    perc2b -= 0.1;
  }
  if (perc2c > 0) {
    perc2c -= 0.1;
  }
  if (sibeat > 0) {
    sibeat -= 0.005;
  }

  if (transition1State === "active") {
    if (transition1 >= 1) {
      transition1State = "complete";
    } else {
      // this is the zoom position passed to the shader
      transition1 += 0.0005;
    }
  } else if (transition1State === "reverse") {
    if (transition1 <= 0) {
      transition1State = "pre";
      setTimeout(() => {
        randomizeParts();
        changeColours();
        Tone.Transport.seconds = 0;
      }, 5000);
    } else {
      // this is the zoom position passed to the shader
      transition1 -= 0.0005;
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// returns result from 0 to max - 1
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function changeColours() {
  const colourAdjustVersion = getRandomInt(addSets.length);
  const colourAdjust = addSets[colourAdjustVersion];
  rAdd = colourAdjust.r;
  gAdd = colourAdjust.g;
  bAdd = colourAdjust.b;
}

function randomizeParts() {
  const version = getRandomInt(partBOptions.length);
  const bassPartVersion = bassOptions[version];
  const bassProb = bassOptionProbabilities[version];
  const partBVersion = partBOptions[version];
  const partBProb = partBOptionProbabilities[version];
  const partDVersion = partDOptions[version];
  part.clear();
  part.probability = bassProb;
  bassPartVersion.forEach((ev) => {
    part.add(ev.time, { note: ev.note, velocity: ev.velocity });
  });
  partB.clear();
  partB.probability = partBProb;
  partBVersion.forEach((ev) => {
    partB.add(ev.time, { note: ev.note, velocity: ev.velocity });
  });
  partD.clear();
  partDVersion.forEach((ev) => {
    partD.add(ev.time, { note: ev.note, velocity: ev.velocity });
  });
}

function triggerTransition1() {
  transition1State = "active";
}

function triggerTransition1Reverse() {
  transition1State = "reverse";
}

// the end curtain
let curtain = document.getElementById("curtain");

// pause screen
let pauseScreen = document.getElementById("paused-screen");

function triggerEnd() {
  // curtain.style.display = "flex";
  // randomize notes and sequence
}
function triggerReverse() {
  triggerTransition1Reverse();
  part.start(0);
}

function mousePressed() {
  if (playerState === "pause") {
    playTone();
  } else if (playerState === "play") {
    pauseTone();
  }
}

function pauseTone() {
  playerState = "pause";
  Tone.Transport.pause();
  pauseScreen.style.display = "flex";
}

function playTone() {
  playerState = "play";
  Tone.Transport.start();
  pauseScreen.style.display = "none";
}

// tone js
const startButton = document.getElementById("start-audio");
const introView = document.getElementById("intro");

startButton.addEventListener("click", async () => {
  introView.style.display = "none";
  await Tone.start();
  setTimeout(() => {
    Tone.Transport.start();
    // Tone.Transport.loop = true;
    playerState = "play";
  }, 1000);
});

// make some effects nodes
const feedbackDelay = new Tone.FeedbackDelay("4n", 0.8);
const dist = new Tone.Distortion(0.3);
const reverb2 = new Tone.Reverb({ decay: 10, wet: 0.8 });

// plays in first half bass
const synthA = new Tone.PolySynth(Tone.FMSynth).chain(
  reverb2,
  Tone.Destination
);
synthA.set({
  harmonicity: 0.5,
  modulationIndex: 5,
  modulation: {
    type: "square",
  },
  modulationEnvelope: {
    attack: 0.5,
    decay: 0,
    sustain: 1,
    release: 0.5,
  },
});

//plays in first half
const synthB = new Tone.AMSynth({
  harmonicity: 0.25,
  envelope: {
    attack: 0.2,
    decay: 0.01,
    sustain: 1,
    release: 0.8,
  },
  modulation: {
    type: "square",
  },
  modulationEnvelope: {
    attack: 0.5,
    decay: 0,
    sustain: 1,
    release: 0.5,
  },
}).chain(feedbackDelay, dist, reverb2, Tone.Destination);

//plays in second half - percussive
const noiseSynth = new Tone.NoiseSynth().chain(feedbackDelay);

//plays in second half
const duoSynth = new Tone.DuoSynth({
  vibratoAmount: 0.5,
  vibratoRate: 0.3,
  harmonicity: 2,
  voice0: {
    portamento: 0,
    oscillator: {
      type: "sine",
    },
    filterEnvelope: {
      attack: 0.2,
      decay: 0,
      sustain: 1,
      release: 100,
    },
    envelope: {
      attack: 50,
      decay: 0,
      sustain: 1,
      release: 500,
    },
  },
  voice1: {
    portamento: 0,
    oscillator: {
      type: "sine",
    },
    filterEnvelope: {
      attack: 0.1,
      decay: 0,
      sustain: 1,
      release: 100,
    },
    envelope: {
      attack: 20,
      decay: 0,
      sustain: 1,
      release: 600,
    },
  },
}).chain(reverb2);

// bass-y

// variation options
const bassOptions = [
  [
    { time: "0:0", note: "E3", velocity: 1.0 },
    { time: "0:1", note: "E3", velocity: 0.6 },
  ],
  [
    { time: "0:0", note: "E3", velocity: 1.0 },
    { time: "0:1", note: "E3", velocity: 0.6 },
  ],
  [
    { time: "0:0", note: "A3", velocity: 1.0 },
    { time: "0:2", note: "A3", velocity: 0.6 },
    { time: "0:4", note: "A3", velocity: 0.4 },
  ],
  [
    { time: "0:0", note: "D4", velocity: 1.0 },
    { time: "0:1", note: "D4", velocity: 0.6 },
  ],
];
const bassOptionProbabilities = [0.7, 0.7, 0.3, 0.3];
const part = new Tone.Part((time, value) => {
  synthA.triggerAttackRelease(value.note, "16n", time, value.velocity);

  // need to use this for drawing
  Tone.Draw.schedule(() => {
    beat = 1;
    const bar = parseInt(Tone.Transport.position.split(":")[0]);
    if (bar > 30 && bar < 64 && transition1State === "pre") {
      // zoom out when near the end of the half
      triggerTransition1();
    }
  }, time);
}, bassOptions[0]);
part.loop = 32;
part.probability = bassOptionProbabilities[0];
part.humanize = true;
part.start(0);

const partBOptions = [
  [
    { time: "0:0:0", note: "B3", velocity: 0.6 },
    { time: "0:0:2", note: "A4", velocity: 0.3 },
    { time: "0:0:3", note: "B4", velocity: 0.5 },
    { time: "0:1", note: "E#4", velocity: 0.6 },
    { time: "0:2", note: "B4", velocity: 0.4 },
    { time: "0:3:1", note: "A4", velocity: 0.4 },
    { time: "0:3:2", note: "F#4", velocity: 0.6 },
  ],
  [
    { time: "0:0:1", note: "B4", velocity: 0.6 },
    { time: "0:0:2", note: "A4", velocity: 0.3 },
    { time: "0:0:4", note: "E#4", velocity: 0.5 },
    { time: "0:1:2", note: "B4", velocity: 0.6 },
    { time: "0:2:3", note: "B3", velocity: 0.4 },
    { time: "0:3:1", note: "F#4", velocity: 0.4 },
    { time: "0:3:3", note: "A4", velocity: 0.6 },
  ],
  [
    { time: "0:0:1", note: "A3", velocity: 0.6 },
    { time: "0:0:2", note: "A4", velocity: 0.3 },
    { time: "0:0:4", note: "A5", velocity: 0.2 },
    { time: "0:1:2", note: "A2", velocity: 0.8 },
    { time: "0:2:3", note: "A3", velocity: 0.4 },
    { time: "0:3:1", note: "A4", velocity: 0.4 },
    { time: "0:3:3", note: "A2", velocity: 0.6 },
  ],
  [
    { time: "0:0:1", note: "D3", velocity: 0.6 },
    { time: "0:0:2", note: "D4", velocity: 0.3 },
    { time: "0:0:4", note: "D5", velocity: 0.2 },
    { time: "0:1:2", note: "D2", velocity: 0.8 },
    { time: "0:2:3", note: "D3", velocity: 0.4 },
    { time: "0:3:1", note: "D4", velocity: 0.4 },
    { time: "0:3:3", note: "D2", velocity: 0.6 },
  ],
];
const partBOptionProbabilities = [0.5, 0.5, 0.3, 0.3];

const partB = new Tone.Part((time, value) => {
  // the value is an object which contains both the note and the velocity
  synthB.triggerAttackRelease(value.note, "8n", time, value.velocity);
}, partBOptions[0]);
partB.loop = 32;
partB.probability = partBOptionProbabilities[0];
partB.humanize = true;
partB.start(0);

const partC = new Tone.Part(
  (time, value) => {
    // the value is an object which contains both the note and the velocity
    noiseSynth.triggerAttackRelease("16n", time, value.velocity);
    const bar = parseInt(Tone.Transport.position.split(":")[0]);
    if (bar > 62) {
      triggerReverse();
    }
    Tone.Draw.schedule(() => {
      if (value.note === "C2") {
        perc1 = 1;
        setTimeout(() => {
          perc1b = 1;
        }, Tone.Time("4n").toMilliseconds());
        setTimeout(() => {
          perc1c = 1;
        }, Tone.Time("4n").toMilliseconds() * 2);
      } else {
        perc2 = 1;
        setTimeout(() => {
          perc2b = 1;
        }, Tone.Time("4n").toMilliseconds());
        setTimeout(() => {
          perc2c = 1;
        }, Tone.Time("4n").toMilliseconds() * 2);
      }
    }, time);
  },
  [
    { time: "0:0:0", note: "C2", velocity: 0.1 },
    { time: "0:1:2", note: "G2", velocity: 0.1 },
  ]
);
partC.loop = 56;
partC.probability = 0.3;
partC.start("32m"); //

const partDOptions = [
  [{ time: "0:0:0", note: "A4", velocity: 0.6 }],
  [{ time: "0:0:0", note: "C3", velocity: 1.0 }],
  [{ time: "0:0:0", note: "A4", velocity: 0.6 }],
  [{ time: "0:0:0", note: "C3", velocity: 1.0 }],
];

const partD = new Tone.Part((time, value) => {
  duoSynth.triggerAttackRelease(value.note, "1m", time, value.velocity);
  Tone.Draw.schedule(() => {
    sibeat = 1;
  }, time);
}, partDOptions[0]);
partD.loop = 40;
partD.probability = 0.2;
partD.humanize = true;
partD.start("32m");
