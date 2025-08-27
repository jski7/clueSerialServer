// Home page specific code
let colorSet, testColors, numColorsInput, rgbInputs = [];
let colorPickers = [];
let submitButton;
let rgbInputContainer;  // Container to hold the RGB input fields
let colors = defaultColors.slice(); // clone the default colors
let testModeContainer, colorsContainer; // Containers for sections that should be conditionally visible
let serialAutoConnectInterval = null;
let serialConnected = false;
let serialBuffer = '';
let isConfigLoading = false;

function setup() {
  // Initialize animation with default settings
  initAnimation(0.3, 60);

  // Auto-connect to serial if possible, and set up periodic check
  if ('serial' in navigator) {
    function tryAutoConnect() {
      if (!serialConnected) {
        navigator.serial.getPorts().then(ports => {
          if (ports.length > 0) {
            autoConnectToSerialPort(ports[0]);
          }
        });
      }
    }
    tryAutoConnect(); // Initial check
    serialAutoConnectInterval = setInterval(tryAutoConnect, 1000); // Check every 2 seconds
  }

  // Create a div to hold everything and center it
  let container = createDiv();
  container.parent(select('main'));
  container.id('centered-content');
  container.style('margin-top', `${windowHeight * 0.1}px`);

  // Create a horizontal container for the buttons
  let buttonContainer = createDiv().parent(container).style('display', 'flex').style('justify-content', 'center').style('gap', '10px').style('margin-bottom', '20px');
  
  // Connect to device button
  let button = createButton("Select Device").parent(buttonContainer);
  button.class('button-36');
  button.id('connect-device-btn');
  button.mousePressed(connectToSerialPort);
  window.connectDeviceButton = button; // Store reference globally for access in connectToSerialPort
  
  // Save button
  let saveButton = createButton('Save').parent(buttonContainer);
  saveButton.class('button-36');
  saveButton.mousePressed(() => {
    sendSingleSerialCommand('w');
  });

  // Brightness slider
  let brightnessRow = createDiv().parent(container).style('display', 'flex').style('flex-direction', 'row').style('align-items', 'center').style('justify-content', 'center').style('margin-bottom', '10px');
  let brightnessLabel = createSpan('Brightness').parent(brightnessRow).style('margin-right', '10px').style('min-width', '80px').style('text-align', 'right');
  let brightnessSlider = createSlider(0, 255, 128, 1).parent(brightnessRow).style('width', '150px').style('accent-color', '#673FD7').style('margin', '0 10px');
  let brightnessValue = createSpan('128').parent(brightnessRow).style('min-width', '32px').style('display', 'inline-block').style('text-align', 'left');
  brightnessSlider.input(function() {
    let val = brightnessSlider.value();
    brightnessValue.html(val);
    sendSingleSerialCommand('b', val);
  });

  // Speed slider
  let speedRow = createDiv().parent(container).style('display', 'flex').style('flex-direction', 'row').style('align-items', 'center').style('justify-content', 'center').style('margin-bottom', '10px');
  let speedLabel = createSpan('Speed').parent(speedRow).style('margin-right', '10px').style('min-width', '80px').style('text-align', 'right');
  let speedSlider = createSlider(0, 255, 128, 1).parent(speedRow).style('width', '150px').style('accent-color', '#673FD7').style('margin', '0 10px');
  let speedValue = createSpan('128').parent(speedRow).style('min-width', '32px').style('display', 'inline-block').style('text-align', 'left');
  speedSlider.input(function() {
    let val = speedSlider.value();
    speedValue.html(val);
    sendSingleSerialCommand('s', val);
  });

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

  // Store references for UI elements in setup()
  window.colorSet = colorSet;
  window.testColors = testColors;
  window.numColorsInput = numColorsInput;
  window.rgbInputs = rgbInputs;
  window.colorPickers = colorPickers;
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

    // Set up color picker event listener - only send on change (mouse release), not while dragging
    colorPicker.changed(function() {
      // When the color is picked and mouse is released, update the corresponding text input field with the hex value
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
  if (isConfigLoading) {
    console.warn('Config is loading, not sending new data yet.');
    return;
  }
  // Use .elt.checked for checkboxes
  let colorSetBool = colorSet && colorSet.elt ? colorSet.elt.checked : false;
  let testModeBool = testColors && testColors.elt ? testColors.elt.checked : false;

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

function sendSingleSerialCommand(prefix, value) {
  if (writer) {
    const textToSend = value !== undefined ? `${prefix}${value}` : prefix;
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(textToSend + "\n");
    writer.write(encodedData).then(() => {
      console.log(`Data sent: ${textToSend}`);
    }).catch(err => {
      console.error("Error sending data: ", err);
    });
  } else {
    console.warn("No port connected!");
  }
}

async function connectToSerialPort() {
  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });
    writer = port.writable.getWriter();
    reader = port.readable.getReader();
    serialConnected = true;
    if (serialAutoConnectInterval) {
      clearInterval(serialAutoConnectInterval);
      serialAutoConnectInterval = null;
    }
    console.log("Connected to port!");
    
    // Show loading state
    if (window.connectDeviceButton) {
      window.connectDeviceButton.html('<span class="loading-spinner"></span>Connecting...');
      window.connectDeviceButton.removeClass('button-36');
      window.connectDeviceButton.removeClass('button-connected');
      window.connectDeviceButton.addClass('button-loading');
      window.connectDeviceButton.attribute('disabled', '');
    }
    
    // Start reading serial data immediately
    readSerialLoop();
    
    // Send 'read' command after 3 seconds
    setTimeout(() => {
      if (writer && serialConnected) {
        const encoder = new TextEncoder();
        const encodedData = encoder.encode('read\n');
        writer.write(encodedData).then(() => {
          console.log('Sent: read');
        }).catch(err => {
          console.error('Error sending read command:', err);
        });
      }
      
      // Update button to connected state
      if (window.connectDeviceButton) {
        window.connectDeviceButton.html('Connected');
        window.connectDeviceButton.removeClass('button-loading');
        window.connectDeviceButton.addClass('button-connected');
      }
    }, 3000);
  } catch (error) {
    console.error("Error connecting to serial port: ", error);
    // On error, update UI to disconnected state
    serialConnected = false;
    if (window.connectDeviceButton) {
      window.connectDeviceButton.html('Select Device');
      window.connectDeviceButton.removeClass('button-connected');
      window.connectDeviceButton.addClass('button-36');
      window.connectDeviceButton.removeAttribute('disabled');
    }
    // Restart periodic auto-connect
    if (!serialConnected && !serialAutoConnectInterval && 'serial' in navigator) {
      function tryAutoConnect() {
        if (!serialConnected) {
          navigator.serial.getPorts().then(ports => {
            if (ports.length > 0) {
              autoConnectToSerialPort(ports[0]);
            }
          });
        }
      }
      serialAutoConnectInterval = setInterval(tryAutoConnect, 1000);
    }
  }
}

