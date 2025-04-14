document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const jsonBuilder = document.getElementById('json-builder');
    const jsonPreview = document.getElementById('json-preview');
    const jsonImport = document.getElementById('json-import');
    const rootObject = document.getElementById('root-object');
    const addPropertyBtn = document.getElementById('add-property');
    const addNestedObjectBtn = document.getElementById('add-nested-object');
    const addArrayBtn = document.getElementById('add-array');
    const copyJsonBtn = document.getElementById('copy-json');
    const downloadJsonBtn = document.getElementById('download-json');
    const parseJsonBtn = document.getElementById('parse-json');

    // Templates
    const propertyTemplate = document.getElementById('property-template');
    const arrayTemplate = document.getElementById('array-template');
    const arrayItemTemplate = document.getElementById('array-item-template');
    const arrayObjectTemplate = document.getElementById('array-object-template');
    const nestedObjectTemplate = document.getElementById('nested-object-template');

    // Event Listeners
    addPropertyBtn.addEventListener('click', () => addProperty(rootObject.querySelector('.object-content')));
    addNestedObjectBtn.addEventListener('click', () => addNestedObject(rootObject.querySelector('.object-content')));
    addArrayBtn.addEventListener('click', () => addArray(rootObject.querySelector('.object-content')));
    copyJsonBtn.addEventListener('click', copyJsonToClipboard);
    downloadJsonBtn.addEventListener('click', downloadJson);
    parseJsonBtn.addEventListener('click', parseImportedJson);

    // Update JSON preview whenever there's a change in the builder
    jsonBuilder.addEventListener('input', updateJsonPreview);
    jsonBuilder.addEventListener('change', updateJsonPreview);

    // Also update when elements are added or removed (using event delegation)
    jsonBuilder.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-property') ||
            e.target.classList.contains('remove-array') ||
            e.target.classList.contains('remove-item') ||
            e.target.classList.contains('remove-object') ||
            e.target.classList.contains('add-property') ||
            e.target.classList.contains('add-nested-object') ||
            e.target.classList.contains('add-array') ||
            e.target.classList.contains('add-array-value') ||
            e.target.classList.contains('add-array-object') ||
            e.target.classList.contains('add-array-array') ||
            e.target.classList.contains('toggle-object') ||
            e.target.classList.contains('toggle-array-object')) {

            handleButtonClick(e);
        }
    });

    // Initialize with empty JSON preview
    updateJsonPreview();

    // Functions
    function handleButtonClick(e) {
        const target = e.target;

        if (target.classList.contains('remove-property')) {
            target.closest('.property-item').remove();
            updateJsonPreview();
        } else if (target.classList.contains('remove-array')) {
            target.closest('.array-container').remove();
            updateJsonPreview();
        } else if (target.classList.contains('remove-item')) {
            target.closest('.array-item').remove();
            updateJsonPreview();
        } else if (target.classList.contains('remove-object')) {
            target.closest('.nested-object').remove();
            updateJsonPreview();
        } else if (target.classList.contains('add-property')) {
            // Handle both regular objects and array objects
            const parent = target.closest('.nested-object') || target.closest('.array-object-item');
            const contentContainer = parent.querySelector('.object-content') || parent.querySelector('.array-object-content');
            addProperty(contentContainer);
        } else if (target.classList.contains('add-nested-object')) {
            // Handle both regular objects and array objects
            const parent = target.closest('.nested-object') || target.closest('.array-object-item');
            const contentContainer = parent.querySelector('.object-content') || parent.querySelector('.array-object-content');
            addNestedObject(contentContainer);
        } else if (target.classList.contains('add-array')) {
            // Handle both regular objects and array objects
            const parent = target.closest('.nested-object') || target.closest('.array-object-item');
            const contentContainer = parent.querySelector('.object-content') || parent.querySelector('.array-object-content');
            addArray(contentContainer);
        } else if (target.classList.contains('add-array-value')) {
            const arrayItems = target.closest('.array-container').querySelector('.array-items');
            addArrayValue(arrayItems);
        } else if (target.classList.contains('add-array-object')) {
            const arrayItems = target.closest('.array-container').querySelector('.array-items');
            addArrayObject(arrayItems);
        } else if (target.classList.contains('add-array-array')) {
            const arrayItems = target.closest('.array-container').querySelector('.array-items');
            addArrayNestedArray(arrayItems);
        } else if (target.classList.contains('toggle-object')) {
            const nestedObject = target.closest('.nested-object');
            nestedObject.classList.toggle('collapsed');
        } else if (target.classList.contains('toggle-array-object')) {
            const arrayObject = target.closest('.array-object-item');
            arrayObject.classList.toggle('collapsed');
        }
    }

    function addProperty(container) {
        const clone = document.importNode(propertyTemplate.content, true);
        container.appendChild(clone);
        updateJsonPreview();
    }

    function addNestedObject(container) {
        const clone = document.importNode(nestedObjectTemplate.content, true);
        container.appendChild(clone);
        updateJsonPreview();
    }

    function addArray(container) {
        const clone = document.importNode(arrayTemplate.content, true);
        container.appendChild(clone);
        updateJsonPreview();
    }

    function addArrayValue(container) {
        // Add a regular value item
        const clone = document.importNode(arrayItemTemplate.content, true);
        container.appendChild(clone);
        updateJsonPreview();
    }

    function addArrayObject(container) {
        // Add an object item
        const clone = document.importNode(arrayObjectTemplate.content, true);
        container.appendChild(clone);
        updateJsonPreview();
    }

    function addArrayNestedArray(container) {
        // Create a nested array inside an array item
        // For simplicity, we'll use a regular item with type 'object' and a JSON string
        const clone = document.importNode(arrayItemTemplate.content, true);
        const typeSelect = clone.querySelector('.item-type');

        // Set type to object
        for (let i = 0; i < typeSelect.options.length; i++) {
            if (typeSelect.options[i].value === 'object') {
                typeSelect.selectedIndex = i;
                break;
            }
        }

        // Set an empty array as the value
        clone.querySelector('.item-value').value = '[]';

        container.appendChild(clone);
        updateJsonPreview();
    }

    function updateJsonPreview() {
        const json = buildJsonFromUI();
        jsonPreview.textContent = JSON.stringify(json, null, 2);
    }

    function buildJsonFromUI() {
        return buildObjectFromElement(rootObject);
    }

    function buildObjectFromElement(objectElement) {
        const result = {};
        const objectContent = objectElement.querySelector('.object-content');

        // Process properties
        const propertyItems = objectContent.querySelectorAll(':scope > .property-item');
        propertyItems.forEach(item => {
            const key = item.querySelector('.property-key').value.trim();
            if (key) {
                const type = item.querySelector('.property-type').value;
                const valueInput = item.querySelector('.property-value').value;
                result[key] = convertValueByType(valueInput, type);
            }
        });

        // Process nested objects
        const nestedObjects = objectContent.querySelectorAll(':scope > .nested-object');
        nestedObjects.forEach(nestedObj => {
            const key = nestedObj.querySelector('.object-key').value.trim();
            if (key) {
                result[key] = buildObjectFromElement(nestedObj);
            }
        });

        // Process arrays
        const arrayContainers = objectContent.querySelectorAll(':scope > .array-container');
        arrayContainers.forEach(arrayContainer => {
            const key = arrayContainer.querySelector('.array-key').value.trim();
            if (key) {
                result[key] = buildArrayFromElement(arrayContainer);
            }
        });

        return result;
    }

    function buildArrayFromElement(arrayElement) {
        const result = [];
        const arrayItems = arrayElement.querySelectorAll('.array-item');

        arrayItems.forEach(item => {
            // Check if this is an array object item
            if (item.classList.contains('array-object-item')) {
                // Build object from the array object item
                const objectContent = {};

                // Process properties
                const propertyItems = item.querySelectorAll('.array-object-content > .property-item');
                propertyItems.forEach(propItem => {
                    const key = propItem.querySelector('.property-key').value.trim();
                    if (key) {
                        const type = propItem.querySelector('.property-type').value;
                        const valueInput = propItem.querySelector('.property-value').value;
                        objectContent[key] = convertValueByType(valueInput, type);
                    }
                });

                // Process nested objects
                const nestedObjects = item.querySelectorAll('.array-object-content > .nested-object');
                nestedObjects.forEach(nestedObj => {
                    const key = nestedObj.querySelector('.object-key').value.trim();
                    if (key) {
                        objectContent[key] = buildObjectFromElement(nestedObj);
                    }
                });

                // Process arrays
                const arrayContainers = item.querySelectorAll('.array-object-content > .array-container');
                arrayContainers.forEach(arrayContainer => {
                    const key = arrayContainer.querySelector('.array-key').value.trim();
                    if (key) {
                        objectContent[key] = buildArrayFromElement(arrayContainer);
                    }
                });

                result.push(objectContent);
            } else {
                // Regular array item
                const type = item.querySelector('.item-type').value;
                const valueInput = item.querySelector('.item-value').value;

                if (type === 'object') {
                    // Check if we have stored object data
                    const objectData = item.querySelector('.object-data');
                    if (objectData) {
                        try {
                            // Parse the stored object data
                            result.push(JSON.parse(objectData.value));
                        } catch (e) {
                            // Fallback to empty object if parsing fails
                            result.push({});
                        }
                    } else {
                        // If no stored data, try to parse the value as JSON
                        try {
                            result.push(JSON.parse(valueInput));
                        } catch (e) {
                            // Fallback to empty object
                            result.push({});
                        }
                    }
                } else {
                    result.push(convertValueByType(valueInput, type));
                }
            }
        });

        return result;
    }

    function convertValueByType(value, type) {
        switch (type) {
            case 'string':
                return value;
            case 'number':
                return value === '' ? 0 : Number(value);
            case 'boolean':
                return value.toLowerCase() === 'true';
            case 'null':
                return null;
            default:
                return value;
        }
    }

    function copyJsonToClipboard() {
        const jsonText = jsonPreview.textContent;
        navigator.clipboard.writeText(jsonText)
            .then(() => {
                alert('JSON copied to clipboard!');
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = jsonText;
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    // Modern approach
                    navigator.clipboard.writeText(jsonText);
                } catch (e) {
                    // Very old browsers fallback (deprecated but still works in some browsers)
                    try {
                        document.execCommand('copy');
                    } catch (e2) {
                        console.error('Copy failed:', e2);
                    }
                }
                document.body.removeChild(textArea);
                alert('JSON copied to clipboard!');
            });
    }

    function downloadJson() {
        const jsonText = jsonPreview.textContent;
        const blob = new Blob([jsonText], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function parseImportedJson() {
        try {
            const jsonText = jsonImport.value.trim();
            if (!jsonText) {
                alert('Please enter some JSON to parse.');
                return;
            }

            const json = JSON.parse(jsonText);

            // Clear existing content
            const objectContent = rootObject.querySelector('.object-content');
            objectContent.innerHTML = '';

            // Build UI from JSON
            buildUIFromJson(json, objectContent);

            // Update preview
            updateJsonPreview();

            alert('JSON successfully imported!');
        } catch (error) {
            alert('Invalid JSON: ' + error.message);
        }
    }

    function buildUIFromJson(json, container) {
        for (const key in json) {
            const value = json[key];
            const valueType = typeof value;

            if (value === null) {
                addPropertyWithValues(container, key, 'null', '');
            } else if (Array.isArray(value)) {
                addArrayWithValues(container, key, value);
            } else if (valueType === 'object') {
                addNestedObjectWithValues(container, key, value);
            } else {
                addPropertyWithValues(container, key, valueType, String(value));
            }
        }
    }

    function addPropertyWithValues(container, key, type, value) {
        const clone = document.importNode(propertyTemplate.content, true);
        clone.querySelector('.property-key').value = key;

        const typeSelect = clone.querySelector('.property-type');
        // Set the correct type
        for (let i = 0; i < typeSelect.options.length; i++) {
            if (typeSelect.options[i].value === type) {
                typeSelect.selectedIndex = i;
                break;
            }
        }

        clone.querySelector('.property-value').value = value;
        container.appendChild(clone);
    }

    function addArrayWithValues(container, key, arrayValues) {
        const clone = document.importNode(arrayTemplate.content, true);
        clone.querySelector('.array-key').value = key;

        // Get the array items container
        const arrayItems = clone.querySelector('.array-items');

        arrayValues.forEach(item => {
            const itemType = typeof item;

            if (item === null) {
                // Handle null values
                const itemClone = document.importNode(arrayItemTemplate.content, true);
                const typeSelect = itemClone.querySelector('.item-type');
                for (let i = 0; i < typeSelect.options.length; i++) {
                    if (typeSelect.options[i].value === 'null') {
                        typeSelect.selectedIndex = i;
                        break;
                    }
                }
                arrayItems.appendChild(itemClone);
            } else if (Array.isArray(item)) {
                // Handle nested arrays (not fully implemented in this version)
                const itemClone = document.importNode(arrayItemTemplate.content, true);
                const typeSelect = itemClone.querySelector('.item-type');
                for (let i = 0; i < typeSelect.options.length; i++) {
                    if (typeSelect.options[i].value === 'object') {
                        typeSelect.selectedIndex = i;
                        break;
                    }
                }
                itemClone.querySelector('.item-value').value = JSON.stringify(item);
                arrayItems.appendChild(itemClone);
            } else if (itemType === 'object') {
                // Create a proper object UI for array items
                const objectClone = document.importNode(arrayObjectTemplate.content, true);
                const objectContent = objectClone.querySelector('.array-object-content');

                // Build the object content
                buildUIFromJson(item, objectContent);

                arrayItems.appendChild(objectClone);
            } else {
                // Handle primitive values (string, number, boolean)
                const itemClone = document.importNode(arrayItemTemplate.content, true);
                const typeSelect = itemClone.querySelector('.item-type');

                // Set the correct type
                for (let i = 0; i < typeSelect.options.length; i++) {
                    if (typeSelect.options[i].value === itemType) {
                        typeSelect.selectedIndex = i;
                        break;
                    }
                }

                itemClone.querySelector('.item-value').value = String(item);
                arrayItems.appendChild(itemClone);
            }
        });

        container.appendChild(clone);
    }

    function addNestedObjectWithValues(container, key, objectValue) {
        const clone = document.importNode(nestedObjectTemplate.content, true);
        clone.querySelector('.object-key').value = key;

        const nestedObjectContent = clone.querySelector('.object-content');
        buildUIFromJson(objectValue, nestedObjectContent);

        container.appendChild(clone);
    }
});
