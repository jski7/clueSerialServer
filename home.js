// Home page specific code
let colorSet, testColors, numColorsInput, rgbInputs = [];
let colorPickers = [];
let submitButton;
let rgbInputContainer;  // Container to hold the RGB input fields
let colors = defaultColors.slice(); // clone the default colors
let testModeContainer, colorsContainer; // Containers for sections that should be conditionally visible

function setup() {
  // Initialize animation with default settings
  initAnimation(0.3, 60);

  // Create a div to hold everything and center it
  let container = createDiv();
  container.parent(select('main'));
  container.id('centered-content');
  container.style('margin-top', `${windowHeight * 0.1}px`);

  // Connect to device button
  let button = createButton("Select Device").parent(container);
  button.class('button-36');
  createElement('br').parent(container);
  createElement('br').parent(container);
  button.mousePressed(connectToSerialPort);

  // Boolean select (true/false) for Palette
  createSpan('Palette ').parent(container);
  let colorSetLabel = createSpan().parent(container);
  colorSetLabel.html('<label class="switch"><input type="checkbox" id="colorSetToggle"><span class="slider"></span></label>');
  colorSet = select('#colorSetToggle');
  colorSet.changed(() => {
    const isChecked = colorSet.elt.checked;
    colorSet.value(isChecked);
    updateVisibility(isChecked); // Pass the value directly to ensure it's updated immediately
    sendSerialData();
  });

  createElement('br').parent(container);
  createElement('br').parent(container);

  // Create containers for conditional sections
  testModeContainer = createDiv().parent(container);
  testModeContainer.id('testModeContainer');
  testModeContainer.style('display', 'none'); // Initially hidden
  
  // Test Mode toggle inside its container
  createSpan('TestMode ').parent(testModeContainer);
  let testColorsLabel = createSpan().parent(testModeContainer);
  testColorsLabel.html('<label class="switch"><input type="checkbox" id="testColorsToggle"><span class="slider"></span></label>');
  testColors = select('#testColorsToggle');
  testColors.changed(() => {
    testColors.value(testColors.elt.checked);
    sendSerialData();
  });
  
  createElement('br').parent(testModeContainer);
  createElement('br').parent(testModeContainer);

  // Colors section in its own container
  colorsContainer = createDiv().parent(container);
  colorsContainer.id('colorsContainer');
  colorsContainer.style('display', 'none'); // Initially hidden

  // Input for number of colors
  createSpan('Colors  ').parent(colorsContainer);
  numColorsInput = createSelect().parent(colorsContainer);
  for (let i = 1; i <= 10; i++) {
    numColorsInput.option(i);
  }
  numColorsInput.value('3'); // Set default value
  createElement('br').parent(colorsContainer);
  numColorsInput.changed(updateRGBInputs); // Dynamically add inputs for RGB colors
  createElement('br').parent(colorsContainer);

  // Create a container for RGB inputs
  rgbInputContainer = createDiv().parent(colorsContainer);
  
  // Initialize RGB inputs
  updateRGBInputs();
  
  // Set initial visibility based on palette toggle
  updateVisibility(colorSet.elt.checked);

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
}

// Function to update visibility based on the palette toggle
function updateVisibility(paletteOn) {
  // Use the passed parameter or check the actual value
  const isVisible = paletteOn !== undefined ? paletteOn : colorSet.value();
  
  console.log("Palette status:", isVisible);
  
  if (isVisible) {
    // Palette is ON, show test mode and colors
    testModeContainer.style('display', 'block');
    colorsContainer.style('display', 'block');
  } else {
    // Palette is OFF, hide test mode and colors
    testModeContainer.style('display', 'none');
    colorsContainer.style('display', 'none');
  }
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
    let colorPicker = createColorPicker(currentValues[i] ? `#${currentValues[i]}` : '#ffffff').parent(rgbInputContainerRow).style('margin-bottom', '10px'); // Default color
    rgbInputs.push(rgbInput);
    colorPickers.push(colorPicker);

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
  renderLamp(height/8, height/8, colors);
} 