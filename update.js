// Update page specific code
let colors = defaultColors.slice(); // Clone the default colors
let rgbInputContainer;  // Container to hold the RGB input fields

function setup() {
  // Initialize animation with a higher frame rate
  initAnimation(0.3, 120);

  // Create a div to hold everything and center it
  let container = createDiv();
  container.parent(select('main'));
  container.id('centered-content'); // Assign an ID for styling
  container.style('margin-top', `${windowHeight * 0.1}px`); // Add margin of 20% of window height
  
  // Add ESP Web Install Button with custom styling
  let installbutton = 
`<esp-web-install-button
  manifest="./firmware/manifest.json">
  <button slot="activate" class="button-36">update</button>
</esp-web-install-button>`;
  
  let espWebInstallButton = createDiv().parent(container);
  espWebInstallButton.html(installbutton);
  espWebInstallButton.style('display', 'flex');
  espWebInstallButton.style('justify-content', 'center');

  // Create a container for RGB inputs
  rgbInputContainer = createDiv().parent(container);

  // Load firmware files
  const firmwareFiles = [
    { name: 'bootloader.bin', url: '/firmware/bootloader.bin' },
    { name: 'partitions.bin', url: '/firmware/partitions.bin' },
    { name: 'boot_app0.bin', url: '/firmware/boot_app0.bin' },
    { name: 'firmware.bin', url: '/firmware/firmware.bin' }
  ];
}

function draw() {
  // Render the lamp with higher resolution for the update page
  renderLamp(128, 128, colors);
} 