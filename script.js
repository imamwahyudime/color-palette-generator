// Get references to the DOM elements
const paletteContainer = document.querySelector('.palette-container');
const savedPaletteContainer = document.querySelector('.saved-palette-container');
const generatedHistoryContainer = document.querySelector('.generated-history-container');
const deletedHistoryContainer = document.querySelector('.deleted-history-container');
const generateButton = document.getElementById('generate-button');
const historyToggleButton = document.getElementById('history-toggle-button');
const historySections = document.getElementById('history-sections');

// Define the localStorage keys
const SAVED_COLORS_STORAGE_KEY = 'colorPaletteGeneratorSavedColors';
const GENERATED_HISTORY_STORAGE_KEY = 'colorPaletteGeneratorGeneratedHistory';
const DELETED_HISTORY_STORAGE_KEY = 'colorPaletteGeneratorDeletedHistory';

// Define history limits
const GENERATED_HISTORY_LIMIT = 15;
const DELETED_HISTORY_LIMIT = 10;

// --- localStorage Functions ---
function getSavedColors() {
    const savedColorsString = localStorage.getItem(SAVED_COLORS_STORAGE_KEY);
    return savedColorsString ? JSON.parse(savedColorsString) : [];
}

function saveColors(colors) {
    localStorage.setItem(SAVED_COLORS_STORAGE_KEY, JSON.stringify(colors));
}

function getGeneratedHistory() {
    const historyString = localStorage.getItem(GENERATED_HISTORY_STORAGE_KEY);
    return historyString ? JSON.parse(historyString) : [];
}

function saveGeneratedHistory(history) {
    // Keep only the last GENERATED_HISTORY_LIMIT items
    const limitedHistory = history.slice(-GENERATED_HISTORY_LIMIT);
    localStorage.setItem(GENERATED_HISTORY_STORAGE_KEY, JSON.stringify(limitedHistory));
}

function getDeletedHistory() {
    const historyString = localStorage.getItem(DELETED_HISTORY_STORAGE_KEY);
    return historyString ? JSON.parse(historyString) : [];
}

