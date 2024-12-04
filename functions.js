function randomElement(array) {
    return array[Math.floor(Math.random() * array.length)]
}

function randomColor(set = colors) {
    return randomElement(set);
}

function chance(c) {
    return random() < c
  }


  