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

    // We'll use a debounced function instead of MutationObserver to prevent excessive calls
    let duplicateCheckTimeout = null;

    // Templates
    const propertyTemplate = document.getElementById('property-template');
    const arrayTemplate = document.getElementById('array-template');
    const arrayItemTemplate = document.getElementById('array-item-template');
    const arrayObjectTemplate = document.getElementById('array-object-template');
    const arrayArrayTemplate = document.getElementById('array-array-template');
    const nestedObjectTemplate = document.getElementById('nested-object-template');

    // Event Listeners
    addPropertyBtn.addEventListener('click', () => addProperty(rootObject.querySelector('.object-content')));
    addNestedObjectBtn.addEventListener('click', () => addNestedObject(rootObject.querySelector('.object-content')));
    addArrayBtn.addEventListener('click', () => addArray(rootObject.querySelector('.object-content')));
    copyJsonBtn.addEventListener('click', copyJsonToClipboard);
    downloadJsonBtn.addEventListener('click', downloadJson);
    parseJsonBtn.addEventListener('click', parseImportedJson);

    // Update JSON preview whenever there's a change in the builder
    jsonBuilder.addEventListener('input', function(e) {
        updateJsonPreview();
        // If the input is a key field, check for duplicates immediately
        if (e.target.classList.contains('property-key') ||
            e.target.classList.contains('object-key') ||
            e.target.classList.contains('array-key') ||
            e.target.classList.contains('item-key') ||
            e.target.classList.contains('array-object-key') ||
            e.target.classList.contains('array-array-key')) {
            // Clear existing timeout to prevent multiple checks
            if (duplicateCheckTimeout) {
                clearTimeout(duplicateCheckTimeout);
            }
            // Run immediately for key fields
            checkDuplicateKeys();
        } else {
            // Debounce for other fields
            debouncedCheckDuplicateKeys();
        }
    });
    jsonBuilder.addEventListener('change', function() {
        updateJsonPreview();
        checkDuplicateKeys(); // Run immediately on change events
    });

    // Add keyup listener to catch deletions and other key events
    jsonBuilder.addEventListener('keyup', function(e) {
        // If the input is a key field, check for duplicates immediately
        if (e.target.classList.contains('property-key') ||
            e.target.classList.contains('object-key') ||
            e.target.classList.contains('array-key') ||
            e.target.classList.contains('item-key') ||
            e.target.classList.contains('array-object-key') ||
            e.target.classList.contains('array-array-key')) {
            // Check for backspace, delete, and other editing keys
            if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Cut') {
                checkDuplicateKeys();
            }
        }
    });

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
            e.target.classList.contains('toggle-array-object') ||
            e.target.classList.contains('toggle-array-array')) {

            handleButtonClick(e);
        }
    });

    // Initialize with empty JSON preview and check for duplicate keys
    updateJsonPreview();
    // Initial check with a slight delay to ensure DOM is ready
    setTimeout(checkDuplicateKeys, 100);

    // Functions
    function handleButtonClick(e) {
        const target = e.target;

        if (target.classList.contains('remove-property')) {
            target.closest('.property-item').remove();
            updateJsonPreview();
            checkDuplicateKeys(); // Check for duplicates after removing
        } else if (target.classList.contains('remove-array')) {
            target.closest('.array-container').remove();
            updateJsonPreview();
            checkDuplicateKeys(); // Check for duplicates after removing
        } else if (target.classList.contains('remove-item')) {
            target.closest('.array-item').remove();
            updateJsonPreview();
            checkDuplicateKeys(); // Check for duplicates after removing
        } else if (target.classList.contains('remove-object')) {
            target.closest('.nested-object').remove();
            updateJsonPreview();
            checkDuplicateKeys(); // Check for duplicates after removing
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
            // Handle both regular arrays and nested arrays
            let container;
            // Check if the button is inside a nested array
            if (target.closest('.array-array-actions')) {
                container = target.closest('.array-array-item').querySelector('.array-array-content');
            }
            // Check if the button is inside a regular array
            else if (target.closest('.array-container')) {
                container = target.closest('.array-container').querySelector('.array-items');
            }
            if (container) addArrayValue(container);
        } else if (target.classList.contains('add-array-object')) {
            // Handle both regular arrays and nested arrays
            let container;
            // Check if the button is inside a nested array
            if (target.closest('.array-array-actions')) {
                container = target.closest('.array-array-item').querySelector('.array-array-content');
            }
            // Check if the button is inside a regular array
            else if (target.closest('.array-container')) {
                container = target.closest('.array-container').querySelector('.array-items');
            }
            if (container) addArrayObject(container);
        } else if (target.classList.contains('add-array-array')) {
            // Handle both regular arrays and nested arrays
            let container;
            // Check if the button is inside a nested array
            if (target.closest('.array-array-actions')) {
                container = target.closest('.array-array-item').querySelector('.array-array-content');
            }
            // Check if the button is inside a regular array
            else if (target.closest('.array-container')) {
                container = target.closest('.array-container').querySelector('.array-items');
            }
            if (container) addArrayNestedArray(container);
        } else if (target.classList.contains('toggle-object')) {
            const nestedObject = target.closest('.nested-object');
            nestedObject.classList.toggle('collapsed');
        } else if (target.classList.contains('toggle-array-object')) {
            const arrayObject = target.closest('.array-object-item');
            arrayObject.classList.toggle('collapsed');
        } else if (target.classList.contains('toggle-array-array')) {
            const arrayArray = target.closest('.array-array-item');
            arrayArray.classList.toggle('collapsed');
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
        // Create a proper nested array UI
        const clone = document.importNode(arrayArrayTemplate.content, true);
        container.appendChild(clone);
        updateJsonPreview();
    }

    function updateJsonPreview() {
        const json = buildJsonFromUI();
        jsonPreview.textContent = JSON.stringify(json, null, 2);
    }

    // Debounce function to prevent excessive calls
    function debouncedCheckDuplicateKeys() {
        if (duplicateCheckTimeout) {
            clearTimeout(duplicateCheckTimeout);
        }
        duplicateCheckTimeout = setTimeout(checkDuplicateKeys, 150); // Reduced delay for better responsiveness
    }

    function checkDuplicateKeys() {
        try {
            // Always remove all existing warnings first to ensure clean state
            document.querySelectorAll('.warning-icon, .warning-tooltip').forEach(element => {
                if (element && element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            });

            // Check for duplicate keys in the root object
            const rootContent = rootObject.querySelector('.object-content');
            if (rootContent) {
                checkDuplicateKeysInContainer(rootContent);
            }

            // Check for duplicate keys in array objects - limit the scope to direct children
            document.querySelectorAll('.array-object-content').forEach(container => {
                if (container) {
                    checkDuplicateKeysInContainer(container);
                }
            });

            // Check for duplicate keys in nested objects - limit the scope to direct children
            document.querySelectorAll('.nested-object > .object-content').forEach(container => {
                if (container) {
                    checkDuplicateKeysInContainer(container);
                }
            });

            // Check for duplicate keys in array items - limit the scope to direct children
            document.querySelectorAll('.array-items').forEach(container => {
                if (container) {
                    checkDuplicateKeysInArrayItems(container);
                }
            });

            // Check for duplicate keys in nested array items - limit the scope to direct children
            document.querySelectorAll('.array-array-content').forEach(container => {
                if (container) {
                    checkDuplicateKeysInArrayItems(container);
                }
            });
        } catch (error) {
            console.error('Error checking duplicate keys:', error);
        }
    }

    function checkDuplicateKeysInContainer(container) {
        if (!container) return;

        const keys = {};

        try {
            // Check property keys
            container.querySelectorAll(':scope > .property-item').forEach(item => {
                const keyInput = item.querySelector('.property-key');
                if (!keyInput) return;

                const key = keyInput.value.trim();

                if (key && keys[key]) {
                    // This is a duplicate key
                    addWarningToElement(keyInput);
                    // Also add warning to the first occurrence
                    addWarningToElement(keys[key]);
                } else if (key) {
                    keys[key] = keyInput;
                }
            });

            // Check nested object keys
            container.querySelectorAll(':scope > .nested-object').forEach(item => {
                const keyInput = item.querySelector('.object-key');
                if (!keyInput) return;

                const key = keyInput.value.trim();

                if (key && keys[key]) {
                    // This is a duplicate key
                    addWarningToElement(keyInput);
                    // Also add warning to the first occurrence
                    addWarningToElement(keys[key]);
                } else if (key) {
                    keys[key] = keyInput;
                }
            });

            // Check array keys
            container.querySelectorAll(':scope > .array-container').forEach(item => {
                const keyInput = item.querySelector('.array-key');
                if (!keyInput) return;

                const key = keyInput.value.trim();

                if (key && keys[key]) {
                    // This is a duplicate key
                    addWarningToElement(keyInput);
                    // Also add warning to the first occurrence
                    addWarningToElement(keys[key]);
                } else if (key) {
                    keys[key] = keyInput;
                }
            });
        } catch (error) {
            console.error('Error in checkDuplicateKeysInContainer:', error);
        }
    }

    function checkDuplicateKeysInArrayItems(container) {
        if (!container) return;

        const keys = {};

        try {
            // Check array item keys
            container.querySelectorAll(':scope > .array-item').forEach(item => {
                if (!item) return;

                const keyInput = item.querySelector('.item-key');
                if (keyInput) {
                    const key = keyInput.value.trim();

                    if (key && keys[key]) {
                        // This is a duplicate key
                        addWarningToElement(keyInput);
                        // Also add warning to the first occurrence
                        addWarningToElement(keys[key]);
                    } else if (key) {
                        keys[key] = keyInput;
                    }
                }
            });

            // Check array object keys
            container.querySelectorAll(':scope > .array-object-item').forEach(item => {
                if (!item) return;

                const keyInput = item.querySelector('.array-object-key');
                if (keyInput) {
                    const key = keyInput.value.trim();

                    if (key && keys[key]) {
                        // This is a duplicate key
                        addWarningToElement(keyInput);
                        // Also add warning to the first occurrence
                        addWarningToElement(keys[key]);
                    } else if (key) {
                        keys[key] = keyInput;
                    }
                }
            });

            // Check array array keys
            container.querySelectorAll(':scope > .array-array-item').forEach(item => {
                if (!item) return;

                const keyInput = item.querySelector('.array-array-key');
                if (keyInput) {
                    const key = keyInput.value.trim();

                    if (key && keys[key]) {
                        // This is a duplicate key
                        addWarningToElement(keyInput);
                        // Also add warning to the first occurrence
                        addWarningToElement(keys[key]);
                    } else if (key) {
                        keys[key] = keyInput;
                    }
                }
            });
        } catch (error) {
            console.error('Error in checkDuplicateKeysInArrayItems:', error);
        }
    }

    function addWarningToElement(element) {
        try {
            // Safety checks
            if (!element || !element.parentNode) return;

            // Check if warning already exists - redundant now but kept for safety
            if (element.nextElementSibling && element.nextElementSibling.classList.contains('warning-icon')) {
                return;
            }

            // Create warning icon with tooltip functionality
            const warningIcon = document.createElement('span');
            warningIcon.className = 'warning-icon';
            warningIcon.textContent = '⚠';
            warningIcon.title = 'This is a duplicate key! Only one of them will be shown in the result.'; // Fallback tooltip

            // Create tooltip
            const tooltip = document.createElement('span');
            tooltip.className = 'warning-tooltip';
            tooltip.textContent = 'This is a duplicate key! Only one of them will be shown in the result.';

            // Insert after the element
            element.parentNode.insertBefore(warningIcon, element.nextSibling);
            element.parentNode.insertBefore(tooltip, warningIcon.nextSibling);
        } catch (error) {
            console.error('Error in addWarningToElement:', error);
        }
    }

    function buildJsonFromUI() {
        // Build the object from the root element
        return buildObjectFromElement(rootObject);
    }

    function buildObjectFromElement(objectElement) {
        const result = {};
        const resultArray = [];
        let hasUnnamedProperties = false;
        const objectContent = objectElement.querySelector('.object-content');

        // Process properties
        const propertyItems = objectContent.querySelectorAll(':scope > .property-item');
        propertyItems.forEach(item => {
            const key = item.querySelector('.property-key').value.trim();
            const type = item.querySelector('.property-type').value;
            const valueInput = item.querySelector('.property-value').value;
            const value = convertValueByType(valueInput, type);

            if (key) {
                // If key is provided, add as a named property
                result[key] = value;
            } else {
                // If no key, add to the array of unnamed properties
                resultArray.push(value);
                hasUnnamedProperties = true;
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

        // If we have unnamed properties, return an array with both named and unnamed properties
        if (hasUnnamedProperties) {
            // Add named properties to the array as objects
            for (const key in result) {
                const namedProperty = {};
                namedProperty[key] = result[key];
                resultArray.push(namedProperty);
            }
            return resultArray;
        }

        // Otherwise return the object as is
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

                // Check if the object has a name
                const objectNameInput = item.querySelector('.array-object-key');
                const objectName = objectNameInput ? objectNameInput.value.trim() : '';

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

                // If the object has a name, add it as a named property
                if (objectName) {
                    const namedObject = {};
                    namedObject[objectName] = objectContent;
                    result.push(namedObject);
                } else {
                    // Otherwise just push the object directly
                    result.push(objectContent);
                }
            } else if (item.classList.contains('array-array-item')) {
                // Build nested array
                const nestedItems = item.querySelector('.array-array-content');
                const arrayNameInput = item.querySelector('.array-array-key');
                const arrayName = arrayNameInput ? arrayNameInput.value.trim() : '';

                // Create the array
                let nestedArray = [];

                // If there are items in the nested array, process them
                if (nestedItems) {
                    // Process all array items directly
                    const childItems = nestedItems.querySelectorAll('.array-item');
                    if (childItems.length > 0) {
                        // Create a temporary container with the same structure
                        const tempContainer = document.createElement('div');
                        tempContainer.className = 'array-container';

                        const tempArrayItems = document.createElement('div');
                        tempArrayItems.className = 'array-items';

                        // Clone each child item to the temp container
                        childItems.forEach(childItem => {
                            tempArrayItems.appendChild(childItem.cloneNode(true));
                        });

                        tempContainer.appendChild(tempArrayItems);

                        // Use the existing function to build the array
                        nestedArray = buildArrayFromElement(tempContainer);
                    }
                }

                // If the array has a name, add it as a named property to the parent object
                if (arrayName) {
                    // Create a named array object
                    const namedArray = {};
                    namedArray[arrayName] = nestedArray;
                    result.push(namedArray);
                } else {
                    // Just push the array directly
                    result.push(nestedArray);
                }
            } else {
                // Regular array item
                const type = item.querySelector('.item-type').value;
                const valueInput = item.querySelector('.item-value').value;
                const keyInput = item.querySelector('.item-key');
                const key = keyInput ? keyInput.value.trim() : '';

                // Process the value based on its type
                let value;
                if (type === 'object') {
                    // Check if we have stored object data
                    const objectData = item.querySelector('.object-data');
                    if (objectData) {
                        try {
                            // Parse the stored object data
                            value = JSON.parse(objectData.value);
                        } catch (e) {
                            // Fallback to empty object if parsing fails
                            value = {};
                        }
                    } else {
                        // If no stored data, try to parse the value as JSON
                        try {
                            value = JSON.parse(valueInput);
                        } catch (e) {
                            // Fallback to empty object
                            value = {};
                        }
                    }
                } else {
                    value = convertValueByType(valueInput, type);
                }

                // If a key is provided, create a key-value object
                if (key) {
                    const keyValueObj = {};
                    keyValueObj[key] = value;
                    result.push(keyValueObj);
                } else {
                    // Otherwise just push the value
                    result.push(value);
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

            // Update preview and check for duplicate keys
            updateJsonPreview();
            // Check with a slight delay to ensure DOM is ready
            setTimeout(checkDuplicateKeys, 100);

            alert('JSON successfully imported!');
        } catch (error) {
            alert('Invalid JSON: ' + error.message);
        }
    }

    function buildUIFromJson(json, container) {
        // Check if json is an array (for handling unnamed properties)
        if (Array.isArray(json)) {
            json.forEach(item => {
                const itemType = typeof item;

                if (item === null) {
                    // Add unnamed null property
                    addPropertyWithValues(container, '', 'null', '');
                } else if (Array.isArray(item)) {
                    // Add unnamed array
                    addArrayWithValues(container, '', item);
                } else if (itemType === 'object') {
                    // Check if this is a named property (object with a single key)
                    const keys = Object.keys(item);
                    if (keys.length === 1) {
                        const key = keys[0];
                        const value = item[key];
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
                    } else {
                        // Add unnamed object
                        addNestedObjectWithValues(container, '', item);
                    }
                } else {
                    // Add unnamed property
                    addPropertyWithValues(container, '', itemType, String(item));
                }
            });
        } else {
            // Handle regular object
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
                // Handle nested arrays with proper UI
                const arrayClone = document.importNode(arrayArrayTemplate.content, true);
                const arrayContent = arrayClone.querySelector('.array-array-content');

                // Recursively build nested array items
                item.forEach(nestedItem => {
                    const nestedItemType = typeof nestedItem;

                    if (nestedItem === null) {
                        // Add null value
                        const valueClone = document.importNode(arrayItemTemplate.content, true);
                        const typeSelect = valueClone.querySelector('.item-type');
                        for (let i = 0; i < typeSelect.options.length; i++) {
                            if (typeSelect.options[i].value === 'null') {
                                typeSelect.selectedIndex = i;
                                break;
                            }
                        }
                        arrayContent.appendChild(valueClone);
                    } else if (Array.isArray(nestedItem)) {
                        // Handle nested nested arrays (recursively)
                        const nestedArrayClone = document.importNode(arrayArrayTemplate.content, true);
                        arrayContent.appendChild(nestedArrayClone);
                    } else if (nestedItemType === 'object') {
                        // Add nested object
                        const objectClone = document.importNode(arrayObjectTemplate.content, true);
                        const objectContent = objectClone.querySelector('.array-object-content');
                        buildUIFromJson(nestedItem, objectContent);
                        arrayContent.appendChild(objectClone);
                    } else {
                        // Add primitive value
                        const valueClone = document.importNode(arrayItemTemplate.content, true);
                        const typeSelect = valueClone.querySelector('.item-type');
                        for (let i = 0; i < typeSelect.options.length; i++) {
                            if (typeSelect.options[i].value === nestedItemType) {
                                typeSelect.selectedIndex = i;
                                break;
                            }
                        }
                        valueClone.querySelector('.item-value').value = String(nestedItem);
                        arrayContent.appendChild(valueClone);
                    }
                });

                arrayItems.appendChild(arrayClone);
            } else if (itemType === 'object') {
                // Create a proper object UI for array items
                const objectClone = document.importNode(arrayObjectTemplate.content, true);
                const objectContent = objectClone.querySelector('.array-object-content');

                // Build the object content
                buildUIFromJson(item, objectContent);

                arrayItems.appendChild(objectClone);
            } else {
                // Check if this is a key-value pair (object with a single key)
                if (itemType === 'object' && Object.keys(item).length === 1) {
                    const key = Object.keys(item)[0];
                    const value = item[key];
                    const valueType = typeof value;

                    // Handle primitive values with keys
                    if (valueType !== 'object' || value === null) {
                        const itemClone = document.importNode(arrayItemTemplate.content, true);

                        // Set the key
                        itemClone.querySelector('.item-key').value = key;

                        // Set the type
                        const typeSelect = itemClone.querySelector('.item-type');
                        const typeValue = value === null ? 'null' : valueType;
                        for (let i = 0; i < typeSelect.options.length; i++) {
                            if (typeSelect.options[i].value === typeValue) {
                                typeSelect.selectedIndex = i;
                                break;
                            }
                        }

                        // Set the value
                        itemClone.querySelector('.item-value').value = value === null ? '' : String(value);
                        arrayItems.appendChild(itemClone);
                    } else {
                        // Handle objects with keys
                        const objectClone = document.importNode(arrayObjectTemplate.content, true);
                        const objectContent = objectClone.querySelector('.array-object-content');

                        // Set the key in the input field
                        const objectKeyInput = objectClone.querySelector('.array-object-key');
                        if (objectKeyInput) {
                            objectKeyInput.value = key;
                        }

                        // Build the object content
                        buildUIFromJson(value, objectContent);

                        arrayItems.appendChild(objectClone);
                    }
                } else {
                    // Handle primitive values (string, number, boolean) without keys
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