function saveDeletedHistory(history) {
    // Keep only the last DELETED_HISTORY_LIMIT items
    const limitedHistory = history.slice(-DELETED_HISTORY_LIMIT);
    localStorage.setItem(DELETED_HISTORY_STORAGE_KEY, JSON.stringify(limitedHistory));
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

// Helper function to convert RGB color to Hex
function rgbToHex(rgb) {
    if (rgb.startsWith('#')) {
        return rgb.toUpperCase(); // Already in hex
    }

    const rgbMatch = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!rgbMatch) {
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


// --- Drag and Drop Variables ---
let draggedItem = null; // To store the element being dragged
let dragSourceContainer = null; // To store the container the item started in

// --- Drag and Drop Event Handlers ---

function handleDragStart(event) {
    draggedItem = event.target;
    dragSourceContainer = event.target.closest('.palette-container') || event.target.closest('.saved-palette-container') || event.target.closest('.history-list');

    // Only allow dragging from generated or saved containers
    if (!dragSourceContainer || dragSourceContainer.classList.contains('history-list')) {
         event.preventDefault(); // Prevent dragging from history
         return;
    }


    // Set the data to be transferred (the color hex code and source container ID)
    const color = rgbToHex(draggedItem.style.backgroundColor);
    event.dataTransfer.setData('text/plain', color);
    event.dataTransfer.setData('text/source-container', dragSourceContainer.classList.contains('palette-container') ? 'generated' : 'saved');

    // Add a class to the dragged item for styling (optional ghost image)
    setTimeout(() => { // Use timeout to allow default drag image to be set first
        draggedItem.classList.add('dragging');
    }, 0);

     // Set the drag image (optional, browser usually does this)
     // event.dataTransfer.setDragImage(draggedItem, event.clientX - draggedItem.getBoundingClientRect().left, event.clientY - draggedItem.getBoundingClientRect().top);
}

function handleDragOver(event) {
    event.preventDefault(); // Necessary to allow dropping

    // Add visual feedback to the potential drop target containers
    const targetContainer = event.target.closest('.palette-container') || event.target.closest('.saved-palette-container');

    // Only add drag-over class to valid drop targets
    if (targetContainer) {
         targetContainer.classList.add('drag-over');
    }


    // --- Reordering logic within the saved container ---
    if (targetContainer === savedPaletteContainer && dragSourceContainer === savedPaletteContainer) {
        const afterElement = getDragAfterElement(targetContainer, event.clientY);
        const draggable = document.querySelector('.dragging'); // The element currently being dragged

        if (afterElement == null) {
            targetContainer.appendChild(draggable);
        } else {
            targetContainer.insertBefore(draggable, afterElement);
        }
    }
}

function handleDragLeave(event) {
    // Remove visual feedback from the potential drop target
    event.target.closest('.palette-container')?.classList.remove('drag-over');
    event.target.closest('.saved-palette-container')?.classList.remove('drag-over');
}

function handleDrop(event) {
    event.preventDefault(); // Necessary to allow dropping

    // Remove drag-over feedback
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));


    const color = event.dataTransfer.getData('text/plain');
    const sourceContainerType = event.dataTransfer.getData('text/source-container');
    const targetContainer = event.target.closest('.palette-container') || event.target.closest('.saved-palette-container');

    if (!targetContainer) {
        // Dropped outside of a valid container (or on history)
        console.log("Dropped outside valid container or on history");
         // If dropped outside, and it was from generated, replace it.
         if (sourceContainerType === 'generated' && draggedItem && draggedItem.parentNode === dragSourceContainer) {
              const originalIndex = Array.from(dragSourceContainer.children).indexOf(draggedItem);
                if (originalIndex !== -1) {
                    const newColor = getRandomColor();
                    const newColorBox = createColorBox(newColor);
                    dragSourceContainer.replaceChild(newColorBox, draggedItem);
                }
         }
         // If dropped outside and it was from saved, just return it visually (handled by dragend)
        return;
    }

    // --- Handle different drop scenarios ---

    // 1. Dragging from Generated to Saved
    if (sourceContainerType === 'generated' && targetContainer === savedPaletteContainer) {
        let savedColors = getSavedColors();
        const hexColorToSave = rgbToHex(color);

        if (!savedColors.includes(hexColorToSave)) {
            savedColors.push(hexColorToSave);
            saveColors(savedColors);
            renderSavedColors(); // Update the saved display

            // Replace the dragged color in the generated palette
            const originalIndex = Array.from(dragSourceContainer.children).indexOf(draggedItem);
            if (originalIndex !== -1) {
                const newColor = getRandomColor();
                const newColorBox = createColorBox(newColor);
                dragSourceContainer.replaceChild(newColorBox, draggedItem);
                 // Add the original color to generated history
                 addGeneratedToHistory(color);
            }
             console.log(`Saved color from generated: ${hexColorToSave}`);
        } else {
             console.log(`${hexColorToSave} is already saved.`);
             // If already saved, just replace the generated color
             const originalIndex = Array.from(dragSourceContainer.children).indexOf(draggedItem);
            if (originalIndex !== -1) {
                const newColor = getRandomColor();
                const newColorBox = createColorBox(newColor);
                dragSourceContainer.replaceChild(newColorBox, draggedItem);
                 // Add the original color to generated history
                 addGeneratedToHistory(color);
            }
        }
    }

    // 2. Dragging within Saved (Reordering)
    if (sourceContainerType === 'saved' && targetContainer === savedPaletteContainer) {
        // The reordering was handled in dragover for visual feedback.
        // Now update localStorage based on the new order in the DOM.
        const updatedSavedColors = [];
        Array.from(savedPaletteContainer.children).forEach(box => {
             // Ensure it's a color box and not the "No saved colors" message
            if (box.classList.contains('saved-color-box')) {
                 const hexCodeSpan = box.querySelector('.hex-code');
                 if (hexCodeSpan) {
                     updatedSavedColors.push(hexCodeSpan.textContent);
                 }
            }
        });
        saveColors(updatedSavedColors);
         console.log("Reordered saved colors.");
         // Re-render to ensure consistency, though visually it might not change much
         // renderSavedColors(); // Optional: Re-render, might cause flicker
    }

    // 3. Dragging from Saved to Generated (Delete)
    if (sourceContainerType === 'saved' && targetContainer === paletteContainer) {
        let savedColors = getSavedColors();
        const colorToRemove = rgbToHex(color);

        savedColors = savedColors.filter(c => c.toLowerCase() !== colorToRemove.toLowerCase()); // Case-insensitive comparison

        saveColors(savedColors);
        renderSavedColors(); // Update the saved display
        console.log(`Removed color from saved: ${colorToRemove}`);

         // Add the deleted color to deleted history
         addDeletedToHistory(colorToRemove);

         // The dragged item is still in the generated container visually due to dragover.
         // We need to remove it from the DOM or replace it if necessary.
         // Since we are conceptually deleting it, we don't replace the spot in generated.
         // The draggedItem element is the one that was moved.
         if (draggedItem && draggedItem.parentNode === paletteContainer) {
              draggedItem.remove();
         }
    }

    // If dragging from generated to generated, the dragged item will just return visually
    // because the drop wasn't handled specifically for this case.
}

