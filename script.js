// Veri Yönetimi
const DataManager = {
    STORAGE_KEY: 'vardiya_programi_data',
    
    // Verileri localStorage'dan yükle
    loadData() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.error('Veri yükleme hatası:', e);
                return this.getDefaultData();
            }
        }
        return this.getDefaultData();
    },
    
    // Verileri localStorage'a kaydet
    saveData(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Veri kaydetme hatası:', e);
            return false;
        }
    },
    
    // Varsayılan veri yapısı
    getDefaultData() {
        return {
            teams: [],
            schedules: {} // { teamId: { date: { personId: shift } } }
        };
    },
    
    // URL'den veri yükle
    loadFromURL() {
        const params = new URLSearchParams(window.location.search);
        const dataParam = params.get('data');
        if (dataParam) {
            try {
                const decoded = decodeURIComponent(dataParam);
                const data = JSON.parse(atob(decoded));
                return data;
            } catch (e) {
                console.error('URL veri yükleme hatası:', e);
                return null;
            }
        }
        return null;
    },
    
    // Veriyi URL'e encode et
    encodeToURL(data) {
        try {
            const json = JSON.stringify(data);
            const encoded = btoa(json);
            return encodeURIComponent(encoded);
        } catch (e) {
            console.error('URL encode hatası:', e);
            return null;
        }
    },
    
    // Paylaşılabilir URL oluştur
    createShareableURL(data) {
        const encoded = this.encodeToURL(data);
        if (encoded) {
            const baseURL = window.location.origin + window.location.pathname;
            return `${baseURL}?data=${encoded}`;
        }
        return null;
    },
    
    // Veriyi JSON olarak export et
    exportToJSON(data) {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vardiya_programi_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
    
    // JSON dosyasından import et
    importFromJSON(file, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                callback(data);
            } catch (err) {
                alert('Geçersiz JSON dosyası!');
                console.error('Import hatası:', err);
            }
        };
        reader.readAsText(file);
    }
};

// Tarih yardımcı fonksiyonları
const DateHelper = {
    // Tarih formatı: YYYY-MM-DD
    formatDate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    // Tarih string'ini Date objesine çevir
    parseDate(dateString) {
        return new Date(dateString + 'T00:00:00');
    },
    
    // İki tarih arasındaki tüm günleri döndür
    getDaysBetween(startDate, endDate) {
        const days = [];
        const start = this.parseDate(startDate);
        const end = this.parseDate(endDate);
        const current = new Date(start);
        
        while (current <= end) {
            days.push(this.formatDate(current));
            current.setDate(current.getDate() + 1);
        }
        
        return days;
    },
    
    // Tarihin haftanın hangi günü olduğunu döndür (0=Pazar, 1=Pazartesi, ...)
    getDayOfWeek(dateString) {
        const date = this.parseDate(dateString);
        return date.getDay();
    },
    
    // Tarihin hangi haftada olduğunu döndür (hafta başlangıcı Pazartesi)
    // ISO 8601 standardına göre: Pazartesi haftanın ilk günü
    getWeekNumber(dateString) {
        const date = this.parseDate(dateString);
        const dayOfWeek = date.getDay(); // 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
        const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 1)) / (24 * 60 * 60 * 1000)) + 1;
        
        // Pazartesi'yi haftanın ilk günü yap (ISO 8601)
        const weekDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Pazar=7, Pazartesi=1, ..., Cumartesi=6
        
        // Yılın ilk Pazartesi'sini bul
        const jan1 = new Date(date.getFullYear(), 0, 1);
        const jan1Day = jan1.getDay();
        const daysToFirstMonday = jan1Day === 0 ? 1 : (8 - jan1Day); // İlk Pazartesi'ye kadar gün sayısı
        
        // Hafta numarasını hesapla
        const weekNumber = Math.ceil((dayOfYear - daysToFirstMonday + weekDay) / 7);
        return weekNumber > 0 ? weekNumber : 53; // Yılın ilk günleri için
    },
    
    // Seçilen tarih aralığındaki hafta numarasını döndür (başlangıç tarihine göre)
    getWeekNumberInRange(dateString, rangeStartDate) {
        const date = this.parseDate(dateString);
        const rangeStart = this.parseDate(rangeStartDate);
        
        // Range başlangıcının hangi günü olduğunu bul (Pazartesi=1, Pazar=7)
        const rangeStartDay = rangeStart.getDay();
        const daysToMonday = rangeStartDay === 0 ? 6 : rangeStartDay - 1; // Pazartesi'ye kadar gün sayısı
        
        // Range'in ilk Pazartesi'sini bul
        const firstMonday = new Date(rangeStart);
        firstMonday.setDate(rangeStart.getDate() - daysToMonday);
        firstMonday.setHours(0, 0, 0, 0); // Saat bilgisini sıfırla
        
        // Tarihi de normalize et
        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);
        
        // Tarihin ilk Pazartesi'den kaç gün sonra olduğunu hesapla
        const daysDiff = Math.floor((normalizedDate - firstMonday) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.floor(daysDiff / 7) + 1;
        
        // Negatif veya 0 değerleri için 1 döndür
        return weekNumber > 0 ? weekNumber : 1;
    },
    
    // Tarihin hangi ay ve yılda olduğunu döndür
    getMonthYear(dateString) {
        const date = this.parseDate(dateString);
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1
        };
    },
    
    // Türkçe gün isimleri
    getDayName(dateString) {
        const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        return days[this.getDayOfWeek(dateString)];
    },
    
    // Türkçe ay isimleri
    getMonthName(month) {
        const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                       'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        return months[month - 1];
    }
};

// Ana uygulama state
let appState = {
    currentTeamId: null,
    viewType: 'weekly', // 'weekly' veya 'monthly'
    startDate: null,
    endDate: null,
    data: null
};

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // URL'den veri yüklemeyi dene
    const urlData = DataManager.loadFromURL();
    if (urlData) {
        appState.data = urlData;
        DataManager.saveData(urlData);
    } else {
        appState.data = DataManager.loadData();
    }
    
    // Bugünün tarihini varsayılan olarak ayarla (hidden input'lar için)
    const today = DateHelper.formatDate(new Date());
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 6); // 7 günlük varsayılan
    document.getElementById('startDate').value = today;
    document.getElementById('endDate').value = DateHelper.formatDate(endDate);
    appState.startDate = today;
    appState.endDate = DateHelper.formatDate(endDate);
    
    // Event listener'ları ekle
    setupEventListeners();
    
    // UI'ı güncelle
    updateUI();
}

