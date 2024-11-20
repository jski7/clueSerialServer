// Serial communication
let serial;
let portName = '/dev/cu.usbmodem140282401'; // Replace with your serial port name
let booleanSelect, numColorsInput, rgbInputs = [];
let colorPickers = [];
let submitButton;
let rgbInputContainer;  // Container to hold the RGB input fields

function setup() {
  // Create a div to hold everything and center it
  let container = createDiv();
  container.id('centered-content'); // Assign an ID for styling
  
  // Create form elements within the container
  createElement('h2', 'Set Fill Values').parent(container);

  // Boolean select (true/false)
  createSpan('Boolean (true/false): ').parent(container);
  booleanSelect = createSelect().parent(container);
  booleanSelect.option('true');
  booleanSelect.option('false');
  createElement('br').parent(container);

  // Input for number of colors
  createSpan('Number of RGB Colors: ').parent(container);
  numColorsInput = createInput('1', 'number').parent(container);
  numColorsInput.input(updateRGBInputs); // Dynamically add inputs for RGB colors
  createElement('br').parent(container);

  // Create a container for RGB inputs
  rgbInputContainer = createDiv().parent(container);

  // Submit button
  submitButton = createButton('Submit').parent(container);
  submitButton.mousePressed(sendSerialData);

  // Initialize and open the hardcoded serial port
  serial = new p5.SerialPort();
  serial.open(portName);  // Open the specified serial port
}

function updateRGBInputs() {
  // Clear the container holding RGB inputs
  rgbInputContainer.html('');  // This removes all previous content

  // Get the number of colors from input
  let numColors = int(numColorsInput.value());

  // Create inputs for each RGB color
  rgbInputs = [];
  colorPickers = [];
  
  for (let i = 0; i < numColors; i++) {
    let rgbLabel = createSpan(`Color ${i + 1} (Hex): `).parent(rgbInputContainer);
    let rgbInput = createInput('', 'text').parent(rgbInputContainer);
    let colorPicker = createColorPicker('#ffffff').parent(rgbInputContainer); // Default color
    rgbInputs.push(rgbInput);
    colorPickers.push(colorPicker);
    
    createElement('br').parent(rgbInputContainer);

    // Set up color picker event listener
    colorPicker.input(function() {
      // When the color is picked, update the corresponding text input field with the hex value
      rgbInput.value(colorPicker.value().toUpperCase().substring(1)); // Remove '#' from hex string
    });
  }
}

function sendSerialData() {
  // Get the boolean value
  let boolValue = booleanSelect.value();

  // Get the number of colors
  let numColors = int(numColorsInput.value());

  // Get the RGB values
  let rgbValues = [];
  for (let i = 0; i < rgbInputs.length; i++) {
    let colorHex = rgbInputs[i].value();
    rgbValues.push(colorHex.toUpperCase());  // Store hex color without the '#'
  }

  // Construct the data string in the format "true,5,FF0000,00FF00,0000FF"
  let dataString = `${boolValue},${numColors},${rgbValues.join(',')}`;

  // Send the data via serial
  serial.write(dataString + '\n');  // Send the data followed by a newline

  console.log("Data sent to serial:");
  console.log(dataString);
}

function draw() {
  // We are not using the draw loop in this example
}