function handleDragEnd() {
    // Clean up the dragging class
    if (draggedItem) {
        draggedItem.classList.remove('dragging');
    }
    // Remove drag-over feedback from all containers
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));

    // If the item was dragged from saved and not successfully dropped on generated,
    // it might still be visually in the generated container due to dragover.
    // We need to ensure it's removed from there if it wasn't successfully deleted.
     if (dragSourceContainer && dragSourceContainer.classList.contains('saved-palette-container')) {
         if (draggedItem && draggedItem.parentNode === paletteContainer) {
             draggedItem.remove(); // Remove it from the generated container if it ended up there
         }
     }


    draggedItem = null;
    dragSourceContainer = null;

    // After drag end, especially for saved to saved, re-render to ensure DOM matches localStorage
    // This also handles the case where a saved item was dragged but not dropped on generated.
    renderSavedColors();
    renderGeneratedHistory(); // Also re-render history just in case
    renderDeletedHistory();
}

// Helper function to find the element after the current mouse position during dragover
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.color-box:not(.dragging), .saved-color-box:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        // Find the element with the smallest positive offset (meaning the mouse is above its center)
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: -Infinity }).element;
}


// --- Color Box Creation ---

// Function to create a color box element for the GENERATED palette
function createColorBox(color) {
    const colorBox = document.createElement('div');
    colorBox.classList.add('color-box');
    colorBox.style.backgroundColor = color;
    colorBox.setAttribute('draggable', true); // Make it draggable

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

    // --- Add Drag and Drop Event Listeners ---
    colorBox.addEventListener('dragstart', handleDragStart);
    colorBox.addEventListener('dragend', handleDragEnd);


    colorBox.appendChild(hexCodeSpan);
    colorBox.appendChild(saveButton);

    return colorBox;
}

// Function to create a color box element for the SAVED palette
function createSavedColorBox(color) {
     const colorBox = document.createElement('div');
    colorBox.classList.add('color-box', 'saved-color-box'); // Add saved-color-box class for potential specific styling
    colorBox.style.backgroundColor = color;
    colorBox.setAttribute('draggable', true); // Make it draggable


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

     // Click on remove button removes the color
    removeButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the color box click event
        const colorToRemove = color; // Use the color passed to the function
        let savedColors = getSavedColors();

        savedColors = savedColors.filter(c => c.toLowerCase() !== colorToRemove.toLowerCase()); // Case-insensitive comparison

        saveColors(savedColors);
        renderSavedColors(); // Update the saved display
        console.log(`Removed color from saved: ${colorToRemove}`);
         // Add the removed color to deleted history
         addDeletedToHistory(colorToRemove);
    });

     // Click on the saved box background currently does nothing
     // colorBox.addEventListener('click', () => {
     //    // No action on clicking the saved color box background
     // });

     // --- Add Drag and Drop Event Listeners ---
    colorBox.addEventListener('dragstart', handleDragStart);
    colorBox.addEventListener('dragend', handleDragEnd);


    colorBox.appendChild(hexCodeSpan);
    colorBox.appendChild(removeButton);

    return colorBox;
}

// Function to create a color box element for the HISTORY lists
function createHistoryColorBox(color) {
     const colorBox = document.createElement('div');
    colorBox.classList.add('history-color-box'); // Use the history class
    colorBox.style.backgroundColor = color;
    // History items are not draggable back to main palettes in this implementation

    const hexCodeSpan = document.createElement('span');
    hexCodeSpan.classList.add('hex-code'); // Use the same hex-code class for styling
    hexCodeSpan.textContent = color;
    hexCodeSpan.title = "Click to copy"; // Add a default tooltip title

     // --- Event Listeners for History Box ---

     // Click on hex code copies the color
    hexCodeSpan.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent any parent clicks
        copyToClipboard(hexCodeSpan.textContent, hexCodeSpan); // Pass hexCodeSpan for feedback
    });

     // Click on the history box background currently does nothing
     // colorBox.addEventListener('click', () => {
     //    // No action on clicking the history color box background
     // });


    colorBox.appendChild(hexCodeSpan);

    return colorBox;
}


