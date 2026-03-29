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
let isRP2350Driver = false; // Track if rp2350 driver is detected
let readCommandInterval = null; // Track read command interval
let configReceived = false; // Track if config has been received
let colorOrderSelect; // Color order selection dropdown

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

  // Add logo at the top
  let logoContainer = createDiv().parent(container).style('display', 'flex').style('justify-content', 'center').style('margin-top', '10px').style('margin-bottom', '10px');
  let logo = createImg('logo.png').parent(logoContainer);
  logo.style('max-width', '120px').style('height', 'auto');
  
  // Add config label below logo
  let configContainer = createDiv().parent(container).style('display', 'flex').style('justify-content', 'center').style('margin-bottom', '20px');
  let configLabel = createSpan('config').parent(configContainer);
  configLabel.addClass('config-page-label');

  // Create a horizontal container for the connect button only
  let buttonContainer = createDiv().parent(container).style('display', 'flex').style('justify-content', 'center').style('gap', '10px').style('margin-bottom', '0px');
  window.buttonContainer = buttonContainer; // Store reference globally for access
  
  // Connect to device button
  let button = createButton("Select Device").parent(buttonContainer);
  button.class('button-36');
  button.id('connect-device-btn');
  button.mousePressed(connectToSerialPort);
  window.connectDeviceButton = button; // Store reference globally for access in connectToSerialPort
  
  // Add separator after connected button
  let connectedSeparator = createDiv().parent(container);
  connectedSeparator.class('section-divider');
  connectedSeparator.id('connectedSeparator');
  connectedSeparator.style('display', 'none'); // Initially hidden until connected

  // Create container for main controls (brightness, speed, palette)
  let mainControlsContainer = createDiv().parent(container);
  mainControlsContainer.id('mainControlsContainer');
  mainControlsContainer.style('display', 'none'); // Initially hidden until connected

  // Brightness slider
  let brightnessRow = createDiv().parent(mainControlsContainer).style('display', 'flex').style('flex-direction', 'row').style('align-items', 'center').style('justify-content', 'center').style('margin-bottom', '10px');
  let brightnessLabel = createSpan('Brightness').parent(brightnessRow).style('margin-right', '10px').style('min-width', '80px').style('text-align', 'right');
  let brightnessSlider = createSlider(0, 255, 128, 1).parent(brightnessRow).style('width', '150px').style('accent-color', '#6600ff').style('margin', '0 10px');
  let brightnessValue = createSpan('128').parent(brightnessRow).style('min-width', '32px').style('display', 'inline-block').style('text-align', 'left');
  brightnessSlider.input(function() {
    let val = brightnessSlider.value();
    brightnessValue.html(val);
    sendSerial('b', val);
  });

  // Speed slider
  let speedRow = createDiv().parent(mainControlsContainer).style('display', 'flex').style('flex-direction', 'row').style('align-items', 'center').style('justify-content', 'center').style('margin-bottom', '10px');
  let speedLabel = createSpan('Speed').parent(speedRow).style('margin-right', '10px').style('min-width', '80px').style('text-align', 'right');
  let speedSlider = createSlider(0, 255, 128, 1).parent(speedRow).style('width', '150px').style('accent-color', '#6600ff').style('margin', '0 10px');
  let speedValue = createSpan('128').parent(speedRow).style('min-width', '32px').style('display', 'inline-block').style('text-align', 'left');
  speedSlider.input(function() {
    let val = speedSlider.value();
    speedValue.html(val);
    sendSerial('s', val);
  });

  // Color Order selection
  let colorOrderRow = createDiv().parent(mainControlsContainer).style('display', 'flex').style('flex-direction', 'row').style('align-items', 'center').style('justify-content', 'center').style('margin-bottom', '10px');
  let colorOrderLabel = createSpan('Color Order').parent(colorOrderRow).style('margin-right', '10px').style('min-width', '80px').style('text-align', 'right');
  colorOrderSelect = createSelect().parent(colorOrderRow).style('width', '150px').style('margin', '0 10px');
  colorOrderSelect.option('RGB');
  colorOrderSelect.option('BGR');
  colorOrderSelect.option('GRB');
  colorOrderSelect.option('GBR');
  colorOrderSelect.option('BRG');
  colorOrderSelect.option('RBG');
  colorOrderSelect.value('RGB'); // Set default value
  colorOrderSelect.changed(() => {
    sendSerialData(); // Send updated colors with new order
  });
  
  // Add separator after speed slider
  let speedSeparator = createDiv().parent(mainControlsContainer);
  speedSeparator.class('section-divider');

  // Boolean select (true/false) for Palette
  createSpan('Palette ').parent(mainControlsContainer);
  let colorSetLabel = createSpan().parent(mainControlsContainer);
  colorSetLabel.html('<label class="switch"><input type="checkbox" id="colorSetToggle"><span class="slider"></span></label>');
  colorSet = select('#colorSetToggle');
  colorSet.changed(() => {
    const isChecked = colorSet.elt.checked;
    colorSet.value(isChecked);
    updateVisibility(isChecked); // Pass the value directly to ensure it's updated immediately
    sendSerialData();
  });

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
  
  // Add separator after test mode
  let testModeSeparator = createDiv().parent(testModeContainer);
  testModeSeparator.class('section-divider');

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

  // Create save button container at the bottom
  let saveButtonContainer = createDiv().parent(container).style('display', 'flex').style('justify-content', 'center').style('margin-top', '5px');
  
  // Save button
  let saveButton = createButton('Save').parent(saveButtonContainer);
  saveButton.class('button-36');
  saveButton.style('display', 'none'); // Initially hidden until rp2350 driver is detected
  saveButton.mousePressed(() => {
    sendSerial('w');
  });
  window.saveButton = saveButton; // Store reference globally for access

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
  window.colorOrderSelect = colorOrderSelect;
  
  // Ensure save button starts hidden
  updateSaveButtonVisibility();
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

