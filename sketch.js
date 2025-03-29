let port;
let writer;
let reader;
let data = "";


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

// Serial communication
let serial;
// let portName = '/dev/tty.usbmodem1101'; // Replace with your serial port name
let colorSet, testColors, numColorsInput, rgbInputs = [];
let colorPickers = [];
let submitButton;
let rgbInputContainer;  // Container to hold the RGB input fields

// CLUE
var GRADIENT;
const MAX_STRIAS = 11;
const GRADIENT_QUALITY = 256;
// 

const colors = [
  [255, 0, 0],
  [0, 255, 0],
  [0, 0, 255],
  ]

function setup() {

// CLUE
  createCanvas(windowWidth*0.3, windowWidth*0.3);
  noStroke();
  GRADIENT = createGraphics(GRADIENT_QUALITY,20);
  GRADIENT.pixelDensity(1);
  GRADIENT.noStroke();
  // GRADIENT.show();
  frameRate(60);
// CLUE

  // createCanvas(400, 400);
  

  // Create a div to hold everything and center it
  let container = createDiv();
  container.parent(select('main'));
  container.id('centered-content'); // Assign an ID for styling
  container.style('margin-top', `${windowHeight * 0.1}px`); // Add margin of 20% of window height


  // Create form elements within the container
  // createElement('h2', 'clue. configuration').parent(container);

  let button = createButton("Select Device").parent(container);
  button.class('button-36');
  // button.position(10, 10);
  createElement('br').parent(container);
  createElement('br').parent(container);
  button.mousePressed(connectToSerialPort);

  // Boolean select (true/false)
  createSpan('Palette ').parent(container);
  let colorSetLabel = createSpan().parent(container);
  colorSetLabel.html('<label class="switch"><input type="checkbox" id="colorSetToggle"><span class="slider"></span></label>');
  colorSet = select('#colorSetToggle');
  colorSet.changed(() => {
    colorSet.value(colorSet.elt.checked);
    sendSerialData();
  });

  createElement('br').parent(container);
  createElement('br').parent(container);

  createSpan('TestMode ').parent(container);
  let testColorsLabel = createSpan().parent(container);
  testColorsLabel.html('<label class="switch"><input type="checkbox" id="testColorsToggle"><span class="slider"></span></label>');
  testColors = select('#testColorsToggle');
  testColors.changed(() => {
    testColors.value(testColors.elt.checked);
    sendSerialData();
  });
  
  createElement('br').parent(container);
  createElement('br').parent(container);

  // Input for number of colors
  createSpan('Colors  ').parent(container);
  numColorsInput = createSelect().parent(container);
  for (let i = 1; i <= 10; i++) {
    numColorsInput.option(i);
  }
  numColorsInput.value('0'); // Set default value
  createElement('br').parent(container);
  numColorsInput.changed(updateRGBInputs); // Dynamically add inputs for RGB colors
  createElement('br').parent(container);

  // Create a container for RGB inputs
  rgbInputContainer = createDiv().parent(container);

  // Add a keyboard event listener to toggle the visibility of the div when 'h' is pressed
  document.addEventListener('keydown', (event) => {
    if (event.key === 'h') {
      if (container.style('display') === 'none') {
        container.style('display', 'block'); // Show the container
        resizeCanvas(windowHeight * 0.3, windowHeight * 0.3);
      } else {
        container.style('display', 'none'); // Hide the container
        resizeCanvas(windowHeight * 0.8, windowHeight * 0.8);
      }
    }
  });
  // Submit button
  // submitButton = createButton('Send').parent(container);
  // submitButton.mousePressed(sendSerialData);
  // submitButton.class('button-36');

}