// --- History Management Functions ---

// Add a color to the generated history
function addGeneratedToHistory(color) {
    let history = getGeneratedHistory();
    const hexColor = rgbToHex(color);

    // Add to the end of the array (most recent last)
    history.push(hexColor);

    // Remove duplicates (keeping the most recent one)
    history = history.filter((item, index, self) =>
        index === self.findIndex((t) => t === item)
    );

    saveGeneratedHistory(history); // This will now save the last 15 after push
    renderGeneratedHistory();
}

// Add a color to the deleted history
function addDeletedToHistory(color) {
    let history = getDeletedHistory();
    const hexColor = rgbToHex(color);

    // Add to the end of the array (most recent last)
    history.push(hexColor);

     // Remove duplicates (keeping the most recent one)
    history = history.filter((item, index, self) =>
        index === self.findIndex((t) => t === item)
    );

    saveDeletedHistory(history); // This will now save the last 10 after push
    renderDeletedHistory();
}


// --- Rendering Functions ---

// Function to generate and display a new palette
function generatePalette() {
    // Before clearing, add the current colors to generated history
    Array.from(paletteContainer.children).forEach(colorBox => {
         // Ensure it's a color box and not a placeholder
        if (colorBox.classList.contains('color-box')) {
            const color = rgbToHex(colorBox.style.backgroundColor);
            addGeneratedToHistory(color);
        }
    });


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

// Function to render the generated history
function renderGeneratedHistory() {
    generatedHistoryContainer.innerHTML = ''; // Clear history section

    const generatedHistory = getGeneratedHistory();

    if (generatedHistory.length === 0) {
        const noHistoryMessage = document.createElement('p');
        noHistoryMessage.classList.add('no-history-message');
        noHistoryMessage.textContent = 'No generated history yet.';
        generatedHistoryContainer.appendChild(noHistoryMessage);
    } else {
        generatedHistory.forEach(color => {
            const historyColorBox = createHistoryColorBox(color);
            generatedHistoryContainer.appendChild(historyColorBox);
        });
    }
}

// Function to render the deleted history
function renderDeletedHistory() {
    deletedHistoryContainer.innerHTML = ''; // Clear history section

    const deletedHistory = getDeletedHistory();

    if (deletedHistory.length === 0) {
        const noHistoryMessage = document.createElement('p');
        noHistoryMessage.classList.add('no-history-message');
        noHistoryMessage.textContent = 'No deleted history yet.';
        deletedHistoryContainer.appendChild(noHistoryMessage);
    } else {
        deletedHistory.forEach(color => {
            const historyColorBox = createHistoryColorBox(color);
            deletedHistoryContainer.appendChild(historyColorBox);
        });
    }
}

// --- History Toggle Functionality ---
function toggleHistorySections() {
    const isHidden = historySections.classList.toggle('history-sections-hidden');
    historyToggleButton.setAttribute('aria-expanded', !isHidden);
    historySections.setAttribute('aria-hidden', isHidden);
}


// --- Add Drop Zone Event Listeners to Containers ---
paletteContainer.addEventListener('dragover', handleDragOver);
paletteContainer.addEventListener('dragleave', handleDragLeave);
paletteContainer.addEventListener('drop', handleDrop);

savedPaletteContainer.addEventListener('dragover', handleDragOver);
savedPaletteContainer.addEventListener('dragleave', handleDragLeave);
savedPaletteContainer.addEventListener('drop', handleDrop);

// History lists are not drop targets in this implementation
// generatedHistoryContainer.addEventListener('dragover', handleDragOver);
// generatedHistoryContainer.addEventListener('dragleave', handleDragLeave);
// generatedHistoryContainer.addEventListener('drop', handleDrop);

// deletedHistoryContainer.addEventListener('dragover', handleDragOver);
// deletedHistoryContainer.addEventListener('dragleave', handleDragLeave);
// deletedHistoryContainer.addEventListener('drop', handleDrop);


// --- Initialization ---
// Add event listener to the generate button
generateButton.addEventListener('click', generatePalette);

// Add event listener to the history toggle button
historyToggleButton.addEventListener('click', toggleHistorySections);

// Generate an initial palette and load/render saved colors and history on page load
generatePalette(); // This will also add initial colors to history
renderSavedColors();
renderGeneratedHistory();
renderDeletedHistory();
