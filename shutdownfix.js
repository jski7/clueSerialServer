// Shutdown fix page: same serial connect flow as home; single fix action, no config UI.
let serialAutoConnectInterval = null;
let serialConnected = false;
let colors = defaultColors.slice();

function setup() {
  initAnimation(0.3, 60);

  if ('serial' in navigator) {
    function tryAutoConnect() {
      if (!serialConnected) {
        navigator.serial.getPorts().then((ports) => {
          if (ports.length > 0) {
            autoConnectToSerialPort(ports[0]);
          }
        });
      }
    }
    tryAutoConnect();
    serialAutoConnectInterval = setInterval(tryAutoConnect, 1000);
  }

  let container = createDiv();
  container.parent(select('main'));
  container.id('centered-content');

  let logoContainer = createDiv()
    .parent(container)
    .style('display', 'flex')
    .style('justify-content', 'center')
    .style('margin-top', '10px')
    .style('margin-bottom', '10px');
  let logo = createImg('../logo.png').parent(logoContainer);
  logo.style('max-width', '120px').style('height', 'auto');

  let titleContainer = createDiv()
    .parent(container)
    .style('display', 'flex')
    .style('justify-content', 'center')
    .style('margin-bottom', '20px');
  let titleLabel = createSpan('shutdown fix').parent(titleContainer);
  titleLabel.addClass('config-page-label');

  let buttonContainer = createDiv()
    .parent(container)
    .style('display', 'flex')
    .style('justify-content', 'center')
    .style('gap', '10px')
    .style('margin-bottom', '0px');
  window.buttonContainer = buttonContainer;

  let connectButton = createButton('Select Device').parent(buttonContainer);
  connectButton.class('button-36');
  connectButton.id('connect-device-btn');
  connectButton.mousePressed(connectToSerialPort);
  window.connectDeviceButton = connectButton;

  let connectedSeparator = createDiv().parent(container);
  connectedSeparator.class('section-divider');
  connectedSeparator.id('connectedSeparator');
  connectedSeparator.style('display', 'none');

  let actionContainer = createDiv().parent(container);
  actionContainer.id('shutdownFixActions');
  actionContainer.style('display', 'none');
  actionContainer.style('justify-content', 'center');
  actionContainer.style('margin-top', '10px');

  let fixButton = createButton('Auto shutdown off fix').parent(actionContainer);
  fixButton.class('button-36');
  fixButton.id('shutdown-fix-btn');
  fixButton.mousePressed(sendButtonOffFiveTimes);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'h') {
      if (container.style('display') === 'none') {
        container.style('display', 'block');
        resizeCanvas(windowHeight * 0.3, windowHeight * 0.3);
      } else {
        container.style('display', 'none');
        resizeCanvas(windowHeight * 0.8, windowHeight * 0.8);
      }
    }
  });
}

function draw() {
  renderLamp(height / 8, height / 8, colors);
}

function completeConnection() {
  if (window.connectDeviceButton) {
    window.connectDeviceButton.html('Connected');
    window.connectDeviceButton.removeClass('button-loading');
    window.connectDeviceButton.addClass('button-connected');
  }
  if (window.buttonContainer) {
    window.buttonContainer.style('margin-bottom', '20px');
  }
  const connectedSeparator = select('#connectedSeparator');
  if (connectedSeparator) {
    connectedSeparator.style('display', 'block');
  }
  const actions = select('#shutdownFixActions');
  if (actions) {
    actions.style('display', 'flex');
  }
}

function resetDisconnectedUI() {
  serialConnected = false;
  if (window.connectDeviceButton) {
    window.connectDeviceButton.html('Select Device');
    window.connectDeviceButton.removeClass('button-connected');
    window.connectDeviceButton.addClass('button-36');
    window.connectDeviceButton.removeAttribute('disabled');
  }
  const connectedSeparator = select('#connectedSeparator');
  if (connectedSeparator) {
    connectedSeparator.style('display', 'none');
  }
  const actions = select('#shutdownFixActions');
  if (actions) {
    actions.style('display', 'none');
  }
  if (window.buttonContainer) {
    window.buttonContainer.style('margin-bottom', '0px');
  }
}

function restartAutoConnectIfNeeded() {
  if (!serialConnected && !serialAutoConnectInterval && 'serial' in navigator) {
    function tryAutoConnect() {
      if (!serialConnected) {
        navigator.serial.getPorts().then((ports) => {
          if (ports.length > 0) {
            autoConnectToSerialPort(ports[0]);
          }
        });
      }
    }
    serialAutoConnectInterval = setInterval(tryAutoConnect, 1000);
  }
}

async function sendButtonOffFiveTimes() {
  if (!writer || !serialConnected) {
    console.warn('No port connected!');
    return;
  }
  const encoder = new TextEncoder();
  const line = 'buttonoff\n';
  for (let i = 0; i < 5; i++) {
    try {
      await writer.write(encoder.encode(line));
      console.log(`Sent buttonoff (${i + 1}/5)`);
    } catch (err) {
      console.error('Error sending buttonoff:', err);
      break;
    }
  }
}

async function readSerialLoop() {
  try {
    while (serialConnected && reader) {
      const { value, done } = await reader.read();
      if (done) {
        reader.releaseLock();
        break;
      }
      if (value) {
        // Drain incoming data; no config handshake on this page.
      }
    }
  } catch (err) {
    console.error('Error reading serial:', err);
    resetDisconnectedUI();
    restartAutoConnectIfNeeded();
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

    if (window.connectDeviceButton) {
      window.connectDeviceButton.html('<span class="loading-spinner"></span>Connecting...');
      window.connectDeviceButton.removeClass('button-36');
      window.connectDeviceButton.removeClass('button-connected');
      window.connectDeviceButton.addClass('button-loading');
      window.connectDeviceButton.attribute('disabled', '');
    }

    const connectedSeparator = select('#connectedSeparator');
    if (connectedSeparator) {
      connectedSeparator.style('display', 'none');
    }
    const actions = select('#shutdownFixActions');
    if (actions) {
      actions.style('display', 'none');
    }

    readSerialLoop();
    completeConnection();
  } catch (error) {
    console.error('Error connecting to serial port: ', error);
    serialConnected = false;
    resetDisconnectedUI();
    restartAutoConnectIfNeeded();
  }
}

async function autoConnectToSerialPort(serialPort) {
  try {
    await serialPort.open({ baudRate: 115200 });
    writer = serialPort.writable.getWriter();
    reader = serialPort.readable.getReader();
    port = serialPort;
    serialConnected = true;
    if (serialAutoConnectInterval) {
      clearInterval(serialAutoConnectInterval);
      serialAutoConnectInterval = null;
    }

    if (window.connectDeviceButton) {
      window.connectDeviceButton.html('<span class="loading-spinner"></span>Connecting...');
      window.connectDeviceButton.removeClass('button-36');
      window.connectDeviceButton.removeClass('button-connected');
      window.connectDeviceButton.addClass('button-loading');
      window.connectDeviceButton.attribute('disabled', '');
    }

    const connectedSeparator = select('#connectedSeparator');
    if (connectedSeparator) {
      connectedSeparator.style('display', 'none');
    }
    const actions = select('#shutdownFixActions');
    if (actions) {
      actions.style('display', 'none');
    }

    readSerialLoop();
    completeConnection();
    console.log('Auto-connected to serial port!');
  } catch (err) {
    console.error('Auto-connect failed:', err);
  }
}
