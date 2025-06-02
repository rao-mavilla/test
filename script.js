// For code blocks //

window.onload = function() {
    // Find all textareas and iframes
    const codeElements = document.querySelectorAll('.myCode');
    const frameElements = document.querySelectorAll('.outputFrame');

    codeElements.forEach((codeElement, index) => {
    const frame = frameElements[index];
    showOutput(codeElement, frame);
    
    // Add event listener to update iframe dynamically on input
    codeElement.addEventListener('input', () => {
        showOutput(codeElement, frame);
    });
    });
};

function showOutput(codeElement, frame) {
    const code = codeElement.value;

    // Ensure the iframe's document is safely written
    const frameDoc = frame.contentDocument || frame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(`${code}`);
    frameDoc.close();
}





// Generate navigation dynamically
const headings = document.querySelectorAll('h1, h2, h3');
const navList = document.getElementById('navList');
console.log('I am here', navList)
let currentH1List = null;

headings.forEach((heading) => {
    if (!heading.id) {
    heading.id = heading.textContent.trim().toLowerCase().replace(/\s+/g, '-');
    }

    if (heading.tagName === 'H1') {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;
    li.appendChild(link);
    navList.appendChild(li);

    currentH1List = document.createElement('ul');
    li.appendChild(currentH1List);
    } else if (heading.tagName === 'H2' && currentH1List) {
    const li = document.createElement('li');
    li.classList.add('subheading');
    const link = document.createElement('a');
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;
    li.appendChild(link);
    currentH1List.appendChild(li);
    } else if (heading.tagName === 'H3' && currentH1List) {
    const li = document.createElement('li');
    li.classList.add('subsubheading');
    const link = document.createElement('a');
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;
    li.appendChild(link);
    currentH1List.appendChild(li);
    }
});

// Resizable Sidebar Functionality
const sideNav = document.getElementById('sideNav');
const resizer = document.getElementById('resizer');

let isResizing = false;

resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.body.style.cursor = 'ew-resize';
});

document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;

    const newWidth = e.clientX;
    const minWidth = 150; // Minimum width
    const maxWidth = 400; // Maximum width

    if (newWidth >= minWidth && newWidth <= maxWidth) {
    sideNav.style.width = `${newWidth}px`;
    }
});

document.addEventListener('mouseup', () => {
    isResizing = false;
    document.body.style.cursor = 'default';
});




//for textarea height adjustment

function copyCode(codeId) {
    const code = document.getElementById(codeId).value;
    navigator.clipboard.writeText(code).then(() => {
        alert('Code copied to clipboard!');
    });
}

function revealOutput(outputId) {
    const output = document.getElementById(outputId);
    output.classList.remove('hidden');
}

function adjustHeight(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
}

// Initial adjustment for textareas with pre-filled content
document.querySelectorAll('textarea').forEach(textarea => {
    adjustHeight(textarea);
});
