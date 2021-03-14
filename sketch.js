import "regenerator-runtime/runtime";
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

// these variables keep track of the zoom transition
let transition1 = 0;
let transition1State = "pre";

function preload() {
  musicShader = loadShader("shader.vert", "shader.frag");
}

function setup() {
  // shaders require WEBGL mode to work
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();
}

function draw() {
  // shader() sets the active shader with our shader
  shader(musicShader);

  musicShader.setUniform("u_time", frameCount * 0.01);
  musicShader.setUniform("u_resolution", [width, height]);

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
      transition1On = "complete";
    } else {
      if (transition1 < 0.1 || transition1 >= 0.8) {
        // this is the zoom position passed to the shader
        transition1 += 0.001;
      } else if (transition1 >= 0.1 && transition1 < 0.9) {
        transition1 += 0.005;
      }
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function triggerTransition1() {
  transition1State = "active";
}

// the end curtain
let curtain = document.getElementById("curtain");

function triggerEnd() {
  curtain.style.display = "flex";
}

// tone js
const startButton = document.getElementById("start-audio");

startButton.addEventListener("click", async () => {
  startButton.style.display = "none";
  await Tone.start();
  setTimeout(() => {
    Tone.Transport.start();
  }, 1000);
  startButton.style.display = none;
});

// make some effects nodes
const feedbackDelay = new Tone.FeedbackDelay("4n", 0.8);
const dist = new Tone.Distortion(0.3);
const reverb1 = new Tone.Reverb({ decay: 100, wet: 0.7 });
const reverb2 = new Tone.Reverb({ decay: 100, wet: 0.8 });

// plays in first half
const synthA = new Tone.PolySynth(Tone.FMSynth).chain(
  reverb1,
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
      release: 300,
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
      release: 500,
    },
  },
}).chain(reverb2);

// bass-y
const part = new Tone.Part(
  (time, value) => {
    synthA.triggerAttackRelease(value.note, "16n", time, value.velocity);

    // need to use this for drawing
    Tone.Draw.schedule(() => {
      beat = 1;
      const bar = parseInt(Tone.Transport.position.split(":")[0]);
      if (bar > 30 && transition1State === "pre") {
        // zoom out when near the end of the half
        triggerTransition1();
      }
    }, time);
  },
  [
    { time: "0:0", note: "E3", velocity: 1.0 },
    { time: "0:1", note: "E3", velocity: 0.6 },
  ]
);
part.loop = 32;
part.probability = 0.7;
part.humanize = true;
part.start(0);

const partB = new Tone.Part(
  (time, value) => {
    // the value is an object which contains both the note and the velocity
    synthB.triggerAttackRelease(value.note, "8n", time, value.velocity);
  },
  [
    { time: "0:0:0", note: "B3", velocity: 0.6 },
    { time: "0:0:2", note: "A4", velocity: 0.3 },
    { time: "0:0:3", note: "B4", velocity: 0.5 },
    { time: "0:1", note: "E#4", velocity: 0.6 },
    { time: "0:2", note: "B4", velocity: 0.4 },
    { time: "0:3:1", note: "A4", velocity: 0.4 },
    { time: "0:3:2", note: "F#4", velocity: 0.6 },
  ]
);
partB.loop = 32;
partB.probability = 0.5;
partB.humanize = true;
partB.start(0);

const partC = new Tone.Part(
  (time, value) => {
    // the value is an object which contains both the note and the velocity
    noiseSynth.triggerAttackRelease("16n", time, value.velocity);

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
partC.loop = 32;
partC.probability = 0.3;
partC.start("32m"); //

const partD = new Tone.Part(
  (time, value) => {
    duoSynth.triggerAttackRelease(value.note, "1m", time, value.velocity);
    Tone.Draw.schedule(() => {
      sibeat = 1;
      const bar = parseInt(Tone.Transport.position.split(":")[0]);
      if (bar > 62) {
        triggerEnd();
      }
    }, time);
  },
  [{ time: "0:0:0", note: "A4", velocity: 0.6 }]
);
partD.loop = 32;
partD.probability = 0.2;
partD.humanize = true;
partD.start("32m");
