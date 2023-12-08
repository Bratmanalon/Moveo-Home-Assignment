const socket = io();

const [roomName] = location.search.match(/(?<=room=)\w+/g) || [];

const editorDiv = document.querySelector('.editor');
const countSpan = document.querySelector('.count');
const roleSpan = document.querySelector('.role');
const roomNameSpan = document.querySelector('.room-name');

roomNameSpan.innerText = roomName + ' case';

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
    roleSpan.innerText = role;
    if (role === "student") {
        editorDiv.setAttribute('contenteditable', true);
        observeInnerText(editorDiv, () => socket.emit("code-changed", editorDiv.innerText));
    }
})

socket.on("visitors-count", (count) => {
    countSpan.innerText = count
})

socket.on("code-changed", (code) => {
    editorDiv.innerText = code;
})