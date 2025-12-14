// Lamp update page specific code
let colors = defaultColors.slice(); // Clone the default colors
let rgbInputContainer;  // Container to hold the RGB input fields

async function setup() {
  // Initialize animation with a higher frame rate
  initAnimation(0.3, 120);

  // Create a div to hold everything and center it
  let container = createDiv();
  container.parent(select('main'));
  container.id('centered-content'); // Assign an ID for styling
  container.style('margin-top', `${windowHeight * 0.1}px`); // Add margin of 20% of window height
  
  // Fetch version from manifest.json
  let manifestResponse = await fetch('../../firmware/lamp/manifest.json');
  let manifest = await manifestResponse.json();
  let version = manifest.version;
  
  // Add ESP Web Install Button with custom styling and dynamic version
  let installbutton = 
`<esp-web-install-button
  manifest="../../firmware/lamp/manifest.json">
  <button slot="activate" class="button-36">update lamp to v${version}</button>
</esp-web-install-button>`;
  
  let espWebInstallButton = createDiv().parent(container);
  espWebInstallButton.html(installbutton);
  espWebInstallButton.style('display', 'flex');
  espWebInstallButton.style('justify-content', 'center');

  // Create a container for RGB inputs
  rgbInputContainer = createDiv().parent(container);

  // Load firmware files
  const firmwareFiles = [
    { name: 'bootloader.bin', url: '../../firmware/lamp/bootloader.bin' },
    { name: 'partitions.bin', url: '../../firmware/lamp/partitions.bin' },
    { name: 'boot_app0.bin', url: '../../firmware/lamp/boot_app0.bin' },
    { name: 'firmware.bin', url: '../../firmware/lamp/firmware.bin' }
  ];
}

function draw() {
  // Render the lamp with higher resolution for the update page
  renderLamp(height/8, height/8, colors);
}
