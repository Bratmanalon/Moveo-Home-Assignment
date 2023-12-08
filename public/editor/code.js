const socket = io();

const [roomName] = location.search.match(/(?<=room=)\w+/g) || [];

const editorDiv = document.querySelector('.editor');
const countSpan = document.querySelector('.count');
const roleSpan = document.querySelector('.role');
const roomNameSpan = document.querySelector('.room-name');

roomNameSpan.textContent = roomName + ' case';

socket.emit("join-room", roomName);

function observeInnerText(element, onChange) {
    const ob = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'characterData') {
                onChange();
            }
        }
    })
    ob.observe(element, { characterData: true, subtree: true });
}

socket.on("role", (role) => {
    roleSpan.textContent = role;
    if (role === "student") {
        editorDiv.setAttribute('contenteditable', true);
        observeInnerText(editorDiv, () => {
            socket.emit("code-changed", editorDiv.textContent);
            const cursorPosition = getCaretPosition(editorDiv);
            highlightEditor();
            setCaretPosition(editorDiv, cursorPosition);
        });
    }
})

socket.on("visitors-count", (count) => {
    countSpan.textContent = count
})

socket.on("code-changed", (code) => {
    editorDiv.textContent = code;
    highlightEditor()
})

function highlightEditor() {
    const attributeName = 'data-highlighted';

    if (editorDiv.hasAttribute(attributeName)) {
        editorDiv.removeAttribute(attributeName);
    }

    hljs.highlightElement(editorDiv);
}


// Helper function to get the current cursor position in an element
function getCaretPosition(containerEl) {
    const range = window.getSelection().getRangeAt(0);
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(containerEl);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    return preSelectionRange.toString().length;
}

// Helper function to set the cursor position in an element
function setCaretPosition(containerEl, savedPosition) {
    let charIndex = 0, range = document.createRange();
    range.setStart(containerEl, 0);
    range.collapse(true);

    let nodeStack = [containerEl];
    let node;
    let foundStart = false;

    while (!foundStart && (node = nodeStack.pop())) {
        if (node.nodeType === 3) {
            const nextCharIndex = charIndex + node.length;
            if (!foundStart && savedPosition >= charIndex && savedPosition <= nextCharIndex) {
                range.setStart(node, savedPosition - charIndex);
                foundStart = true;
            }
            charIndex = nextCharIndex;
        } else {
            let i = node.childNodes.length;
            while (i--) {
                nodeStack.push(node.childNodes[i]);
            }
        }
    }

    const sel = window.getSelection();
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
}
