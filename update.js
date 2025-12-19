// Update page specific code - selection page
let colors = defaultColors.slice(); // Clone the default colors

function setup() {
  // Initialize animation with a higher frame rate
  initAnimation(0.3, 120);

  // Create a div to hold everything - positioned at bottom like lamp/charm pages
  let container = createDiv();
  container.parent(select('main'));
  container.id('centered-content'); // Assign an ID for styling (white box)
  container.style('position', 'fixed');
  container.style('bottom', '40px');
  container.style('left', '50%');
  container.style('transform', 'translateX(-50%)');
  container.style('z-index', '10');
  
  // Create button container
  let buttonContainer = createDiv();
  buttonContainer.parent(container);
  buttonContainer.style('display', 'flex');
  buttonContainer.style('flex-direction', 'column');
  buttonContainer.style('gap', '15px');
  buttonContainer.style('align-items', 'center');
  buttonContainer.style('padding', '10px 0');
  
  // Create Lamp button - styled like button-36 (purple)
  let lampButton = createButton('update lamp');
  lampButton.parent(buttonContainer);
  lampButton.class('button-36');
  lampButton.style('width', '100%');
  lampButton.mousePressed(() => {
    // Get base path (everything up to and including the last slash)
    // For /clueSerialServer/update.html, basePath will be /clueSerialServer/
    let pathname = window.location.pathname;
    let basePath = pathname.substring(0, pathname.lastIndexOf('/') + 1);
    // Always navigate to update/lamp/ from update.html
    window.location.href = basePath + 'update/lamp/';
  });
  
  // Create Charm button - styled like button-36 (purple)
  let charmButton = createButton('update charm');
  charmButton.parent(buttonContainer);
  charmButton.class('button-36');
  charmButton.style('width', '100%');
  charmButton.mousePressed(() => {
    // Get base path (everything up to and including the last slash)
    // For /clueSerialServer/update.html, basePath will be /clueSerialServer/
    let pathname = window.location.pathname;
    let basePath = pathname.substring(0, pathname.lastIndexOf('/') + 1);
    // Always navigate to update/charm/ from update.html
    window.location.href = basePath + 'update/charm/';
  });
}

function draw() {
  // Render the lamp animation at the top - same as lamp/charm pages
  renderLamp(height/8, height/8, colors);
}