async function autoConnectToSerialPort(port) {
  try {
    await port.open({ baudRate: 115200 });
    writer = port.writable.getWriter();
    reader = port.readable.getReader();
    serialConnected = true;
    if (serialAutoConnectInterval) {
      clearInterval(serialAutoConnectInterval);
      serialAutoConnectInterval = null;
    }
    
    // Show loading state
    if (window.connectDeviceButton) {
      window.connectDeviceButton.html('<span class="loading-spinner"></span>Connecting...');
      window.connectDeviceButton.removeClass('button-36');
      window.connectDeviceButton.removeClass('button-connected');
      window.connectDeviceButton.addClass('button-loading');
      window.connectDeviceButton.attribute('disabled', '');
    }
    
    // Start reading serial data immediately
    readSerialLoop();
    
    // Send 'read' command after 3 seconds
    setTimeout(() => {
      if (writer && serialConnected) {
        const encoder = new TextEncoder();
        const encodedData = encoder.encode('read\n');
        writer.write(encodedData).then(() => {
          console.log('Sent: read');
        }).catch(err => {
          console.error('Error sending read command:', err);
        });
      }
      
      // Update button to connected state
      if (window.connectDeviceButton) {
        window.connectDeviceButton.html('Connected');
        window.connectDeviceButton.removeClass('button-loading');
        window.connectDeviceButton.addClass('button-connected');
      }
    }, 3000);
    
    console.log('Auto-connected to serial port!');
  } catch (err) {
    console.error('Auto-connect failed:', err);
  }
}

