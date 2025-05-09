// Get references to the DOM elements
const paletteContainer = document.querySelector('.palette-container');
const savedPaletteContainer = document.querySelector('.saved-palette-container');
const generateButton = document.getElementById('generate-button');

// Define the localStorage key
const SAVED_COLORS_STORAGE_KEY = 'colorPaletteGeneratorSavedColors';

// --- localStorage Functions ---
function getSavedColors() {
    const savedColorsString = localStorage.getItem(SAVED_COLORS_STORAGE_KEY);
    return savedColorsString ? JSON.parse(savedColorsString) : [];
}

function saveColors(colors) {
    localStorage.setItem(SAVED_COLORS_STORAGE_KEY, JSON.stringify(colors));
}

// --- Color Generation ---
function getRandomColor() {
    const randomColor = Math.floor(Math.random() * 16777215).toString(16);
    return '#' + randomColor.padStart(6, '0');
}

// --- Clipboard Function ---
function copyToClipboard(text, elementToUpdate) {
    // Use the modern Clipboard API if available
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            console.log(`Copied: ${text}`);
            // Provide temporary visual feedback on the element
            const originalText = elementToUpdate.textContent;
            elementToUpdate.textContent = 'Copied!';
            // Add a class for potential styling (e.g., green text)
            elementToUpdate.classList.add('copied-feedback');
            setTimeout(() => {
                elementToUpdate.textContent = originalText;
                 elementToUpdate.classList.remove('copied-feedback');
            }, 1000); // Show "Copied!" for 1 second
        }).catch(err => {
            console.error('Failed to copy text: ', err);
             // Fallback or error message
            alert('Failed to copy color. Please try again.');
        });
    } else {
         // Fallback for browsers without the modern Clipboard API
        console.warn('Clipboard API not available. Using fallback method.');
         const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            console.log(`Copied using execCommand: ${text}`);
            // Provide temporary visual feedback on the element
            const originalText = elementToUpdate.textContent;
            elementToUpdate.textContent = 'Copied!';
             elementToUpdate.classList.add('copied-feedback');
            setTimeout(() => {
                elementToUpdate.textContent = originalText;
                 elementToUpdate.classList.remove('copied-feedback');
            }, 1000);
        } catch (err) {
            console.error('Fallback copy failed: ', err);
             alert('Copying to clipboard is not supported in this browser.');
        }
        document.body.removeChild(textarea);
    }
}

// --- Color Box Creation ---

// Function to create a color box element for the GENERATED palette
function createColorBox(color) {
    const colorBox = document.createElement('div');
    colorBox.classList.add('color-box');
    colorBox.style.backgroundColor = color;

    const hexCodeSpan = document.createElement('span');
    hexCodeSpan.classList.add('hex-code');
    hexCodeSpan.textContent = color;
    hexCodeSpan.title = "Click to copy"; // Add a default tooltip title

    // Add save button/icon
    const saveButton = document.createElement('button');
    saveButton.classList.add('save-button');
    saveButton.textContent = '❤️'; // Or use an icon like '⭐' or '💾'
    saveButton.title = "Save Color";


    // --- Event Listeners for Generated Box ---

    // Click on hex code copies the color
    hexCodeSpan.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the color box click event
        copyToClipboard(hexCodeSpan.textContent, hexCodeSpan); // Pass hexCodeSpan for feedback
    });

     // Optional: Change text on hover (requires CSS)
     // hexCodeSpan.addEventListener('mouseover', () => {
     //    if (!hexCodeSpan.classList.contains('copied-feedback')) { // Don't change if showing "Copied!"
     //        hexCodeSpan.textContent = 'Click to Copy';
     //    }
     // });
     // hexCodeSpan.addEventListener('mouseout', () => {
     //     if (!hexCodeSpan.classList.contains('copied-feedback')) {
     //         hexCodeSpan.textContent = rgbToHex(colorBox.style.backgroundColor).toUpperCase(); // Restore original hex
     //     }
     // });


    // Click on save button saves the color
    saveButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the color box click event
        const colorToSave = colorBox.style.backgroundColor; // Get current background color
         // Ensure color is in hex format before saving
        const hexColorToSave = rgbToHex(colorToSave);

        let savedColors = getSavedColors();

        if (!savedColors.includes(hexColorToSave)) {
            savedColors.push(hexColorToSave);
            saveColors(savedColors);
            renderSavedColors(); // Update the saved colors display
             // Optional: Provide feedback that color was saved
             console.log(`Saved: ${hexColorToSave}`);
        } else {
             console.log(`${hexColorToSave} is already saved.`);
        }
    });

    // Click on the color area opens the color picker
    colorBox.addEventListener('click', (event) => {
        // Check if the click was directly on the colorBox, not its children (hexCodeSpan or saveButton)
        if (event.target === colorBox) {
            // Create a temporary color input
            const colorInput = document.createElement('input');
            colorInput.setAttribute('type', 'color');
            colorInput.value = rgbToHex(colorBox.style.backgroundColor); // Set initial value

             // --- Attempt to position the hidden input centrally ---
             colorInput.style.position = 'fixed'; // Use fixed positioning
             colorInput.style.top = '50%';
             colorInput.style.left = '50%';
             colorInput.style.transform = 'translate(-50%, -50%)'; // Center it
             colorInput.style.width = '0'; // Make it tiny
             colorInput.style.height = '0';
             colorInput.style.opacity = '0'; // Make it invisible
             document.body.appendChild(colorInput);


            // Trigger the click on the hidden input to open the picker
            colorInput.click();

            // Event listener for color change
            colorInput.addEventListener('change', (e) => {
                const newColor = e.target.value;
                colorBox.style.backgroundColor = newColor; // Update background
                hexCodeSpan.textContent = newColor.toUpperCase(); // Update hex text
                // Remove the input after selection
                colorInput.remove();
            });

             // Event listener for picker closing without change (e.g., ESC key or clicking outside)
             // This helps clean up the temporary input
            colorInput.addEventListener('blur', () => {
                // Use a small timeout to allow the 'change' event to fire first if needed
                setTimeout(() => {
                    colorInput.remove();
                }, 50);
            });

            // Basic cleanup for the input if the user navigates away or resizes
             window.addEventListener('beforeunload', () => colorInput.remove());
             window.addEventListener('resize', () => colorInput.remove());

        }
    });


    colorBox.appendChild(hexCodeSpan);
    colorBox.appendChild(saveButton);

    return colorBox;
}

