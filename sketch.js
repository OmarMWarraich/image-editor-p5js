let img;
let input;
let startX, startY, endX, endY;
let cropping = false;
let cropReady = false;
let croppedImage;
let cropButton;
let cropCircle = null;

// New variables for color picker
let pickedColor = [255, 255, 255];
let colorInput;
let pickColorButton;
let pickingColor = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  input = createFileInput(handleFile);
  input.position(10, 10);

  cropButton = createButton("Crop");
  cropButton.position(10, 40);
  cropButton.mousePressed(cropImage);
  cropButton.hide();

  // Color input for manual entry
  colorInput = createInput("#ffffff");
  colorInput.position(10, 70);
  colorInput.size(80);

  // Button to pick color from image
  pickColorButton = createButton("Pick Color");
  pickColorButton.position(100, 70);
  pickColorButton.mousePressed(() => {
    pickingColor = true;
  });

  // Button to remove background
  let removeBgButton = createButton("Remove BG");
  removeBgButton.position(200, 70);
  removeBgButton.mousePressed(removeBackground);
}

function draw() {
  background(220);

  if (img) {
    image(img, 50, 50, img.width / 2, img.height / 2);

    // Draw center point of the image
    let imgCenterX = 50 + img.width / 2 / 2;
    let imgCenterY = 50 + img.height / 2 / 2;
    stroke(0, 0, 255);
    strokeWeight(2);
    line(imgCenterX - 8, imgCenterY, imgCenterX + 8, imgCenterY);
    line(imgCenterX, imgCenterY - 8, imgCenterX, imgCenterY + 8);

    // Draw cropping circle while dragging
    if (cropping) {
      let diameter = dist(startX, startY, mouseX, mouseY) * 2;
      noFill();
      stroke(255, 0, 0);
      strokeWeight(2);
      ellipse(startX, startY, diameter, diameter);
    }

    // Draw cropping circle after mouse released
    if (cropReady && cropCircle) {
      noFill();
      stroke(0, 255, 0);
      strokeWeight(2);
      ellipse(cropCircle.x, cropCircle.y, cropCircle.d, cropCircle.d);
    }

    // Show picked color swatch
    fill(pickedColor);
    stroke(0);
    rect(300, 70, 30, 30);
  }

  if (croppedImage) {
    image(croppedImage, width - 200, 50);
  }
}

function handleFile(file) {
  if (file.type === "image") {
    img = loadImage(file.data);
    croppedImage = null;
    cropReady = false;
    cropButton.hide();
  }
}

function mousePressed() {
  if (pickingColor && img) {
    // Get color from image at mouse position
    let x = Math.round((mouseX - 50) * 2);
    let y = Math.round((mouseY - 50) * 2);
    if (x >= 0 && y >= 0 && x < img.width && y < img.height) {
      img.loadPixels();
      let idx = 4 * (y * img.width + x);
      pickedColor = [img.pixels[idx], img.pixels[idx + 1], img.pixels[idx + 2]];
      // Update color input as hex
      colorInput.value(
        rgbToHex(pickedColor[0], pickedColor[1], pickedColor[2])
      );
    }
    pickingColor = false;
    return;
  }

  if (
    img &&
    mouseX >= 50 &&
    mouseY >= 50 &&
    mouseX <= 50 + img.width / 2 &&
    mouseY <= 50 + img.height / 2
  ) {
    startX = mouseX;
    startY = mouseY;
    cropping = true;
    cropReady = false;
    cropButton.hide();
  }
}

function mouseReleased() {
  if (cropping) {
    endX = mouseX;
    endY = mouseY;
    cropping = false;

    // Calculate diameter and center
    let diameter = dist(startX, startY, endX, endY) * 2;
    cropCircle = {
      x: startX,
      y: startY,
      d: diameter,
    };
    cropReady = true;
    cropButton.show();
  }
}

function cropImage() {
  if (!cropReady || !cropCircle) return;

  let diameter = cropCircle.d;
  let centerX = cropCircle.x;
  let centerY = cropCircle.y;

  // Create a graphics buffer for the cropped image
  let graphic = createGraphics(diameter, diameter);

  // Calculate the offset to map canvas coordinates to image coordinates
  let imgOffsetX = 50;
  let imgOffsetY = 50;
  let scale = img.width / 2 / img.width; // always 0.5, but kept for clarity

  // Calculate the top-left of the crop area in the image
  let cropImgX = (centerX - diameter / 2 - imgOffsetX) * 2;
  let cropImgY = (centerY - diameter / 2 - imgOffsetY) * 2;

  // Draw the relevant part of the image onto the buffer
  graphic.image(
    img,
    0,
    0,
    diameter,
    diameter, // dest x, y, w, h
    cropImgX,
    cropImgY,
    diameter * 2,
    diameter * 2 // src x, y, w, h (since image is scaled down by 2)
  );

  // Create a circular mask
  let mask = createGraphics(diameter, diameter);
  mask.background(0);
  mask.noStroke();
  mask.fill(255);
  mask.ellipse(diameter / 2, diameter / 2, diameter, diameter);

  graphic.loadPixels();
  mask.loadPixels();
  for (let i = 0; i < graphic.pixels.length; i += 4) {
    if (mask.pixels[i] === 0) {
      graphic.pixels[i + 3] = 0;
    }
  }
  graphic.updatePixels();

  croppedImage = graphic;
  saveCanvas(croppedImage, "cropped_image", "png");
  cropReady = false;
  cropButton.hide();
}

// Utility: Convert RGB to HEX
function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

// Utility: Convert HEX to RGB
function hexToRgb(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((x) => x + x)
      .join("");
  }
  let num = parseInt(hex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// Remove background matching picked color
function removeBackground() {
  if (!img) return;
  let hex = colorInput.value();
  let [rT, gT, bT] = hexToRgb(hex);
  let threshold = 20; // tolerance

  img.loadPixels();
  for (let i = 0; i < img.pixels.length; i += 4) {
    let r = img.pixels[i];
    let g = img.pixels[i + 1];
    let b = img.pixels[i + 2];
    if (
      abs(r - rT) < threshold &&
      abs(g - gT) < threshold &&
      abs(b - bT) < threshold
    ) {
      img.pixels[i + 3] = 0;
    }
  }
  img.updatePixels();
  save(img, "updated_image.png");
}