function updateRGBInputs() {
  // Store current values
  let currentValues = rgbInputs.map(input => input.value());

  // Clear the container holding RGB inputs
  rgbInputContainer.html('');  // This removes all previous content

  // Get the number of colors from input
  let numColors = int(numColorsInput.value());

  // Create inputs for each RGB color
  rgbInputs = [];
  colorPickers = [];
  
  for (let i = 0; i < numColors; i++) {
    let rgbInputContainerRow = createDiv().parent(rgbInputContainer).style('display', 'flex').style('align-items', 'center').style('justify-content', 'center');
    let rgbInput = createInput(currentValues[i] || '', 'text').parent(rgbInputContainerRow).style('width', '50px').style('margin-right', '10px').style('margin-bottom', '10px');
    let colorPicker = createColorPicker(currentValues[i] ? `#${currentValues[i]}` : '#ffffff').parent(rgbInputContainerRow).style('margin-bottom', '10px');; // Default color
    rgbInputs.push(rgbInput);
    colorPickers.push(colorPicker);
    
    // createElement('br').parent(rgbInputContainer);

    // Set up color picker event listener
    colorPicker.input(function() {
      // When the color is picked, update the corresponding text input field with the hex value
      rgbInput.value(colorPicker.value().toUpperCase().substring(1)); // Remove '#' from hex string
      sendSerialData();
    });

    // Set up text input event listener
    rgbInput.input(function() {
      // When the text input changes, update the corresponding color picker
      colorPicker.value(`#${rgbInput.value()}`);
      sendSerialData();
    });
  }
  createElement('br').parent(rgbInputContainer);
}

function sendSerialData() {
  // Get the boolean value
  let colorSetBool = colorSet.value();
  let testModeBool = testColors.value();

  // Get the number of colors
  let numColors = int(numColorsInput.value());

  // Get the RGB values
  let rgbValues = [];
  for (let i = 0; i < rgbInputs.length; i++) {
    let colorHex = rgbInputs[i].value();
    rgbValues.push(colorHex.toUpperCase());  // Store hex color without the '#'
  }

  // Construct the data string in the format "true,5,FF0000,00FF00,0000FF"
  let dataString = `${colorSetBool},${testModeBool},${numColors},${rgbValues.join(',')}`;

  // Send the data via serial
  if (writer) {
    const textToSend = dataString;
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(textToSend + "\n"); // Add newline if needed
    writer.write(encodedData).then(() => {
      console.log("Data sent: ", textToSend);
    }).catch(err => {
      console.error("Error sending data: ", err);
    });
  } else {
    console.warn("No port connected!");
  }

  console.log("Data sent to serial:");
  console.log(dataString);
  // Update the colors array with the new RGB values
  if (rgbValues.length > 0) {
  colors.length = 0; // Clear the existing colors array
  for (let i = 0; i < rgbValues.length; i++) {
    let hex = rgbValues[i];
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    colors.push([r, g, b]);
  }
  }
}

function draw() {
  background(0);
  generateGradient(colors, BLEND = true);
  Lamp(height/8,height/8);
  fill(255); // Set text color to white
  // filter(BLUR, 10); // Apply a blur filter to the gradient
}

function Lamp(rows,cols) {
  generateGradient(colors, BLEND = false);
  background(0); 
  GRADIENT.loadPixels();

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
        w = width
        h = height
        startx = (width / 2) - w/2
        starty = (height / 2) - h/2
        size_x = w/cols
        size_y = h/rows
        pos_x = startx + x * size_x 
        pos_y = starty + y * size_y

        a = - w/2 + x * size_x
        b = - h/2 + y * size_y
        d = sqrt(a**2 + b**2)

        if (d < w/2) {
          let i = floor((d / (w/2)) * GRADIENT.width)
          // GRADIENT.fill(255);
          // GRADIENT.rect(d_pos,0,1,10);
          let c = color(GRADIENT.pixels[i*4],GRADIENT.pixels[i*4+1],GRADIENT.pixels[i*4+2])
          // c = GRADIENT.get(.height/2)
          noStroke();
          fill(c);
          rect(pos_x, pos_y, size_x, size_y);
        }
    }
  }
}