// Function to create a color box element for the SAVED palette
function createSavedColorBox(color) {
     const colorBox = document.createElement('div');
    colorBox.classList.add('color-box', 'saved-color-box'); // Add saved-color-box class for potential specific styling
    colorBox.style.backgroundColor = color;

    const hexCodeSpan = document.createElement('span');
    hexCodeSpan.classList.add('hex-code');
    hexCodeSpan.textContent = color;
     hexCodeSpan.title = "Click to copy"; // Add a default tooltip title


     // Add remove button/icon
    const removeButton = document.createElement('button');
    removeButton.classList.add('remove-button');
    removeButton.textContent = '✖'; // Or use an icon
    removeButton.title = "Remove Color";

     // --- Event Listeners for Saved Box ---

     // Click on hex code copies the color
    hexCodeSpan.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the color box click event
        copyToClipboard(hexCodeSpan.textContent, hexCodeSpan); // Pass hexCodeSpan for feedback
    });

     // Optional: Change text on hover (requires CSS)
     // hexCodeSpan.addEventListener('mouseover', () => {
     //    if (!hexCodeSpan.classList.contains('copied-feedback')) {
     //         hexCodeSpan.textContent = 'Click to Copy';
     //    }
     // });
     // hexCodeSpan.addEventListener('mouseout', () => {
     //     if (!hexCodeSpan.classList.contains('copied-feedback')) {
     //         hexCodeSpan.textContent = color.toUpperCase(); // Restore original hex
     //     }
     // });


     // Click on remove button removes the color
    removeButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the color box click event
        const colorToRemove = color; // Use the color passed to the function
        let savedColors = getSavedColors();

        savedColors = savedColors.filter(c => c.toLowerCase() !== colorToRemove.toLowerCase()); // Case-insensitive comparison

        saveColors(savedColors);
        renderSavedColors();
         console.log(`Removed: ${colorToRemove}`);
    });

     // Click on the saved box background currently does nothing
     // colorBox.addEventListener('click', () => {
     //    // No action on clicking the saved color box background
     // });


    colorBox.appendChild(hexCodeSpan);
    colorBox.appendChild(removeButton);

    return colorBox;
}


// Function to generate and display a new palette
function generatePalette() {
    paletteContainer.innerHTML = ''; // Clear generated section

    for (let i = 0; i < 5; i++) {
        const newColor = getRandomColor();
        const colorBox = createColorBox(newColor);
        paletteContainer.appendChild(colorBox);
    }
}

// Function to render the saved colors
function renderSavedColors() {
    savedPaletteContainer.innerHTML = ''; // Clear saved section

    const savedColors = getSavedColors();

    if (savedColors.length === 0) {
        const noSavedMessage = document.createElement('p');
        noSavedMessage.classList.add('no-saved-message');
        noSavedMessage.textContent = 'No saved colors yet.';
        savedPaletteContainer.appendChild(noSavedMessage);
    } else {
        savedColors.forEach(color => {
            const savedColorBox = createSavedColorBox(color);
            savedPaletteContainer.appendChild(savedColorBox);
        });
    }
}

// Helper function to convert RGB color to Hex
// This is needed because element.style.backgroundColor might return 'rgb(x, y, z)'
function rgbToHex(rgb) {
    if (rgb.startsWith('#')) {
        return rgb.toUpperCase(); // Already in hex
    }

    const rgbMatch = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!rgbMatch) {
         // Return a default or handle error if format is unexpected
        console.error("Could not parse RGB color:", rgb);
        return '#000000'; // Default to black
    }

    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);

    const toHex = (c) => {
        const hex = c.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return '#' + toHex(r) + toHex(g) + toHex(b);
}


// --- Initialization ---
// Add event listener to the button
generateButton.addEventListener('click', generatePalette);

// Generate an initial palette and load/render saved colors on page load
generatePalette();
renderSavedColors();
