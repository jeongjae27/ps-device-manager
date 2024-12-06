// Firebase 초기화
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBvJxmcTKfGPMFfMmP1HdRn6tD8AY8bi-s",
    authDomain: "ps-device-manager.firebaseapp.com",
    databaseURL: "https://ps-device-manager-default-rtdb.firebaseio.com",
    projectId: "ps-device-manager",
    storageBucket: "ps-device-manager.firebasestorage.app",
    messagingSenderId: "570154660486",
    appId: "1:570154660486:web:76fa3402adbf23ee229707"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// DOM Elements
const addMemberInput = document.getElementById('add-member-input');
const addMemberBtn = document.getElementById('add-member-btn');
const memberList = document.getElementById('member-list');
const addDeviceInput = document.getElementById('add-device-input');
const addDeviceBtn = document.getElementById('add-device-btn');
const deviceList = document.getElementById('device-list');

let teamMembers = [];
let devices = [];

// Firebase 데이터 저장
function saveToFirebase(path, data) {
    set(ref(database, path), data)
        .then(() => console.log(`Data saved to ${path} successfully!`))
        .catch((error) => console.error("Error saving data:", error));
}

// Firebase 데이터 불러오기
function loadFromFirebase(path, callback) {
    const dbRef = ref(database, path);
    onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        if (callback) callback(data);
    });
}

// 리스트 렌더링
function renderList(list, data, type) {
    list.innerHTML = '';
    data.forEach((item, index) => {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.textContent = item;

        const editBtn = document.createElement('button');
        editBtn.textContent = '수정';
        editBtn.addEventListener('click', () => {
            const newName = prompt(`${type} 이름 수정`, item);
            if (newName) {
                data[index] = newName.trim();
                saveToFirebase(type === '팀원' ? 'teamMembers' : 'devices', data);
                renderList(list, data, type);
            }
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '삭제';
        deleteBtn.addEventListener('click', () => {
            data.splice(index, 1);
            saveToFirebase(type === '팀원' ? 'teamMembers' : 'devices', data);
            renderList(list, data, type);
        });

        li.appendChild(span);
        li.appendChild(editBtn);
        li.appendChild(deleteBtn);
        list.appendChild(li);
    });
}

// 팀원 추가
addMemberBtn.addEventListener('click', () => {
    const member = addMemberInput.value.trim();
    if (member && !teamMembers.includes(member)) {
        teamMembers.push(member);
        saveToFirebase('teamMembers', teamMembers);
        addMemberInput.value = '';
        renderList(memberList, teamMembers, '팀원');
    }
});

// 단말기 추가
addDeviceBtn.addEventListener('click', () => {
    const device = addDeviceInput.value.trim();
    if (device && !devices.includes(device)) {
        devices.push(device);
        saveToFirebase('devices', devices);
        addDeviceInput.value = '';
        renderList(deviceList, devices, '단말기');
    }
});

// 드래그 앤 드롭 기능
function enableDragAndDrop(list, data, type) {
    list.addEventListener('dragstart', (e) => {
        e.target.classList.add('dragging');
    });

    list.addEventListener('dragend', (e) => {
        e.target.classList.remove('dragging');
        const newOrder = Array.from(list.children).map((li) => li.querySelector('span').textContent);
        data.length = 0;
        data.push(...newOrder);
        saveToFirebase(type === '팀원' ? 'teamMembers' : 'devices', data);
    });

    list.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(list, e.clientY);
        const dragging = document.querySelector('.dragging');
        if (afterElement == null) {
            list.appendChild(dragging);
        } else {
            list.insertBefore(dragging, afterElement);
        }
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Firebase에서 데이터 불러오기 및 초기화
loadFromFirebase('teamMembers', (data) => {
    teamMembers = data || [];
    renderList(memberList, teamMembers, '팀원');
    enableDragAndDrop(memberList, teamMembers, '팀원');
});

loadFromFirebase('devices', (data) => {
    devices = data || [];
    renderList(deviceList, devices, '단말기');
    enableDragAndDrop(deviceList, devices, '단말기');
});
