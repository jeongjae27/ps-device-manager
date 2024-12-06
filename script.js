// 상태 관리 변수
let selectedMember = null;
let rentalStatus = {};
let logs = [];
let devices = [];
let teamMembers = [];

// 관리자 페이지 데이터 관리
function loadData() {
    teamMembers = JSON.parse(localStorage.getItem('teamMembers')) || [];
    devices = JSON.parse(localStorage.getItem('devices')) || [];
    rentalStatus = JSON.parse(localStorage.getItem('rentalStatus')) || {};
    logs = JSON.parse(localStorage.getItem('logs')) || [];
}

function saveData() {
    localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
    localStorage.setItem('devices', JSON.stringify(devices));
    localStorage.setItem('rentalStatus', JSON.stringify(rentalStatus));
    localStorage.setItem('logs', JSON.stringify(logs));
}

// DOM Elements
const teamButtonsContainer = document.getElementById('team-buttons');
const deviceButtonsContainer = document.getElementById('device-buttons');
const myDevicesContainer = document.getElementById('my-devices-buttons');
const statusTableBody = document.getElementById('status-table-body');
const logList = document.getElementById('log-list');
const toggleStatusTableBtn = document.getElementById('toggle-status-table-btn');
const statusTableContainer = document.getElementById('status-table-container');

// 초기화 함수
function init() {
    loadData();

    if (teamMembers.length === 0 || devices.length === 0) {
        alert('관리자 페이지에서 팀원과 단말기를 등록해주세요.');
        return;
    }

    // 초기 상태 설정
    teamButtonsContainer.innerHTML = '';
    teamMembers.forEach(member => {
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

    // 단말기 섹션 표시
    document.getElementById('device-section').style.display = 'block';

    // 선택된 팀원 버튼 강조
    Array.from(teamButtonsContainer.children).forEach(button => {
        button.classList.remove('active');
        if (button.textContent === member) button.classList.add('active');
    });

    // 내 보유 단말기 및 단말기 버튼 업데이트
    updateMyDevices();
    updateDeviceButtons();
}

// 단말기 버튼 업데이트
function updateDeviceButtons() {
    deviceButtonsContainer.innerHTML = '';
    devices.forEach(device => {
        const isRented = Object.values(rentalStatus).some(memberDevices => memberDevices.includes(device));
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
        myDevices.forEach(device => {
            const button = document.createElement('button');
            button.textContent = device;

            // 'X' 버튼 추가
            const closeButton = document.createElement('span');
            closeButton.textContent = 'X';
            closeButton.addEventListener('click', (e) => {
                e.stopPropagation(); // 부모 버튼 클릭 이벤트 방지
                returnDevice(device); // 반납 처리
            });

            button.appendChild(closeButton);
            button.addEventListener('click', () => returnDevice(device)); // 반납 버튼 동작
            myDevicesContainer.appendChild(button);
        });
    }
}

// 단말기 대여
function rentDevice(device) {
    if (!selectedMember) return;
    rentalStatus[selectedMember].push(device);
    addLog(`${selectedMember}이(가) ${device} 대여`);
    saveData(); // 데이터 저장
    updateDeviceButtons();
    updateMyDevices();
    updateTable();
}

// 단말기 반납
function returnDevice(device) {
    if (!selectedMember) return;
    rentalStatus[selectedMember] = rentalStatus[selectedMember].filter(d => d !== device);
    addLog(`${selectedMember}이(가) ${device} 반납`);
    saveData(); // 데이터 저장
    updateDeviceButtons();
    updateMyDevices();
    updateTable();
}

// 대여 현황 테이블 업데이트
function updateTable() {
    const tableHead = document.querySelector('#status-table thead tr');
    tableHead.innerHTML = '<th>팀원</th>';
    devices.forEach(device => {
        const th = document.createElement('th');
        th.textContent = device;
        tableHead.appendChild(th);
    });

    statusTableBody.innerHTML = '';
    teamMembers.forEach(member => {
        const row = document.createElement('tr');
        const nameCell = document.createElement('td');
        nameCell.textContent = member;
        row.appendChild(nameCell);

        devices.forEach(device => {
            const cell = document.createElement('td');
            cell.textContent = rentalStatus[member].includes(device) ? '🟢' : ' ';
            row.appendChild(cell);
        });

        statusTableBody.appendChild(row);
    });

    saveData(); // 데이터 저장
}

// 로그 추가
function addLog(message) {
    const today = new Date();
    const date = `${today.getFullYear() % 100}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getDate().toString().padStart(2, '0')}`;
    logs.unshift(`[${date}] ${message}`); // 최신 로그를 배열의 앞쪽에 추가
    if (logs.length > 30) logs.pop(); // 최대 30개의 로그만 유지
    updateLogs();
    saveData(); // 데이터 저장
}

// 로그 업데이트
function updateLogs() {
    logList.innerHTML = '';
    logs.forEach(log => {
        const li = document.createElement('li');
        li.textContent = log;
        logList.appendChild(li);
    });
}

// 대여 현황 테이블 펼치기/접기
toggleStatusTableBtn.addEventListener('click', () => {
    const isHidden = statusTableContainer.style.maxHeight === '0px';
    statusTableContainer.style.maxHeight = isHidden ? '800px' : '0px';
    toggleStatusTableBtn.textContent = isHidden ? '접기 >' : '펼치기 >';
});

// 초기화 실행
init();