function setupEventListeners() {
    // Takım yönetimi
    document.getElementById('newTeamBtn').addEventListener('click', showNewTeamForm);
    document.getElementById('saveTeamBtn').addEventListener('click', saveTeam);
    document.getElementById('cancelTeamBtn').addEventListener('click', hideTeamForm);
    document.getElementById('deleteTeamBtn').addEventListener('click', deleteCurrentTeam);
    document.getElementById('teamSelect').addEventListener('change', onTeamSelect);
    
    // Kişi yönetimi
    document.getElementById('addPersonBtn').addEventListener('click', addPerson);
    
    // Görünüm değiştirme
    document.querySelectorAll('input[name="viewType"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            appState.viewType = e.target.value;
            updateDateSelectorVisibility();
        });
    });
    
    // Başlangıç görünümünü ayarla
    const checkedView = document.querySelector('input[name="viewType"]:checked');
    if (checkedView) {
        appState.viewType = checkedView.value;
    }
    
    // Haftalık ay seçici değişikliği
    document.getElementById('weeklyMonthSelect').addEventListener('change', (e) => {
        const monthYear = e.target.value;
        if (monthYear) {
            updateWeeklyWeeks(monthYear);
        }
    });
    
    // Hafta seçici değişikliği
    document.getElementById('weekSelect').addEventListener('change', (e) => {
        updateWeeklyDates();
    });
    
    // Aylık ay seçici değişikliği
    document.getElementById('monthSelect').addEventListener('change', (e) => {
        const monthYear = e.target.value; // YYYY-MM formatında
        if (monthYear) {
            const [year, month] = monthYear.split('-');
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0); // Ayın son günü
            
            document.getElementById('startDate').value = DateHelper.formatDate(startDate);
            document.getElementById('endDate').value = DateHelper.formatDate(endDate);
            appState.startDate = DateHelper.formatDate(startDate);
            appState.endDate = DateHelper.formatDate(endDate);
            
            if (appState.currentTeamId) {
                updateScheduleDisplay();
            }
        }
    });
    
    // İlk yüklemede görünürlüğü ayarla
    updateDateSelectorVisibility();
    
    // Aksiyon butonları
    document.getElementById('generateBtn').addEventListener('click', generateSchedule);
    document.getElementById('clearBtn').addEventListener('click', clearSchedule);
    document.getElementById('shareBtn').addEventListener('click', shareSchedule);
    document.getElementById('exportBtn').addEventListener('click', exportSchedule);
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            DataManager.importFromJSON(e.target.files[0], (data) => {
                appState.data = data;
                DataManager.saveData(data);
                updateUI();
                alert('Veriler başarıyla yüklendi!');
            });
        }
    });
    
    // Modal
    const modal = document.getElementById('shiftModal');
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        modal.classList.remove('show');
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
    });
    
    // Vardiya seçim butonları
    document.querySelectorAll('.shift-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const shift = e.target.dataset.shift;
            assignShift(shift);
            modal.style.display = 'none';
            modal.classList.remove('show');
        });
    });
}

// Takım yönetimi fonksiyonları
function showNewTeamForm() {
    document.getElementById('teamForm').style.display = 'flex';
    document.getElementById('teamNameInput').focus();
}

function hideTeamForm() {
    document.getElementById('teamForm').style.display = 'none';
    document.getElementById('teamNameInput').value = '';
}

function saveTeam() {
    const teamName = document.getElementById('teamNameInput').value.trim();
    if (!teamName) {
        alert('Lütfen takım adı girin!');
        return;
    }
    
    const teamId = 'team_' + Date.now();
    const newTeam = {
        id: teamId,
        name: teamName,
        persons: []
    };
    
    appState.data.teams.push(newTeam);
    DataManager.saveData(appState.data);
    
    hideTeamForm();
    updateUI();
    
    // Yeni takımı seç
    document.getElementById('teamSelect').value = teamId;
    onTeamSelect();
}

function deleteCurrentTeam() {
    if (!appState.currentTeamId) return;
    
    if (!confirm('Bu takımı silmek istediğinizden emin misiniz? Tüm veriler silinecektir.')) {
        return;
    }
    
    appState.data.teams = appState.data.teams.filter(t => t.id !== appState.currentTeamId);
    
    // Takımın programını da sil
    if (appState.data.schedules[appState.currentTeamId]) {
        delete appState.data.schedules[appState.currentTeamId];
    }
    
    DataManager.saveData(appState.data);
    appState.currentTeamId = null;
    updateUI();
}

function onTeamSelect() {
    const teamId = document.getElementById('teamSelect').value;
    if (teamId) {
        appState.currentTeamId = teamId;
        document.getElementById('deleteTeamBtn').style.display = 'inline-block';
        document.getElementById('personManagement').style.display = 'block';
        updatePersonList();
        updateScheduleDisplay();
    } else {
        appState.currentTeamId = null;
        document.getElementById('deleteTeamBtn').style.display = 'none';
        document.getElementById('personManagement').style.display = 'none';
        document.getElementById('scheduleContainer').innerHTML = '<p class="no-team-message">Lütfen bir takım seçin veya oluşturun.</p>';
    }
}

function addPerson() {
    if (!appState.currentTeamId) {
        alert('Lütfen önce bir takım seçin!');
        return;
    }
    
    const personName = document.getElementById('personNameInput').value.trim();
    if (!personName) {
        alert('Lütfen kişi adı girin!');
        return;
    }
    
    const team = appState.data.teams.find(t => t.id === appState.currentTeamId);
    if (team.persons.some(p => p.name === personName)) {
        alert('Bu kişi zaten eklenmiş!');
        return;
    }
    
    const personId = 'person_' + Date.now();
    team.persons.push({
        id: personId,
        name: personName
    });
    
    DataManager.saveData(appState.data);
    document.getElementById('personNameInput').value = '';
    updatePersonList();
}

