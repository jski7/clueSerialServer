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
    // Use relative path - works from both /update/ and root
    let path = window.location.pathname;
    if (path.endsWith('/update/') || path.endsWith('/update')) {
      window.location.href = './lamp/';
    } else {
      window.location.href = './update/lamp/';
    }
  });
  
  // Create Charm button - styled like button-36 (purple)
  let charmButton = createButton('update charm');
  charmButton.parent(buttonContainer);
  charmButton.class('button-36');
  charmButton.style('width', '100%');
  charmButton.mousePressed(() => {
    // Use relative path - works from both /update/ and root
    let path = window.location.pathname;
    if (path.endsWith('/update/') || path.endsWith('/update')) {
      window.location.href = './charm/';
    } else {
      window.location.href = './update/charm/';
    }
  });
}

function draw() {
  // Render the lamp animation at the top - same as lamp/charm pages
  renderLamp(height/8, height/8, colors);
}
