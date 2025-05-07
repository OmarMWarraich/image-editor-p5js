let img;
let input;
let startX, startY, endX, endY;
let cropping = false;
let cropReady = false;
let croppedImage;
let cropButton;
let cropCircle = null;

function setup() {
  createCanvas(windowWidth, windowHeight);
  input = createFileInput(handleFile);
  input.position(10, 10);

  cropButton = createButton("Crop");
  cropButton.position(10, 40);
  cropButton.mousePressed(cropImage);
  cropButton.hide();
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
