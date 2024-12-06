// 관리자 페이지 데이터 관리
const addMemberInput = document.getElementById('add-member-input');
const addMemberBtn = document.getElementById('add-member-btn');
const memberList = document.getElementById('member-list');
const addDeviceInput = document.getElementById('add-device-input');
const addDeviceBtn = document.getElementById('add-device-btn');
const deviceList = document.getElementById('device-list');

let teamMembers = JSON.parse(localStorage.getItem('teamMembers')) || [];
let devices = JSON.parse(localStorage.getItem('devices')) || [];

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
                localStorage.setItem(type === '팀원' ? 'teamMembers' : 'devices', JSON.stringify(data));
                renderList(list, data, type);
            }
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '삭제';
        deleteBtn.addEventListener('click', () => {
            data.splice(index, 1);
            localStorage.setItem(type === '팀원' ? 'teamMembers' : 'devices', JSON.stringify(data));
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
        localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
        addMemberInput.value = '';
        renderList(memberList, teamMembers, '팀원');
    }
});

// 단말기 추가
addDeviceBtn.addEventListener('click', () => {
    const device = addDeviceInput.value.trim();
    if (device && !devices.includes(device)) {
        devices.push(device);
        localStorage.setItem('devices', JSON.stringify(devices));
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
        localStorage.setItem(type === '팀원' ? 'teamMembers' : 'devices', JSON.stringify(data));
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

// 초기화
renderList(memberList, teamMembers, '팀원');
renderList(deviceList, devices, '단말기');
enableDragAndDrop(memberList, teamMembers, '팀원');
enableDragAndDrop(deviceList, devices, '단말기');

