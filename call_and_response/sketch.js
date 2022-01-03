const controls = {
  y: 0,
  size: 0,
  amount: 5,
  speed: 2,
  activeIndex: 0,
  colors: ['#EF7487', '#81EBFC', '#B7FB89', '#EE76F8', '#FEF688'],
  notes: ['C', 'G', 'E', 'B', 'F']
}

const touch = {
  x: 0,
  y: 0
}

let sounders = [];

let connection = {
  shared: null,
  my: null,
  participants: null,
  previousNumber: 0,
  init: function () {
    this.shared.state = this.shared.state || [];
  },
  getParticipantsNumber: function () {
    return (this.participants !== null) ? this.participants.length : 0;
  },
  setMyTeam: function (team) {
    this.my.selectedTeam = team;
  },
  getMyTeam: function () {
    return this.my.selectedTeam;
  },
  pushAction: function (action) {
    const obj = {
      team: this.my.selectedTeam,
      action: action
    };
    const json = JSON.stringify(obj);
    this.shared.state.push(json);
  },
  getNewState: function () {
    const state = this.shared.state;
    const numOfActions = state.length;
    let newArr = [];
    if(numOfActions > this.previousNumber) {
        for(let i = (this.previousNumber); i < numOfActions; i++) {
            if(state[i]) {
                const json = JSON.parse(state[i]);
                newArr.push(json);
            }
        }
        this.previousNumber = numOfActions;
    }
    return [...newArr];
  },
  resetConnection: function () {
    partySetShared(this.shared, {
        state: []
    });
  }
};

let blueTeamColor;
let yellowTeamColor;

function preload() {
    partyConnect(
        "wss://deepstream-server-1.herokuapp.com", // url
        "demilade_demo_succghvjdr", // game_name
        "default" // room_name
    );
    connection.shared = partyLoadShared("globals");
    connection.my = partyLoadMyShared();
    connection.participants = partyLoadParticipantShareds();  
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  controls.size = width / controls.amount;
  controls.y = height - controls.size;
  
  connection.init();
  const rand = connection.getParticipantsNumber();
  
  setTimeout(() => {
    const p = document.querySelector("#party-debug");
    p.style.opacity = 0;
  }, 100);
    
    console.log(`Number of people: ${rand}`);
    connection.setMyTeam((rand % 2 === 1) ? "Blue" : "Yellow");
    console.log(`Your color is: ${connection.getMyTeam()}`);
}

function draw() {
  background('white');
  createControls();
  const state = connection.getNewState();
  if(state.length > 0) {
    for(let i = 0; i < state.length; i++) {
    const obj = JSON.parse(state[i].action);
    if(state[i].team !== connection.getMyTeam()) {
      append(sounders, new Sounder(obj.x, obj.y, true));
    }
  }
  }
  sounders.forEach(sounder => {
    sounder.draw();
    move(sounder);
  });
  for (let i = 0; i < touches.length; i++) {
    const xPos = touches[i].x;
    const yPos = touches[i].y;
    const inControlsRange = yPos >= controls.y;
    if (inControlsRange) {
      controls.activeIndex = floor(xPos/width * controls.amount);
      fill(controls.colors[controls.activeIndex]);
    } 
  }
}

function createControls() {
  for (let i = 0; i < controls.amount; i++) {
    const x = i * controls.size;
    const color = controls.colors[i];
    fill(color);
    noStroke();
    rect(x, controls.y, controls.size, controls.size)
  }
}

function move(sounder) {
  sounder.x += controls.speed;
  if (sounder.x >= width) {
    sounder.x = controls.size * -1;
    sounder.play();
  }
}

function mouseClicked(event) {
  console.log("Clicked!");
  touch.x = event.clientX;
  touch.y = event.clientY;
  const canDrawSounder = touch.y < controls.y - (controls.size/2);
  if (canDrawSounder) {
    const newSounder = new Sounder(touch.x, touch.y, false);
    append(sounders, newSounder);
    newSounder.play();
  }
  
  connection.pushAction(JSON.stringify({x: touch.x, y: touch.y}));
}

class Sounder {
  constructor(x, y, alien) {
    this.x = x - (controls.size/2);
    this.y = y - (controls.size/2);
    this.color = alien ? "black" : controls.colors[controls.activeIndex];
    this.note = controls.notes[controls.activeIndex] + floor(map(this.y, 0, height, 7, 1));
    this.sound = new Tone.Synth().toDestination();
  }
  draw() {
    fill(this.color);
    rect(this.x, this.y, controls.size, controls.size)
  }
  play() {
    this.sound.triggerAttackRelease(this.note, '8n');
  }
}