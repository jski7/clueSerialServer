// Common animation code
let port;
let writer;
let reader;
let data = "";

// CLUE animation variables
var GRADIENT;
const MAX_STRIAS = 11;
const GRADIENT_QUALITY = 256;

// Default colors
const defaultColors = [
  [255, 0, 0],
  [0, 255, 0],
  [0, 0, 255],
];

// Stria class for gradient animations
class stria {
    constructor(colors) {
        this.color = randomColor(colors);
        this.red = this.color[0];
        this.green = this.color[1];
        this.blue = this.color[2];
        this.pos = random();
        this.alpha = 0;
        this.vis = 0;
        this.max_alpha = random(.1,1);
        this.width = random(.1,1) * GRADIENT_QUALITY;
        this.fade_dir = 1;
        this.live = 0;
        this.start = millis();
        this.attack = random(2000,10000);
        this.sustain = random(4000);
        this.release = random(2000,10000);
        this.duration = this.attack + this.sustain + this.release;
        this.end = this.start + this.attack + this.sustain + this.release;
        this.kill = false;
        this.speed = random(-1,1) * 0.005;
        this.is_vibrant = chance(0.05);
        this.vibrancy = random(0.8,1.2);
        this.is_strobo = chance(0.8);
    }

    show() {
        this.live = millis() - this.start;
        this.pos = this.pos + this.speed;
        if (this.live <= this.attack) {
            this.vis = (this.live/this.attack);
        }

        if (this.live >= (this.attack + this.sustain)) {
            this.vis = map(this.live, this.attack + this.sustain, this.duration, 1, 0);
        }  

        this.kill = this.end < millis() || this.pos - (this.width/GRADIENT_QUALITY)/2 > 1 || this.pos + this.width/2/GRADIENT_QUALITY < 0;
        
        let r,g,b,a, pos_cos;

        for (let c = 0; c <= (this.width/2); c++) {
            let pos_cos = (-(cos((c/this.width)*2*Math.PI - Math.PI)) + 1)/2;
            a = pos_cos * this.vis * this.max_alpha * 255;
            r = this.red;
            g = this.green;
            b = this.blue;
            
            GRADIENT.fill(r, g, b, a);
            if (this.pos * GRADIENT_QUALITY + c <= GRADIENT.width) {
                GRADIENT.rect(floor(this.pos * GRADIENT_QUALITY + c), 0, 1, GRADIENT.height);
            }
            if (this.pos * GRADIENT_QUALITY + c >= 0) {
                GRADIENT.rect(floor(this.pos * GRADIENT_QUALITY - c - 1), 0, 1, GRADIENT.height);
            }
        }
    }
}

var strias = [];

// Utility functions
function randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function randomColor(set = defaultColors) {
    return randomElement(set);
}

function chance(c) {
    return random() < c;
}

// Generate gradient animation
function generateGradient(colors = defaultColors, BLEND = false) {
    GRADIENT.background(0);
    if (BLEND == true) {
        GRADIENT.blendMode(ADD);
    }
    if (chance(0.5) && strias.length < MAX_STRIAS) {
        strias.push(new stria(colors));
    } 
    for (let i = strias.length-1; i >= 0; i--) {
        if (strias[i].kill) {
            strias.splice(i,1);
        }
    }
    for (let s of strias) {
        s.show();
    }
    if (BLEND == true) {
        GRADIENT.blendMode(NORMAL);
    }
    let blackout = 0.5;
    for (let i = GRADIENT.width * blackout; i <= GRADIENT.width; i++) {
      GRADIENT.fill(0, 0, 0, map(i, GRADIENT.width * blackout, GRADIENT.width, 0, 255));
      GRADIENT.rect(i,0,1,GRADIENT.height);
    }
}

// Function to render the lamp visualization
function renderLamp(rows, cols, colors, blendMode = true) {
    generateGradient(colors, blendMode);
    background(0); 
    GRADIENT.loadPixels();

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            let w = width;
            let h = height;
            let startx = (width / 2) - w/2;
            let starty = (height / 2) - h/2;
            let size_x = w/cols;
            let size_y = h/rows;
            let pos_x = startx + x * size_x;
            let pos_y = starty + y * size_y;

            let a = - w/2 + x * size_x;
            let b = - h/2 + y * size_y;
            let d = sqrt(a**2 + b**2);

            if (d < w/2) {
                let i = floor((d / (w/2)) * GRADIENT.width);
                let c = color(GRADIENT.pixels[i*4], GRADIENT.pixels[i*4+1], GRADIENT.pixels[i*4+2]);
                noStroke();
                fill(c);
                rect(pos_x, pos_y, size_x, size_y);
            }
        }
    }
}

// Serial port connection
async function connectToSerialPort() {
    try {
        // Request a port and open a connection
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 115200 });
        writer = port.writable.getWriter();
        reader = port.readable.getReader();

        console.log("Connected to port!");
        
        // Read data from the serial port
        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                // Allow the serial port to be closed
                reader.releaseLock();
                break;
            }
            data += new TextDecoder().decode(value);
            console.log("Data received: ", data);
        }
    } catch (err) {
        console.error("Error connecting to serial port: ", err);
    }
}

// Initialize gradient
function initAnimation(canvasWidthMultiplier = 0.3, frameRateValue = 60) {
    createCanvas(windowWidth * canvasWidthMultiplier, windowWidth * canvasWidthMultiplier);
    noStroke();
    GRADIENT = createGraphics(GRADIENT_QUALITY, 20);
    GRADIENT.pixelDensity(1);
    GRADIENT.noStroke();
    frameRate(frameRateValue);
} 