// Serial reading loop
async function readSerialLoop() {
  try {
    while (serialConnected && reader) {
      const { value, done } = await reader.read();
      if (done) {
        reader.releaseLock();
        break;
      }
      if (value) {
        const text = new TextDecoder().decode(value);
        console.log('Serial received:', text); // DEBUG
        serialBuffer += text;
        // Check for config block
        if (serialBuffer.includes('*** CURRENT CONFIG ***')) {
          // Find the start of the config
          const configStart = serialBuffer.indexOf('*** CURRENT CONFIG ***');
          // Find the end: two consecutive newlines after RGB colors
          // Accept both \n\n and \r\n\r\n
          // Find the first blank line after RGB Colors:
          const rgbIndex = serialBuffer.indexOf('RGB Colors:', configStart);
          if (rgbIndex !== -1) {
            // Look for two consecutive newlines after RGB Colors:
            let configEnd = serialBuffer.indexOf('\n\n', rgbIndex);
            if (configEnd === -1) configEnd = serialBuffer.indexOf('\r\n\r\n', rgbIndex);
            if (configEnd !== -1) {
              const configBlock = serialBuffer.substring(configStart, configEnd).trim();
              parseAndApplyConfig(configBlock);
              serialBuffer = serialBuffer.substring(configEnd + 2); // Remove parsed part
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Error reading serial:', err);
    // On error, update UI to disconnected state
    serialConnected = false;
    if (window.connectDeviceButton) {
      window.connectDeviceButton.html('Select Device');
      window.connectDeviceButton.removeClass('button-connected');
      window.connectDeviceButton.addClass('button-36');
      window.connectDeviceButton.removeAttribute('disabled');
    }
    // Restart periodic auto-connect
    if (!serialConnected && !serialAutoConnectInterval && 'serial' in navigator) {
      function tryAutoConnect() {
        if (!serialConnected) {
          navigator.serial.getPorts().then(ports => {
            if (ports.length > 0) {
              autoConnectToSerialPort(ports[0]);
            }
          });
        }
      }
      serialAutoConnectInterval = setInterval(tryAutoConnect, 1000);
    }
  }
}

// Parse config and update UI
function parseAndApplyConfig(configText) {
  isConfigLoading = true;
  console.log('Parsing config:', configText); // DEBUG
  const lines = configText.split(/\r?\n/);
  let palette = false, test = false, brightness = 128, speed = 128, numColors = 3, rgbColors = [];
  let rgbSection = false;
  for (let line of lines) {
    if (line.startsWith('Palette:')) palette = line.split(':')[1].trim() === 'true';
    else if (line.startsWith('Test:')) test = line.split(':')[1].trim() === 'true';
    else if (line.startsWith('Brightness:')) brightness = parseInt(line.split(':')[1].trim());
    else if (line.startsWith('Speed:')) speed = parseInt(line.split(':')[1].trim());
    else if (line.startsWith('Number of Colors:')) numColors = parseInt(line.split(':')[1].trim());
    else if (line.startsWith('RGB Colors:')) rgbSection = true;
    else if (rgbSection && line.match(/^([0-9A-Fa-f]{1,6}|0)$/)) {
      rgbColors.push(line.trim().padStart(6, '0').toUpperCase());
    }
  }
  // Log parsed values as requested
  console.log('PARSED_PALETTE_VALUE:', palette);
  console.log('PARSED_TEST_VALUE:', test);
  console.log('PARSED_NUM_COLORS:', numColors);
  console.log('PARSED_COLORS:', rgbColors.join(','));
  // Update UI
  if (window.colorSet) {
    window.colorSet.elt.checked = palette;
    console.log('Set Palette:', palette); // DEBUG
  }
  if (window.testColors) {
    window.testColors.elt.checked = test;
    console.log('Set Test:', test); // DEBUG
  }
  // Update sliders
  const sliders = document.querySelectorAll('input[type="range"]');
  if (sliders.length >= 2) {
    sliders[0].value = brightness;
    sliders[0].dispatchEvent(new Event('input'));
    console.log('Set Brightness:', brightness); // DEBUG
    sliders[1].value = speed;
    sliders[1].dispatchEvent(new Event('input'));
    console.log('Set Speed:', speed); // DEBUG
  }
  // Update number of colors
  if (window.numColorsInput) {
    window.numColorsInput.value(numColors);
    window.numColorsInput.elt.value = numColors;
    window.numColorsInput.elt.dispatchEvent(new Event('change'));
    console.log('Set Number of Colors:', numColors); // DEBUG
  }
  // Update RGB inputs
  setTimeout(() => {
    // Re-query the DOM for the latest rgbInputs and colorPickers
    const rgbInputFields = document.querySelectorAll('input[type="text"]');
    const colorPickerFields = document.querySelectorAll('input[type="color"]');
    window.rgbInputs = Array.from(rgbInputFields).map(el => ({ value: v => el.value = v, elt: el }));
    window.colorPickers = Array.from(colorPickerFields).map(el => ({ value: v => el.value = v, elt: el }));
    if (window.rgbInputs && rgbColors.length > 0 && window.colorPickers) {
      for (let i = 0; i < rgbColors.length && i < window.rgbInputs.length && i < window.colorPickers.length; i++) {
        window.rgbInputs[i].value(rgbColors[i]);
        window.rgbInputs[i].elt.value = rgbColors[i];
        window.colorPickers[i].value('#' + rgbColors[i]);
        window.colorPickers[i].elt.value = '#' + rgbColors[i];
        console.log(`Set RGB[${i}]:`, rgbColors[i]); // DEBUG
      }
    }
    updateVisibility(palette); // Ensure UI reflects palette state
    isConfigLoading = false;
  }, 100); // Wait for DOM update
} 