function deletePerson(personId) {
    if (!confirm('Bu kişiyi silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    const team = appState.data.teams.find(t => t.id === appState.currentTeamId);
    team.persons = team.persons.filter(p => p.id !== personId);
    
    // Kişinin programını da sil
    if (appState.data.schedules[appState.currentTeamId]) {
        const schedule = appState.data.schedules[appState.currentTeamId];
        Object.keys(schedule).forEach(date => {
            if (schedule[date][personId]) {
                delete schedule[date][personId];
            }
        });
    }
    
    DataManager.saveData(appState.data);
    updatePersonList();
    updateScheduleDisplay();
}

function updatePersonList() {
    if (!appState.currentTeamId) return;
    
    const team = appState.data.teams.find(t => t.id === appState.currentTeamId);
    const personList = document.getElementById('personList');
    
    personList.innerHTML = '';
    
    if (team && team.persons.length > 0) {
        team.persons.forEach(person => {
            const li = document.createElement('li');
            li.className = 'person-item';
            li.innerHTML = `
                <span>${person.name}</span>
                <button class="btn btn-danger" onclick="deletePerson('${person.id}')">Sil</button>
            `;
            personList.appendChild(li);
        });
    } else {
        personList.innerHTML = '<li style="color: #999; padding: 10px;">Henüz kişi eklenmemiş.</li>';
    }
}

function updateUI() {
    // Takım listesini güncelle
    const teamSelect = document.getElementById('teamSelect');
    teamSelect.innerHTML = '<option value="">Yeni Takım Oluştur</option>';
    
    appState.data.teams.forEach(team => {
        const option = document.createElement('option');
        option.value = team.id;
        option.textContent = team.name;
        teamSelect.appendChild(option);
    });
    
    // Mevcut takımı seçili tut
    if (appState.currentTeamId) {
        teamSelect.value = appState.currentTeamId;
        onTeamSelect();
    }
}

// Haftalık görünüm için haftaları güncelle
function updateWeeklyWeeks(monthYear) {
    if (!monthYear) {
        const today = new Date();
        monthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        document.getElementById('weeklyMonthSelect').value = monthYear;
    }
    
    const [year, month] = monthYear.split('-');
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    
    // Ayın ilk haftasını bul (Pazartesi başlangıcı)
    const firstMonday = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    firstMonday.setDate(firstDay.getDate() - daysToMonday);
    
    // Haftaları hesapla
    const weeks = [];
    let currentWeekStart = new Date(firstMonday);
    
    while (currentWeekStart <= lastDay) {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        // Ayın içindeki haftaları al
        const weekStartInMonth = currentWeekStart < firstDay ? firstDay : currentWeekStart;
        const weekEndInMonth = weekEnd > lastDay ? lastDay : weekEnd;
        
        if (weekStartInMonth <= lastDay) {
            weeks.push({
                start: weekStartInMonth,
                end: weekEndInMonth,
                label: `${DateHelper.formatDate(weekStartInMonth)} - ${DateHelper.formatDate(weekEndInMonth)}`
            });
        }
        
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    // Hafta seçiciyi güncelle
    const weekSelect = document.getElementById('weekSelect');
    weekSelect.innerHTML = '<option value="">Tüm Haftalar</option>';
    weeks.forEach((week, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `Hafta ${index + 1}: ${week.label}`;
        weekSelect.appendChild(option);
    });
    
    // İlk haftayı seç
    if (weeks.length > 0) {
        weekSelect.value = '0';
    }
    
    updateWeeklyDates();
}

// Haftalık görünüm için tarihleri güncelle
function updateWeeklyDates() {
    const monthYear = document.getElementById('weeklyMonthSelect').value;
    const weekIndex = document.getElementById('weekSelect').value;
    
    if (!monthYear) return;
    
    const [year, month] = monthYear.split('-');
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    
    // Ayın ilk haftasını bul
    const firstMonday = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    firstMonday.setDate(firstDay.getDate() - daysToMonday);
    
    let startDate, endDate;
    
    if (weekIndex === '' || weekIndex === null) {
        // Tüm haftalar - ayın tamamı
        startDate = firstDay;
        endDate = lastDay;
    } else {
        // Seçili hafta
        const weekNum = parseInt(weekIndex);
        const weekStart = new Date(firstMonday);
        weekStart.setDate(weekStart.getDate() + (weekNum * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        startDate = weekStart < firstDay ? firstDay : weekStart;
        endDate = weekEnd > lastDay ? lastDay : weekEnd;
    }
    
    document.getElementById('startDate').value = DateHelper.formatDate(startDate);
    document.getElementById('endDate').value = DateHelper.formatDate(endDate);
    appState.startDate = DateHelper.formatDate(startDate);
    appState.endDate = DateHelper.formatDate(endDate);
    
    if (appState.currentTeamId) {
        updateScheduleDisplay();
    }
}

// Tarih seçici görünürlüğünü güncelle
function updateDateSelectorVisibility() {
    const weeklySelector = document.getElementById('weeklyDateSelector');
    const monthlySelector = document.getElementById('monthlyDateSelector');
    
    if (appState.viewType === 'monthly') {
        weeklySelector.style.display = 'none';
        monthlySelector.style.display = 'flex';
        
        // Eğer ay seçici boşsa, bugünün ayını ayarla
        const monthSelect = document.getElementById('monthSelect');
        if (!monthSelect.value) {
            const today = new Date();
            const monthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
            monthSelect.value = monthYear;
        }
        
        // Tarihleri ay seçiciden ayarla
        const monthYear = monthSelect.value;
        if (monthYear) {
            const [year, month] = monthYear.split('-');
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0); // Ayın son günü
            
            document.getElementById('startDate').value = DateHelper.formatDate(startDate);
            document.getElementById('endDate').value = DateHelper.formatDate(endDate);
            appState.startDate = DateHelper.formatDate(startDate);
            appState.endDate = DateHelper.formatDate(endDate);
            
            if (appState.currentTeamId) {
                updateScheduleDisplay();
            }
        }
    } else {
        weeklySelector.style.display = 'flex';
        monthlySelector.style.display = 'none';
        
        // Haftalık görünüm için haftaları güncelle
        const weeklyMonthSelect = document.getElementById('weeklyMonthSelect');
        if (!weeklyMonthSelect.value) {
            const today = new Date();
            const monthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
            weeklyMonthSelect.value = monthYear;
        }
        updateWeeklyWeeks(weeklyMonthSelect.value);
    }
}

// Program görüntüleme fonksiyonları
function updateScheduleDisplay() {
    if (!appState.currentTeamId) {
        document.getElementById('scheduleContainer').innerHTML = '<p class="no-team-message">Lütfen bir takım seçin veya oluşturun.</p>';
        return;
    }
    
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        document.getElementById('scheduleContainer').innerHTML = '<p class="no-team-message">Lütfen başlangıç ve bitiş tarihlerini seçin.</p>';
        return;
    }
    
    if (appState.viewType === 'weekly') {
        renderWeeklyView(startDate, endDate);
    } else {
        renderMonthlyView(startDate, endDate);
    }
}

function renderWeeklyView(startDate, endDate) {
    const days = DateHelper.getDaysBetween(startDate, endDate);
    const team = appState.data.teams.find(t => t.id === appState.currentTeamId);
    
    if (!team || team.persons.length === 0) {
        document.getElementById('scheduleContainer').innerHTML = '<p class="no-team-message">Lütfen takıma kişi ekleyin.</p>';
        return;
    }
    
    let html = '<table class="schedule-table"><thead><tr><th>Kişi</th>';
    
    days.forEach(day => {
        const dayName = DateHelper.getDayName(day);
        html += `<th>${dayName}<br><small>${day}</small></th>`;
    });
    
    html += '</tr></thead><tbody>';
    
    team.persons.forEach(person => {
        html += `<tr><td>${person.name}</td>`;
        days.forEach(day => {
            const shift = getShift(appState.currentTeamId, day, person.id);
            const shiftClass = getShiftClass(shift);
            html += `<td class="schedule-cell ${shiftClass}" data-date="${day}" data-person="${person.id}">${shift || ''}</td>`;
        });
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    
    document.getElementById('scheduleContainer').innerHTML = html;
    
    // Hücre tıklama event'lerini ekle
    document.querySelectorAll('.schedule-cell').forEach(cell => {
        cell.addEventListener('click', (e) => {
            openShiftModal(e.target);
        });
    });
}

function renderMonthlyView(startDate, endDate) {
    const days = DateHelper.getDaysBetween(startDate, endDate);
    const team = appState.data.teams.find(t => t.id === appState.currentTeamId);
    
    if (!team || team.persons.length === 0) {
        document.getElementById('scheduleContainer').innerHTML = '<p class="no-team-message">Lütfen takıma kişi ekleyin.</p>';
        return;
    }
    
    // Günleri haftalara grupla
    const weeks = [];
    let currentWeek = [];
    
    days.forEach((day, index) => {
        const dayOfWeek = DateHelper.getDayOfWeek(day);
        currentWeek.push(day);
        
        if (dayOfWeek === 6 || index === days.length - 1) { // Cumartesi veya son gün
            weeks.push([...currentWeek]);
            currentWeek = [];
        }
    });
    
    let html = '';
    
    weeks.forEach((week, weekIndex) => {
        html += `<h3 style="margin-top: 20px;">Hafta ${weekIndex + 1}</h3>`;
        html += '<table class="schedule-table"><thead><tr><th>Kişi</th>';
        
        week.forEach(day => {
            const dayName = DateHelper.getDayName(day);
            html += `<th>${dayName}<br><small>${day}</small></th>`;
        });
        
        html += '</tr></thead><tbody>';
        
        team.persons.forEach(person => {
            html += `<tr><td>${person.name}</td>`;
            week.forEach(day => {
                const shift = getShift(appState.currentTeamId, day, person.id);
                const shiftClass = getShiftClass(shift);
                html += `<td class="schedule-cell ${shiftClass}" data-date="${day}" data-person="${person.id}">${shift || ''}</td>`;
            });
            html += '</tr>';
        });
        
        html += '</tbody></table>';
    });
    
    document.getElementById('scheduleContainer').innerHTML = html;
    
    // Hücre tıklama event'lerini ekle
    document.querySelectorAll('.schedule-cell').forEach(cell => {
        cell.addEventListener('click', (e) => {
            openShiftModal(e.target);
        });
    });
}

function getShift(teamId, date, personId) {
    if (!appState.data.schedules[teamId] || !appState.data.schedules[teamId][date]) {
        return null;
    }
    return appState.data.schedules[teamId][date][personId] || null;
}

function setShift(teamId, date, personId, shift) {
    if (!appState.data.schedules[teamId]) {
        appState.data.schedules[teamId] = {};
    }
    if (!appState.data.schedules[teamId][date]) {
        appState.data.schedules[teamId][date] = {};
    }
    
    if (shift) {
        appState.data.schedules[teamId][date][personId] = shift;
    } else {
        delete appState.data.schedules[teamId][date][personId];
    }
    
    DataManager.saveData(appState.data);
}

function getShiftClass(shift) {
    if (!shift) return '';
    
    const shiftMap = {
        '918': 'shift-918',
        '1322': 'shift-1322',
        '1500': 'shift-1500',
        'Off': 'shift-off',
        'Rapor': 'shift-rapor',
        'Yıllık İzin': 'shift-yillik',
        'Ücretsiz İzin': 'shift-ucretsiz'
    };
    
    return shiftMap[shift] || '';
}

let currentCell = null;

function openShiftModal(cell) {
    currentCell = cell;
    const modal = document.getElementById('shiftModal');
    
    // Önceki günün vardiyasını kontrol et
    const date = cell.dataset.date;
    const personId = cell.dataset.person;
    const dateObj = DateHelper.parseDate(date);
    const prevDate = new Date(dateObj);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = DateHelper.formatDate(prevDate);
    const prevShift = getShift(appState.currentTeamId, prevDateStr, personId);
    
    // 1500'den sonra 918 seçilemesin - butonu devre dışı bırak
    const shift918Btn = modal.querySelector('.shift-btn[data-shift="918"]');
    if (prevShift === '1500') {
        shift918Btn.disabled = true;
        shift918Btn.style.opacity = '0.5';
        shift918Btn.style.cursor = 'not-allowed';
        shift918Btn.title = '1500 vardiyasından sonra 918 seçilemez';
    } else {
        shift918Btn.disabled = false;
        shift918Btn.style.opacity = '1';
        shift918Btn.style.cursor = 'pointer';
        shift918Btn.title = '';
    }
    
    // Haftalık off kontrolü - eğer bu hafta zaten 1 gün off varsa Off butonunu devre dışı bırak
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const weekNumber = DateHelper.getWeekNumberInRange(date, startDate);
    const days = DateHelper.getDaysBetween(startDate, endDate);
    
    // Bu haftadaki off günlerini say (bugün hariç)
    let weeklyOffCount = 0;
    const currentShift = getShift(appState.currentTeamId, date, personId);
    
    days.forEach(day => {
        const dayWeekNumber = DateHelper.getWeekNumberInRange(day, startDate);
        if (dayWeekNumber === weekNumber && day !== date) {
            const dayShift = getShift(appState.currentTeamId, day, personId);
            if (dayShift === 'Off') {
                weeklyOffCount++;
            }
        }
    });
    
    // Eğer bugün Off değilse ve haftada zaten 1 gün off varsa, Off butonunu devre dışı bırak
    const shiftOffBtn = modal.querySelector('.shift-btn[data-shift="Off"]');
    if (currentShift !== 'Off' && weeklyOffCount >= 1) {
        shiftOffBtn.disabled = true;
        shiftOffBtn.style.opacity = '0.5';
        shiftOffBtn.style.cursor = 'not-allowed';
        shiftOffBtn.title = 'Bu hafta zaten 1 gün off var (maksimum 1 gün)';
    } else {
        shiftOffBtn.disabled = false;
        shiftOffBtn.style.opacity = '1';
        shiftOffBtn.style.cursor = 'pointer';
        shiftOffBtn.title = '';
    }
    
    modal.style.display = 'flex';
    modal.classList.add('show');
}

function assignShift(shift) {
    if (!currentCell) return;
    
    const date = currentCell.dataset.date;
    const personId = currentCell.dataset.person;
    
    // 1500'den sonra 918 kontrolü
    if (shift === '918') {
        const dateObj = DateHelper.parseDate(date);
        const prevDate = new Date(dateObj);
        prevDate.setDate(prevDate.getDate() - 1);
        const prevDateStr = DateHelper.formatDate(prevDate);
        const prevShift = getShift(appState.currentTeamId, prevDateStr, personId);
        
        if (prevShift === '1500') {
            alert('1500 vardiyasından sonra 918 vardiyası seçilemez!');
            return;
        }
    }
    
    // Haftalık off kontrolü - maksimum 1 gün off
    if (shift === 'Off') {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const weekNumber = DateHelper.getWeekNumberInRange(date, startDate);
        const days = DateHelper.getDaysBetween(startDate, endDate);
        
        // Bu haftadaki off günlerini say (bugün hariç)
        let weeklyOffCount = 0;
        const currentShift = getShift(appState.currentTeamId, date, personId);
        
        days.forEach(day => {
            const dayWeekNumber = DateHelper.getWeekNumberInRange(day, startDate);
            if (dayWeekNumber === weekNumber && day !== date) {
                const dayShift = getShift(appState.currentTeamId, day, personId);
                if (dayShift === 'Off') {
                    weeklyOffCount++;
                }
            }
        });
        
        // Eğer bugün zaten Off değilse ve haftada zaten 1 gün off varsa, uyarı ver
        if (currentShift !== 'Off' && weeklyOffCount >= 1) {
            alert('Bu hafta zaten 1 gün off var! Haftalık maksimum 1 gün off olabilir.');
            return;
        }
    }
    
    setShift(appState.currentTeamId, date, personId, shift);
    
    // UI'ı güncelle
    const shiftClass = getShiftClass(shift);
    currentCell.className = `schedule-cell ${shiftClass}`;
    currentCell.textContent = shift || '';
}

// Otomatik oluşturma fonksiyonları
function generateSchedule() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        alert('Lütfen başlangıç ve bitiş tarihlerini seçin!');
        return;
    }
    
    // Tüm takımları kontrol et
    const teamsWithPersons = appState.data.teams.filter(t => t.persons.length > 0);
    if (teamsWithPersons.length === 0) {
        alert('Lütfen en az bir takıma kişi ekleyin!');
        return;
    }
    
    // Tüm takımlar için program oluştur
    teamsWithPersons.forEach(team => {
        generateScheduleForTeam(team.id, startDate, endDate);
    });
    
    // Programı yeniden göster
    updateScheduleDisplay();
    
    alert(`${teamsWithPersons.length} takım için program otomatik olarak oluşturuldu!`);
}

function generateScheduleForTeam(teamId, startDate, endDate) {
    const team = appState.data.teams.find(t => t.id === teamId);
    if (!team || team.persons.length === 0) {
        return;
    }
    
    const days = DateHelper.getDaysBetween(startDate, endDate);
    const persons = team.persons;
    
    // Range başlangıcını hafta hesaplaması için sakla
    const rangeStartDate = startDate;
    
    // Her kişi için haftalık çalışma günü sayısını takip et
    const weeklyWorkDays = {}; // { personId: { weekNumber: count } }
    
    // Her kişi için haftalık off günü sayısını takip et (maksimum 1 gün)
    const weeklyOffDays = {}; // { personId: { weekNumber: count } }
    
    // Her gün için 1322 vardiyası sayısını takip et
    const daily1322Count = {}; // { date: count }
    
    // Her gün için 1500 vardiyası sayısını takip et (maksimum 4 kişi)
    const daily1500Count = {}; // { date: count }
    
    // Her kişi için 918 ve 1500 vardiya sayılarını takip et (dengeli dağıtım için)
    const shiftCounts = {}; // { personId: { '918': count, '1500': count } }
    
    // Her kişi için üst üste çalışma günü sayısını takip et (6 gün üst üste kontrolü için)
    const consecutiveWorkDays = {}; // { personId: count }
    
    persons.forEach(person => {
        shiftCounts[person.id] = { '918': 0, '1500': 0 };
        consecutiveWorkDays[person.id] = 0;
        weeklyOffDays[person.id] = {};
    });
    
    // Önceki günün vardiyasını takip et (1500 -> 918 kuralı için)
    const previousShift = {}; // { personId: shift }
    
    days.forEach(date => {
        const weekNumber = DateHelper.getWeekNumberInRange(date, rangeStartDate);
        daily1322Count[date] = 0;
        daily1500Count[date] = 0;
        
        // Her kişi için vardiya ata
        const shuffledPersons = [...persons].sort(() => Math.random() - 0.5);
        
        // Önce herkesin vardiyasını geçici olarak hesapla (off kontrolü için)
        const tempShifts = {}; // { personId: shift }
        
        shuffledPersons.forEach(person => {
            const personId = person.id;
            
            // Haftalık çalışma günü kontrolü (maksimum 6 gün)
            if (!weeklyWorkDays[personId]) {
                weeklyWorkDays[personId] = {};
            }
            if (!weeklyWorkDays[personId][weekNumber]) {
                weeklyWorkDays[personId][weekNumber] = 0;
            }
            
            // Haftalık off günü kontrolü (maksimum 1 gün)
            if (!weeklyOffDays[personId][weekNumber]) {
                weeklyOffDays[personId][weekNumber] = 0;
            }
            
            // 6 gün üst üste çalışma kontrolü - ertesi gün zorunlu Off
            if (consecutiveWorkDays[personId] >= 6) {
                // Eğer bu hafta zaten 1 gün off olduysa, vardiya atamaya çalış
                const weekNum = DateHelper.getWeekNumberInRange(date, rangeStartDate);
                if (weeklyOffDays[personId][weekNum] >= 1) {
                    // Off atanamaz, vardiya atamaya çalış
                    const availableShifts = ['918', '1322', '1500'];
                    const shift = selectShift(availableShifts, personId, date, daily1322Count, daily1500Count, shiftCounts, tempShifts);
                    tempShifts[personId] = shift;
                    previousShift[personId] = shift;
                    
                    if (shift !== 'Off' && shift !== 'Rapor' && shift !== 'Yıllık İzin' && shift !== 'Ücretsiz İzin') {
                        weeklyWorkDays[personId][weekNumber]++;
                        consecutiveWorkDays[personId]++;
                        if (shift === '1322') {
                            daily1322Count[date]++;
                        }
                        if (shift === '1500') {
                            daily1500Count[date]++;
                        }
                        if (shift === '918' || shift === '1500') {
                            shiftCounts[personId][shift]++;
                        }
                    }
                } else {
                    tempShifts[personId] = 'Off';
                    const weekNum = DateHelper.getWeekNumberInRange(date, rangeStartDate);
                    weeklyOffDays[personId][weekNum]++;
                    consecutiveWorkDays[personId] = 0;
                    previousShift[personId] = 'Off';
                }
                return;
            }
            
            // Eğer bu hafta 6 gün çalıştıysa Off ata (ama haftalık off limiti kontrolü ile)
            const weekNum = DateHelper.getWeekNumberInRange(date, rangeStartDate);
            if (weeklyWorkDays[personId][weekNum] >= 6) {
                // Eğer bu hafta zaten 1 gün off olduysa, vardiya atamaya çalış
                if (weeklyOffDays[personId][weekNum] >= 1) {
                    // Off atanamaz, vardiya atamaya çalış
                    const availableShifts = ['918', '1322', '1500'];
                    const shift = selectShift(availableShifts, personId, date, daily1322Count, daily1500Count, shiftCounts, tempShifts);
                    tempShifts[personId] = shift;
                    previousShift[personId] = shift;
                    
                    if (shift !== 'Off' && shift !== 'Rapor' && shift !== 'Yıllık İzin' && shift !== 'Ücretsiz İzin') {
                        weeklyWorkDays[personId][weekNumber]++;
                        consecutiveWorkDays[personId]++;
                        if (shift === '1322') {
                            daily1322Count[date]++;
                        }
                        if (shift === '1500') {
                            daily1500Count[date]++;
                        }
                        if (shift === '918' || shift === '1500') {
                            shiftCounts[personId][shift]++;
                        }
                    }
                } else {
                    tempShifts[personId] = 'Off';
                    weeklyOffDays[personId][weekNumber]++;
                    if (previousShift[personId] && previousShift[personId] !== 'Off' && 
                        previousShift[personId] !== 'Rapor' && previousShift[personId] !== 'Yıllık İzin' && 
                        previousShift[personId] !== 'Ücretsiz İzin') {
                        consecutiveWorkDays[personId] = 0;
                    }
                    previousShift[personId] = 'Off';
                }
                return;
            }
            
            // 1500'den sonra 918 gelmemeli kuralı
            if (previousShift[personId] === '1500') {
                // 918 hariç diğer vardiyaları dene
                let availableShifts = ['1322', '1500', 'Off'];
                
                // Haftalık off limiti kontrolü - eğer bu hafta zaten 1 gün off olduysa Off'u kaldır
                if (weeklyOffDays[personId][weekNumber] >= 1) {
                    availableShifts = availableShifts.filter(s => s !== 'Off');
                }
                
                const shift = selectShift(availableShifts, personId, date, daily1322Count, daily1500Count, shiftCounts, tempShifts);
                tempShifts[personId] = shift;
                previousShift[personId] = shift;
                
                if (shift !== 'Off' && shift !== 'Rapor' && shift !== 'Yıllık İzin' && shift !== 'Ücretsiz İzin') {
                    weeklyWorkDays[personId][weekNumber]++;
                    consecutiveWorkDays[personId]++;
                    if (shift === '1322') {
                        daily1322Count[date]++;
                    }
                    if (shift === '1500') {
                        daily1500Count[date]++;
                    }
                    if (shift === '918' || shift === '1500') {
                        shiftCounts[personId][shift]++;
                    }
                } else if (shift === 'Off') {
                    // Haftalık off kontrolü - maksimum 1 gün off (2 kez off olamaz)
                    if (weeklyOffDays[personId][weekNumber] >= 1) {
                        // Eğer zaten 1 gün off varsa, Off atanamaz - vardiya atamaya çalış
                        const fallbackShifts = ['1322', '1500'];
                        const fallbackShift = selectShift(fallbackShifts, personId, date, daily1322Count, daily1500Count, shiftCounts, tempShifts);
                        tempShifts[personId] = fallbackShift;
                        previousShift[personId] = fallbackShift;
                        
                        if (fallbackShift !== 'Off' && fallbackShift !== 'Rapor' && fallbackShift !== 'Yıllık İzin' && fallbackShift !== 'Ücretsiz İzin') {
                            weeklyWorkDays[personId][weekNumber]++;
                            consecutiveWorkDays[personId]++;
                            if (fallbackShift === '1322') {
                                daily1322Count[date]++;
                            }
                            if (fallbackShift === '1500') {
                                daily1500Count[date]++;
                            }
                            if (fallbackShift === '918' || fallbackShift === '1500') {
                                shiftCounts[personId][fallbackShift]++;
                            }
                        }
                    } else {
                        weeklyOffDays[personId][weekNumber]++;
                        consecutiveWorkDays[personId] = 0;
                    }
                } else {
                    consecutiveWorkDays[personId] = 0;
                }
                return;
            }
            
            // Normal vardiya atama
            let availableShifts = ['918', '1322', '1500', 'Off'];
            
            // Haftalık off limiti kontrolü - eğer bu hafta zaten 1 gün off olduysa Off'u kaldır
            if (weeklyOffDays[personId][weekNumber] >= 1) {
                availableShifts = availableShifts.filter(s => s !== 'Off');
            }
            
            const shift = selectShift(availableShifts, personId, date, daily1322Count, daily1500Count, shiftCounts, tempShifts);
            tempShifts[personId] = shift;
            previousShift[personId] = shift;
            
            if (shift !== 'Off' && shift !== 'Rapor' && shift !== 'Yıllık İzin' && shift !== 'Ücretsiz İzin') {
                weeklyWorkDays[personId][weekNumber]++;
                consecutiveWorkDays[personId]++;
                if (shift === '1322') {
                    daily1322Count[date]++;
                }
                if (shift === '1500') {
                    daily1500Count[date]++;
                }
                if (shift === '918' || shift === '1500') {
                    shiftCounts[personId][shift]++;
                }
            } else if (shift === 'Off') {
                // Haftalık off kontrolü - maksimum 1 gün off (2 kez off olamaz)
                if (weeklyOffDays[personId][weekNumber] >= 1) {
                    // Eğer zaten 1 gün off varsa, Off atanamaz - vardiya atamaya çalış
                    const fallbackShifts = ['918', '1322', '1500'];
                    const fallbackShift = selectShift(fallbackShifts, personId, date, daily1322Count, daily1500Count, shiftCounts, tempShifts);
                    tempShifts[personId] = fallbackShift;
                    previousShift[personId] = fallbackShift;
                    
                    if (fallbackShift !== 'Off' && fallbackShift !== 'Rapor' && fallbackShift !== 'Yıllık İzin' && fallbackShift !== 'Ücretsiz İzin') {
                        weeklyWorkDays[personId][weekNumber]++;
                        consecutiveWorkDays[personId]++;
                        if (fallbackShift === '1322') {
                            daily1322Count[date]++;
                        }
                        if (fallbackShift === '1500') {
                            daily1500Count[date]++;
                        }
                        if (fallbackShift === '918' || fallbackShift === '1500') {
                            shiftCounts[personId][fallbackShift]++;
                        }
                    }
                } else {
                    weeklyOffDays[personId][weekNumber]++;
                    consecutiveWorkDays[personId] = 0;
                }
            } else {
                consecutiveWorkDays[personId] = 0;
            }
        });
        
        // Minimum 1 kişi 1322 kontrolü
        const temp1322Count = Object.values(tempShifts).filter(s => s === '1322').length;
        const current1322Count = temp1322Count;
        if (current1322Count < 1 && persons.length >= 1) {
            // 1322'ye atanabilecek kişileri bul
            const availableFor1322 = shuffledPersons.filter(person => {
                const personId = person.id;
                const shift = tempShifts[personId];
                
                // Zaten 1322 değilse ve limitlerde değilse
                if (shift === '1322') return false;
                
                const weekNum = DateHelper.getWeekNumberInRange(date, rangeStartDate);
                if (weeklyWorkDays[personId] && weeklyWorkDays[personId][weekNum] >= 6) return false;
                if (consecutiveWorkDays[personId] >= 6) return false;
                if (weeklyOffDays[personId] && weeklyOffDays[personId][weekNum] >= 1) return false;
                
                return true;
            });
            
            // En az bir kişiyi 1322'ye ata
            if (availableFor1322.length > 0) {
                const person = availableFor1322[0];
                const personId = person.id;
                const weekNum = DateHelper.getWeekNumberInRange(date, rangeStartDate);
                
                // Önceki vardiyayı kontrol et - 1500'den sonra 918 gelmemeli ama 1322 gelebilir
                const prevShift = previousShift[personId];
                
                tempShifts[personId] = '1322';
                previousShift[personId] = '1322';
                daily1322Count[date]++;
                
                if (!weeklyWorkDays[personId]) {
                    weeklyWorkDays[personId] = {};
                }
                if (!weeklyWorkDays[personId][weekNum]) {
                    weeklyWorkDays[personId][weekNum] = 0;
                }
                weeklyWorkDays[personId][weekNum]++;
                consecutiveWorkDays[personId]++;
            }
        }
        
        // Minimum 3 kişi 1500 kontrolü
        const temp1500Count = Object.values(tempShifts).filter(s => s === '1500').length;
        const current1500Count = temp1500Count;
        if (current1500Count < 3 && persons.length >= 3) {
            // 1500'e atanabilecek kişileri bul
            const availableFor1500 = shuffledPersons.filter(person => {
                const personId = person.id;
                const shift = tempShifts[personId];
                
                // Zaten 1500 değilse ve limitlerde değilse
                if (shift === '1500') return false;
                
                const weekNum = DateHelper.getWeekNumberInRange(date, rangeStartDate);
                if (weeklyWorkDays[personId] && weeklyWorkDays[personId][weekNum] >= 6) return false;
                if (consecutiveWorkDays[personId] >= 6) return false;
                if (previousShift[personId] === '1500') return true; // 1500'den sonra 918 gelmemeli ama 1500 tekrar olabilir
                
                return true;
            });
            
            // Eksik kadar kişiyi 1500'e ata
            const needed = 3 - current1500Count;
            for (let i = 0; i < needed && i < availableFor1500.length; i++) {
                const person = availableFor1500[i];
                const personId = person.id;
                const weekNum = DateHelper.getWeekNumberInRange(date, rangeStartDate);
                
                // Önceki vardiyayı kontrol et
                if (previousShift[personId] === '1500') {
                    // 1500'den sonra 918 gelebilir ama biz 1500 atıyoruz, bu sorun değil
                }
                
                tempShifts[personId] = '1500';
                previousShift[personId] = '1500';
                daily1500Count[date]++;
                
                if (!weeklyWorkDays[personId]) {
                    weeklyWorkDays[personId] = {};
                }
                if (!weeklyWorkDays[personId][weekNum]) {
                    weeklyWorkDays[personId][weekNum] = 0;
                }
                weeklyWorkDays[personId][weekNum]++;
                consecutiveWorkDays[personId]++;
                shiftCounts[personId]['1500']++;
            }
        }
        
        // Takımdaki herkes aynı gün off olamaz kontrolü
        const assignedShifts = Object.values(tempShifts).filter(s => s !== undefined && s !== null);
        const allOff = assignedShifts.length === persons.length && assignedShifts.every(s => s === 'Off');
        if (allOff && persons.length > 0) {
            // En az bir kişiyi vardiyaya ata (haftalık limit ve 6 gün üst üste kontrolü olmadan)
            let assigned = false;
            for (const person of shuffledPersons) {
                const personId = person.id;
                const weekNum = DateHelper.getWeekNumberInRange(date, rangeStartDate);
                
                // Eğer zaten vardiya atanmışsa atla
                if (tempShifts[personId] && tempShifts[personId] !== 'Off') {
                    continue;
                }
                
                // Haftalık limit kontrolü
                if (weeklyWorkDays[personId] && weeklyWorkDays[personId][weekNum] >= 6) {
                    continue; // Bu kişi haftalık limiti doldurmuş, atla
                }
                
                // 6 gün üst üste kontrolü
                if (consecutiveWorkDays[personId] >= 6) {
                    continue; // Bu kişi 6 gün üst üste çalışmış, atla
                }
                
                // Bu kişiyi vardiyaya ata
                const availableShifts = ['918', '1322', '1500'];
                const shift = selectShift(availableShifts, personId, date, daily1322Count, daily1500Count, shiftCounts, tempShifts);
                tempShifts[personId] = shift;
                previousShift[personId] = shift;
                
                // Sayacı güncelle
                if (shift === '1322') {
                    daily1322Count[date]++;
                }
                if (shift === '1500') {
                    daily1500Count[date]++;
                }
                if (shift === '918' || shift === '1500') {
                    shiftCounts[personId][shift]++;
                }
                if (!weeklyWorkDays[personId]) {
                    weeklyWorkDays[personId] = {};
                }
                if (!weeklyWorkDays[personId][weekNum]) {
                    weeklyWorkDays[personId][weekNum] = 0;
                }
                weeklyWorkDays[personId][weekNum]++;
                consecutiveWorkDays[personId]++;
                assigned = true;
                break; // Bir kişi atandı, döngüden çık
            }
            
            // Eğer hiç kimse atanamadıysa ve haftalık off limiti dolmuşsa, yine de birini vardiyaya ata
            if (!assigned) {
                // Haftalık off limiti dolmamış kişileri bul
                const availablePersons = shuffledPersons.filter(person => {
                    const personId = person.id;
                    const weekNum = DateHelper.getWeekNumberInRange(date, rangeStartDate);
                    return !weeklyOffDays[personId] || !weeklyOffDays[personId][weekNum] || weeklyOffDays[personId][weekNum] < 1;
                });
                
                if (availablePersons.length > 0) {
                    const person = availablePersons[0];
                    const personId = person.id;
                    const weekNum = DateHelper.getWeekNumberInRange(date, rangeStartDate);
                    
                    const availableShifts = ['918', '1322', '1500'];
                    const shift = selectShift(availableShifts, personId, date, daily1322Count, daily1500Count, shiftCounts, tempShifts);
                    tempShifts[personId] = shift;
                    previousShift[personId] = shift;
                    
                    // Sayacı güncelle
                    if (shift === '1322') {
                        daily1322Count[date]++;
                    }
                    if (shift === '1500') {
                        daily1500Count[date]++;
                    }
                    if (shift === '918' || shift === '1500') {
                        shiftCounts[personId][shift]++;
                    }
                    if (!weeklyWorkDays[personId]) {
                        weeklyWorkDays[personId] = {};
                    }
                    if (!weeklyWorkDays[personId][weekNum]) {
                        weeklyWorkDays[personId][weekNum] = 0;
                    }
                    weeklyWorkDays[personId][weekNum]++;
                    consecutiveWorkDays[personId]++;
                }
            }
            
            // Eğer hiç kimse atanamadıysa (tüm kişiler limitlerde), uyarı ver ama devam et
            if (!assigned) {
                console.warn(`${date} tarihinde tüm kişiler limitlerde, herkes off kaldı`);
            }
        }
        
        // Minimum 1 kişi 1322 kontrolü (herkes off kontrolünden sonra tekrar kontrol et)
        const final1322Count = Object.values(tempShifts).filter(s => s === '1322').length;
        if (final1322Count < 1 && persons.length >= 1) {
            // 1322'ye atanabilecek kişileri bul
            const availableFor1322 = shuffledPersons.filter(person => {
                const personId = person.id;
                const shift = tempShifts[personId];
                
                // Zaten 1322 değilse ve limitlerde değilse
                if (shift === '1322') return false;
                
                const weekNum = DateHelper.getWeekNumberInRange(date, rangeStartDate);
                if (weeklyWorkDays[personId] && weeklyWorkDays[personId][weekNum] >= 6) return false;
                if (consecutiveWorkDays[personId] >= 6) return false;
                if (weeklyOffDays[personId] && weeklyOffDays[personId][weekNum] >= 1) return false;
                
                return true;
            });
            
            // En az bir kişiyi 1322'ye ata
            if (availableFor1322.length > 0) {
                const person = availableFor1322[0];
                const personId = person.id;
                const weekNum = DateHelper.getWeekNumberInRange(date, rangeStartDate);
                const currentShift = tempShifts[personId];
                
                // Eğer zaten bir vardiya varsa, onu değiştir
                if (currentShift && currentShift !== '1322') {
                    // Önceki vardiyayı geri al
                    if (currentShift === '1500') {
                        daily1500Count[date]--;
                        if (shiftCounts[personId]) {
                            shiftCounts[personId]['1500']--;
                        }
                    }
                    if (currentShift === '918') {
                        if (shiftCounts[personId]) {
                            shiftCounts[personId]['918']--;
                        }
                    }
                    if (currentShift !== 'Off' && currentShift !== 'Rapor' && currentShift !== 'Yıllık İzin' && currentShift !== 'Ücretsiz İzin') {
                        if (weeklyWorkDays[personId] && weeklyWorkDays[personId][weekNum]) {
                            weeklyWorkDays[personId][weekNum]--;
                        }
                        if (consecutiveWorkDays[personId] > 0) {
                            consecutiveWorkDays[personId]--;
                        }
                    }
                }
                
                tempShifts[personId] = '1322';
                previousShift[personId] = '1322';
                daily1322Count[date]++;
                
                if (!weeklyWorkDays[personId]) {
                    weeklyWorkDays[personId] = {};
                }
                if (!weeklyWorkDays[personId][weekNum]) {
                    weeklyWorkDays[personId][weekNum] = 0;
                }
                weeklyWorkDays[personId][weekNum]++;
                consecutiveWorkDays[personId]++;
            }
        }
        
        // Vardiyaları kaydet
        Object.keys(tempShifts).forEach(personId => {
            setShift(teamId, date, personId, tempShifts[personId]);
        });
    });
}

function selectShift(availableShifts, personId, date, daily1322Count, daily1500Count, shiftCounts, tempShifts) {
    // Geçici atamalardaki sayıları hesapla (mevcut kişi hariç)
    let temp1322Count = 0;
    let temp1500Count = 0;
    if (tempShifts) {
        Object.keys(tempShifts).forEach(pid => {
            if (pid !== personId) { // Mevcut kişiyi hariç tut
                const shift = tempShifts[pid];
                if (shift === '1322') {
                    temp1322Count++;
                }
                if (shift === '1500') {
                    temp1500Count++;
                }
            }
        });
    }
    
    // 1322 için günlük limit kontrolü (maksimum 1 kişi)
    const current1322Count = (daily1322Count[date] || 0) + temp1322Count;
    if (current1322Count >= 1 && availableShifts.includes('1322')) {
        availableShifts = availableShifts.filter(s => s !== '1322');
    }
    
    // 1500 için günlük limit kontrolü (maksimum 4 kişi)
    const current1500Count = (daily1500Count[date] || 0) + temp1500Count;
    if (current1500Count >= 4 && availableShifts.includes('1500')) {
        availableShifts = availableShifts.filter(s => s !== '1500');
    }
    
    // Eğer sadece Off kaldıysa Off döndür
    if (availableShifts.length === 1 && availableShifts[0] === 'Off') {
        return 'Off';
    }
    
    // 918 ve 1500'ü dengeli dağıtmak için
    // En az atanan vardiyayı tercih et
    const counts = shiftCounts[personId];
    const min918 = Math.min(...Object.values(shiftCounts).map(s => s['918']));
    const min1500 = Math.min(...Object.values(shiftCounts).map(s => s['1500']));
    
    // Eğer bu kişinin 918 sayısı minimumdan fazlaysa, 1500'e öncelik ver
    if (counts['918'] > min918 && availableShifts.includes('1500')) {
        return '1500';
    }
    
    // Eğer bu kişinin 1500 sayısı minimumdan fazlaysa, 918'e öncelik ver
    if (counts['1500'] > min1500 && availableShifts.includes('918')) {
        return '918';
    }
    
    // Rastgele seçim (ama kurallara uygun)
    const validShifts = availableShifts.filter(s => s !== 'Off');
    if (validShifts.length > 0) {
        return validShifts[Math.floor(Math.random() * validShifts.length)];
    }
    
    return 'Off';
}

function clearSchedule() {
    if (!appState.currentTeamId) {
        alert('Lütfen önce bir takım seçin!');
        return;
    }
    
    if (!confirm('Programı temizlemek istediğinizden emin misiniz?')) {
        return;
    }
    
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        return;
    }
    
    const days = DateHelper.getDaysBetween(startDate, endDate);
    const team = appState.data.teams.find(t => t.id === appState.currentTeamId);
    
    days.forEach(date => {
        team.persons.forEach(person => {
            setShift(appState.currentTeamId, date, person.id, null);
        });
    });
    
    updateScheduleDisplay();
    alert('Program temizlendi!');
}

// Paylaşım fonksiyonları
function shareSchedule() {
    const url = DataManager.createShareableURL(appState.data);
    if (url) {
        // Modal'ı göster
        const modal = document.getElementById('shareModal');
        const linkInput = document.getElementById('shareLinkInput');
        const copyBtn = document.getElementById('copyLinkBtn');
        const successMsg = document.getElementById('shareSuccess');
        
        linkInput.value = url;
        successMsg.style.display = 'none';
        modal.style.display = 'flex';
        modal.classList.add('show');
        
        // Kopyalama butonu
        copyBtn.onclick = function() {
            linkInput.select();
            linkInput.setSelectionRange(0, 99999); // Mobil cihazlar için
            
            navigator.clipboard.writeText(url).then(() => {
                successMsg.style.display = 'block';
                copyBtn.textContent = 'Kopyalandı!';
                setTimeout(() => {
                    copyBtn.textContent = 'Kopyala';
                }, 2000);
            }).catch(() => {
                // Fallback: manuel kopyalama
                document.execCommand('copy');
                successMsg.style.display = 'block';
                copyBtn.textContent = 'Kopyalandı!';
                setTimeout(() => {
                    copyBtn.textContent = 'Kopyala';
                }, 2000);
            });
        };
    } else {
        alert('Paylaşım linki oluşturulamadı!');
    }
}

// Paylaşım modal'ını kapat
document.addEventListener('DOMContentLoaded', function() {
    const closeShareModal = document.getElementById('closeShareModal');
    const shareModal = document.getElementById('shareModal');
    
    if (closeShareModal) {
        closeShareModal.addEventListener('click', function() {
            shareModal.style.display = 'none';
            shareModal.classList.remove('show');
        });
    }
    
    // Modal dışına tıklanınca kapat
    if (shareModal) {
        shareModal.addEventListener('click', function(e) {
            if (e.target === shareModal) {
                shareModal.style.display = 'none';
                shareModal.classList.remove('show');
            }
        });
    }
});

function exportSchedule() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        alert('Lütfen başlangıç ve bitiş tarihlerini seçin!');
        return;
    }
    
    const days = DateHelper.getDaysBetween(startDate, endDate);
    const workbook = XLSX.utils.book_new();
    
    // Her takım için ayrı sheet oluştur
    appState.data.teams.forEach(team => {
        if (team.persons.length === 0) return;
        
        // Sheet verisi oluştur
        const sheetData = [];
        
        // Başlık satırı
        const headerRow = ['Kişi'];
        days.forEach(day => {
            const dayName = DateHelper.getDayName(day);
            headerRow.push(`${dayName}\n${day}`);
        });
        sheetData.push(headerRow);
        
        // Her kişi için satır
        team.persons.forEach(person => {
            const row = [person.name];
            days.forEach(day => {
                const shift = getShift(team.id, day, person.id);
                row.push(shift || '');
            });
            sheetData.push(row);
        });
        
        // Worksheet oluştur
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
        
        // Kolon genişliklerini ayarla
        const colWidths = [{ wch: 15 }]; // Kişi adı kolonu
        days.forEach(() => {
            colWidths.push({ wch: 10 }); // Her gün için kolon
        });
        worksheet['!cols'] = colWidths;
        
        // Hücre stilleri için renk kodlaması (opsiyonel - XLSX.js ile sınırlı stil desteği var)
        // Renk kodlaması için conditional formatting kullanılabilir ama basit tutuyoruz
        
        // Sheet'i workbook'a ekle
        XLSX.utils.book_append_sheet(workbook, worksheet, team.name.substring(0, 31)); // Excel sheet adı max 31 karakter
    });
    
    // Excel dosyasını indir
    const fileName = `vardiya_programi_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}


// Global fonksiyonlar (HTML'den çağrılabilmesi için)
window.deletePerson = deletePerson;

