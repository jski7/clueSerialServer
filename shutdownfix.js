// Shutdown fix page: same serial connect flow as home; single fix action, no config UI.
let serialAutoConnectInterval = null;
let serialConnected = false;
let serialConnecting = false;
let colors = defaultColors.slice();

const SERIAL_PORT_FILTERS = [
  { usbVendorId: 0x2e8a }, // Raspberry Pi (Pico / RP2040 / RP2350 CDC)
  { usbVendorId: 0x303a }, // Espressif
  { usbVendorId: 0x10c4 }, // Silicon Labs CP210x
  { usbVendorId: 0x1a86 }, // WCH CH340
  { usbVendorId: 0x0403 }, // FTDI
];

function getPortUsbVendorId(serialPort) {
  try {
    const info = serialPort.getInfo ? serialPort.getInfo() : {};
    return info.usbVendorId;
  } catch (_) {
    return undefined;
  }
}

function isPicoSerialPort(serialPort) {
  return getPortUsbVendorId(serialPort) === 0x2e8a;
}

function isKnownClueSerialPort(serialPort) {
  const vid = getPortUsbVendorId(serialPort);
  if (vid == null) return true;
  return SERIAL_PORT_FILTERS.some((f) => f.usbVendorId === vid);
}

function pickAutoConnectPort(ports) {
  if (!ports || !ports.length) return null;
  const pico = ports.find(isPicoSerialPort);
  if (pico) return pico;
  const known = ports.find(isKnownClueSerialPort);
  if (known) return known;
  return ports[0];
}

function startSerialAutoConnectPolling() {
  if (!('serial' in navigator) || serialAutoConnectInterval) return;

  function tryAutoConnect() {
    if (serialConnected || serialConnecting) return;
    navigator.serial.getPorts().then((ports) => {
      const chosen = pickAutoConnectPort(ports);
      if (chosen) autoConnectToSerialPort(chosen);
    }).catch((err) => {
      console.warn('Serial port poll failed:', err);
    });
  }

  tryAutoConnect();
  serialAutoConnectInterval = setInterval(tryAutoConnect, 1000);

  if (!navigator.serial._clueConnectListenerAttached) {
    navigator.serial.addEventListener('connect', (event) => {
      if (serialConnected || serialConnecting) return;
      const port = event.target;
      if (port && (isPicoSerialPort(port) || isKnownClueSerialPort(port))) {
        autoConnectToSerialPort(port);
      } else {
        tryAutoConnect();
      }
    });
    navigator.serial._clueConnectListenerAttached = true;
  }
}

function setup() {
  initAnimation(0.3, 60);

  startSerialAutoConnectPolling();

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
  connectButton.mousePressed(openConnectFlow);
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
  startSerialAutoConnectPolling();
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

function openConnectFlow() {
  if (serialConnected || serialConnecting) return;
  if (typeof openSerialConnectModal === 'function') {
    openSerialConnectModal(connectToSerialPort);
  } else {
    connectToSerialPort();
  }
}

async function connectToSerialPort() {
  try {
    port = await navigator.serial.requestPort({ filters: SERIAL_PORT_FILTERS });
    await port.open({ baudRate: 115200 });
    writer = port.writable.getWriter();
    reader = port.readable.getReader();
    serialConnected = true;
    serialConnecting = false;
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
    serialConnecting = false;
    resetDisconnectedUI();
    restartAutoConnectIfNeeded();
  }
}

async function autoConnectToSerialPort(serialPort) {
  if (serialConnected || serialConnecting) return;
  serialConnecting = true;
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
  } finally {
    serialConnecting = false;
  }
}