// Function to update save button visibility based on rp2350 driver detection
function updateSaveButtonVisibility() {
  if (window.saveButton) {
    if (isRP2350Driver) {
      window.saveButton.style('display', 'block');
      console.log('Save button shown - RP2350 driver detected');
    } else {
      window.saveButton.style('display', 'none');
      console.log('Save button hidden - RP2350 driver not detected');
    }
  }
}

// Function to start sending read commands every second
function startReadCommandLoop() {
  if (readCommandInterval) {
    clearInterval(readCommandInterval);
  }
  
  readCommandInterval = setInterval(() => {
    if (writer && serialConnected && !configReceived) {
      const encoder = new TextEncoder();
      const encodedData = encoder.encode('read\n');
      writer.write(encodedData).then(() => {
        console.log('Sent: read (waiting for config)');
      }).catch(err => {
        console.error('Error sending read command:', err);
      });
    } else if (configReceived) {
      // Stop sending read commands once config is received
      clearInterval(readCommandInterval);
      readCommandInterval = null;
      console.log('Config received, stopping read command loop');
    }
  }, 1000);
}

// Function to complete connection process
function completeConnection() {
  // Update button to connected state
  if (window.connectDeviceButton) {
    window.connectDeviceButton.html('Connected');
    window.connectDeviceButton.removeClass('button-loading');
    window.connectDeviceButton.addClass('button-connected');
  }
  
  // Set bottom margin of button container back to 20px when connected
  if (window.buttonContainer) {
    window.buttonContainer.style('margin-bottom', '20px');
  }
  
  // Show separator when connected
  const connectedSeparator = select('#connectedSeparator');
  if (connectedSeparator) {
    connectedSeparator.style('display', 'block');
  }
  
  // Show main controls when connected
  const mainControlsContainer = select('#mainControlsContainer');
  if (mainControlsContainer) {
    mainControlsContainer.style('display', 'block');
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

// Function to convert RGB hex to different color orders
function convertColorOrder(hexColor, order) {
  if (hexColor.length !== 6) return hexColor; // Return as-is if not valid hex
  
  let r = hexColor.substring(0, 2);
  let g = hexColor.substring(2, 4);
  let b = hexColor.substring(4, 6);
  
  switch (order) {
    case 'RGB': return r + g + b;
    case 'BGR': return b + g + r;
    case 'GRB': return g + r + b;
    case 'GBR': return g + b + r;
    case 'BRG': return b + r + g;
    case 'RBG': return r + b + g;
    default: return hexColor;
  }
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

  // Get the RGB values and convert them according to selected color order
  let rgbValues = [];
  let colorOrder = colorOrderSelect ? colorOrderSelect.value() : 'RGB';
  
  for (let i = 0; i < rgbInputs.length; i++) {
    let colorHex = rgbInputs[i].value();
    let convertedColor = convertColorOrder(colorHex.toUpperCase(), colorOrder);
    rgbValues.push(convertedColor);
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
  console.log("Color order used:", colorOrder);
  
  // Update the colors array with the new RGB values (keep original RGB for display)
  if (rgbInputs.length > 0) {
    colors.length = 0; // Clear the existing colors array
    for (let i = 0; i < rgbInputs.length; i++) {
      let hex = rgbInputs[i].value(); // Use original RGB for display
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

function sendSerial(prefix, value) {
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
    
    // Reset driver detection for new connection
    isRP2350Driver = false;
    configReceived = false;
    updateSaveButtonVisibility();
    
    // Show loading state
    if (window.connectDeviceButton) {
      window.connectDeviceButton.html('<span class="loading-spinner"></span>Connecting...');
      window.connectDeviceButton.removeClass('button-36');
      window.connectDeviceButton.removeClass('button-connected');
      window.connectDeviceButton.addClass('button-loading');
      window.connectDeviceButton.attribute('disabled', '');
    }
    
    // Hide separator during connecting state
    const connectedSeparator = select('#connectedSeparator');
    if (connectedSeparator) {
      connectedSeparator.style('display', 'none');
    }
    
    // Start reading serial data immediately
    readSerialLoop();
    
    // Start sending read commands every second until config is received
    startReadCommandLoop();
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
    
    // Hide main controls when disconnected
    const mainControlsContainer = select('#mainControlsContainer');
    if (mainControlsContainer) {
      mainControlsContainer.style('display', 'none');
    }
    
    // Hide separator when disconnected
    const connectedSeparator = select('#connectedSeparator');
    if (connectedSeparator) {
      connectedSeparator.style('display', 'none');
    }
    
    // Clear read command interval
    if (readCommandInterval) {
      clearInterval(readCommandInterval);
      readCommandInterval = null;
    }
    
    // Hide save button when disconnected
    if (window.saveButton) {
      window.saveButton.style('display', 'none');
    }
    
    // Set bottom margin of button container back to 0px when disconnected
    if (window.buttonContainer) {
      window.buttonContainer.style('margin-bottom', '0px');
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
    
    // Reset driver detection for new connection
    isRP2350Driver = false;
    configReceived = false;
    updateSaveButtonVisibility();
    
    // Show loading state
    if (window.connectDeviceButton) {
      window.connectDeviceButton.html('<span class="loading-spinner"></span>Connecting...');
      window.connectDeviceButton.removeClass('button-36');
      window.connectDeviceButton.removeClass('button-connected');
      window.connectDeviceButton.addClass('button-loading');
      window.connectDeviceButton.attribute('disabled', '');
    }
    
    // Hide separator during connecting state
    const connectedSeparator = select('#connectedSeparator');
    if (connectedSeparator) {
      connectedSeparator.style('display', 'none');
    }
    
    // Start reading serial data immediately
    readSerialLoop();
    
    // Start sending read commands every second until config is received
    startReadCommandLoop();
    
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
    
    // Hide main controls when disconnected
    const mainControlsContainer = select('#mainControlsContainer');
    if (mainControlsContainer) {
      mainControlsContainer.style('display', 'none');
    }
    
    // Hide separator when disconnected
    const connectedSeparator = select('#connectedSeparator');
    if (connectedSeparator) {
      connectedSeparator.style('display', 'none');
    }
    
    // Clear read command interval
    if (readCommandInterval) {
      clearInterval(readCommandInterval);
      readCommandInterval = null;
    }
    
    // Hide save button when disconnected
    if (window.saveButton) {
      window.saveButton.style('display', 'none');
    }
    
    // Set bottom margin of button container back to 0px when disconnected
    if (window.buttonContainer) {
      window.buttonContainer.style('margin-bottom', '0px');
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
  let driverDetected = false;
  
  for (let line of lines) {
    if (line.startsWith('Driver:')) {
      const driver = line.split(':')[1].trim();
      if (driver === 'rp2350') {
        isRP2350Driver = true;
        driverDetected = true;
        console.log('RP2350 driver detected!');
      }
    }
    else if (line.startsWith('Palette:')) palette = line.split(':')[1].trim() === 'true';
    else if (line.startsWith('Test:')) test = line.split(':')[1].trim() === 'true';
    else if (line.startsWith('Brightness:')) brightness = parseInt(line.split(':')[1].trim());
    else if (line.startsWith('Speed:')) speed = parseInt(line.split(':')[1].trim());
    else if (line.startsWith('Number of Colors:')) numColors = parseInt(line.split(':')[1].trim());
    else if (line.startsWith('RGB Colors:')) rgbSection = true;
    else if (rgbSection && line.match(/^([0-9A-Fa-f]{1,6}|0)$/)) {
      rgbColors.push(line.trim().padStart(6, '0').toUpperCase());
    }
  }
  
  // Update save button visibility based on driver detection
  updateSaveButtonVisibility();
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
    
    // Mark config as received and complete connection
    if (!configReceived) {
      configReceived = true;
      completeConnection();
    }
  }, 100); // Wait for DOM update
} 