// Get references to the DOM elements
const paletteContainer = document.querySelector('.palette-container');
const generateButton = document.getElementById('generate-button');

// Function to generate a random hex color code
function getRandomColor() {
    // Generate a random number between 0 and 16777215 (FFFFFF in hex)
    const randomColor = Math.floor(Math.random() * 16777215).toString(16);

    // Pad the hex code with leading zeros if necessary (ensure it's 6 digits)
    const hexColor = '#' + randomColor.padStart(6, '0');

    return hexColor;
}

// Function to create a color box element
function createColorBox(color) {
    const colorBox = document.createElement('div');
    colorBox.classList.add('color-box');
    colorBox.style.backgroundColor = color;

    const hexCodeSpan = document.createElement('span');
    hexCodeSpan.classList.add('hex-code');
    hexCodeSpan.textContent = color;

    colorBox.appendChild(hexCodeSpan);

    // Add click functionality to copy hex code
    colorBox.addEventListener('click', () => {
        copyToClipboard(color);
    });

    return colorBox;
}

// Function to generate and display a new palette
function generatePalette() {
    // Clear the current palette
    paletteContainer.innerHTML = '';

    // Generate and add 5 color boxes
    for (let i = 0; i < 5; i++) {
        const newColor = getRandomColor();
        const colorBox = createColorBox(newColor);
        paletteContainer.appendChild(colorBox);
    }
}

// Function to copy text to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Optional: Provide feedback to the user
        alert(`Copied: ${text}`);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

// Add event listener to the button
generateButton.addEventListener('click', generatePalette);

// Generate an initial palette when the page loads
generatePalette();
