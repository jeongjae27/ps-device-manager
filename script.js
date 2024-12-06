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

// 상태 관리 변수
let selectedMember = null;
let rentalStatus = {};
let logs = [];
let devices = [];
let teamMembers = [];

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

// DOM Elements
const teamButtonsContainer = document.getElementById('team-buttons');
const deviceButtonsContainer = document.getElementById('device-buttons');
const myDevicesContainer = document.getElementById('my-devices-buttons');
const statusTableBody = document.getElementById('status-table-body');
const logList = document.getElementById('log-list');
const toggleStatusTableBtn = document.getElementById('toggle-status-table-btn');
const statusTableContainer = document.getElementById('status-table-container');

// 데이터 로드 후 초기화
function loadDataAndInitialize() {
    let membersLoaded = false;
    let devicesLoaded = false;
    let rentalStatusLoaded = false;
    let logsLoaded = false;

    loadFromFirebase("teamMembers", (data) => {
        teamMembers = data || [];
        membersLoaded = true;
        if (membersLoaded && devicesLoaded && rentalStatusLoaded && logsLoaded) init();
    });

    loadFromFirebase("devices", (data) => {
        devices = data || [];
        devicesLoaded = true;
        if (membersLoaded && devicesLoaded && rentalStatusLoaded && logsLoaded) init();
    });

    loadFromFirebase("rentalStatus", (data) => {
        rentalStatus = data || {};
        rentalStatusLoaded = true;
        if (membersLoaded && devicesLoaded && rentalStatusLoaded && logsLoaded) init();
    });

    loadFromFirebase("logs", (data) => {
        logs = data || [];
        logsLoaded = true;
        if (membersLoaded && devicesLoaded && rentalStatusLoaded && logsLoaded) init();
    });
}

// 초기화 함수
function init() {
    if (teamMembers.length === 0 || devices.length === 0) {
        console.warn('관리자 페이지에서 팀원과 단말기를 등록해주세요.');
        return;
    }

    teamButtonsContainer.innerHTML = '';
    teamMembers.forEach((member) => {
        rentalStatus[member] = rentalStatus[member] || [];
        const button = document.createElement('button');
        button.textContent = member;
        button.addEventListener('click', () => selectTeamMember(member));
        teamButtonsContainer.appendChild(button);
    });

    updateDeviceButtons();
    updateTable();
    updateLogs();
}

// 팀원 선택
function selectTeamMember(member) {
    selectedMember = member;

    document.getElementById('device-section').style.display = 'block';

    Array.from(teamButtonsContainer.children).forEach((button) => {
        button.classList.remove('active');
        if (button.textContent === member) button.classList.add('active');
    });

    updateMyDevices();
    updateDeviceButtons();
}

// 단말기 버튼 업데이트
function updateDeviceButtons() {
    deviceButtonsContainer.innerHTML = '';
    devices.forEach((device) => {
        const isRented = Object.values(rentalStatus).some((memberDevices) =>
            memberDevices.includes(device)
        );
        const button = document.createElement('button');
        button.textContent = device;
        button.disabled = isRented;
        button.addEventListener('click', () => rentDevice(device));
        deviceButtonsContainer.appendChild(button);
    });
}

// 내 보유 단말기 버튼 업데이트
function updateMyDevices() {
    myDevicesContainer.innerHTML = '';
    const myDevices = rentalStatus[selectedMember] || [];
    if (myDevices.length === 0) {
        document.getElementById('my-devices-section').style.display = 'none';
    } else {
        document.getElementById('my-devices-section').style.display = 'block';
        myDevices.forEach((device) => {
            const button = document.createElement('button');
            button.textContent = device;

            const closeButton = document.createElement('span');
            closeButton.textContent = 'X';
            closeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                returnDevice(device);
            });

            button.appendChild(closeButton);
            button.addEventListener('click', () => returnDevice(device));
            myDevicesContainer.appendChild(button);
        });
    }
}

// 단말기 대여
function rentDevice(device) {
    if (!selectedMember) return;
    rentalStatus[selectedMember].push(device);

    saveToFirebase("rentalStatus", rentalStatus);

    addLog(`${selectedMember}이(가) ${device} 대여`);
    updateDeviceButtons();
    updateMyDevices();
    updateTable();
}

// 단말기 반납
function returnDevice(device) {
    if (!selectedMember) return;
    rentalStatus[selectedMember] = rentalStatus[selectedMember].filter((d) => d !== device);

    saveToFirebase("rentalStatus", rentalStatus);

    addLog(`${selectedMember}이(가) ${device} 반납`);
    updateDeviceButtons();
    updateMyDevices();
    updateTable();
}

// 대여 현황 테이블 업데이트
function updateTable() {
    const tableHead = document.querySelector('#status-table thead tr');
    tableHead.innerHTML = '<th>팀원</th>';
    devices.forEach((device) => {
        const th = document.createElement('th');
        th.textContent = device;
        tableHead.appendChild(th);
    });

    statusTableBody.innerHTML = '';
    teamMembers.forEach((member) => {
        const row = document.createElement('tr');
        const nameCell = document.createElement('td');
        nameCell.textContent = member;
        row.appendChild(nameCell);

        devices.forEach((device) => {
            const cell = document.createElement('td');
            cell.textContent = rentalStatus[member]?.includes(device) ? '🟢' : ' ';
            row.appendChild(cell);
        });

        statusTableBody.appendChild(row);
    });

    statusTableContainer.style.maxHeight = '800px';
    statusTableContainer.style.overflow = 'auto';
}

// 로그 추가
function addLog(message) {
    const today = new Date();
    const date = `${today.getFullYear() % 100}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getDate().toString().padStart(2, '0')}`;
    logs.unshift(`[${date}] ${message}`);
    if (logs.length > 30) logs.pop();

    saveToFirebase("logs", logs);

    updateLogs();
}

// 로그 업데이트
function updateLogs() {
    logList.innerHTML = '';
    logs.forEach((log) => {
        const li = document.createElement('li');
        li.textContent = log;
        logList.appendChild(li);
    });
}

// 대여 현황 테이블 펼치기/접기
toggleStatusTableBtn?.addEventListener('click', () => {
    const isHidden = !statusTableContainer.classList.contains('open');

    if (isHidden) {
        statusTableContainer.classList.add('open');
        toggleStatusTableBtn.textContent = '접기 >';
    } else {
        statusTableContainer.classList.remove('open');
        toggleStatusTableBtn.textContent = '펼치기 >';
    }
});

window.onload = loadDataAndInitialize;
