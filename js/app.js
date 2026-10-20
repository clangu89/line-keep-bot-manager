/**
 * ====================================================================
 * LINE Keep Bot & Google Drive Manager
 * ไฟล์: js/app.js - Main Application Controller & Reactive UI
 * ====================================================================
 */

const App = {
  currentTab: "dashboard",
  activeGroupFilter: "all",
  activeAlbumFilter: null,
  gallerySubTab: "albums", // 'albums' หรือ 'single'
  searchKeyword: "",
  selectedFileIds: [],
  dashboardData: null,
  groups: [],
  albums: [],
  files: [],
  logs: [],
  chartInstance: null,

  async init() {
    // โหลด filter จาก localStorage
    this.activeGroupFilter = AppConfig.getActiveGroupFilter();
    
    // แสดง UI โครงสร้างหลัก
    this.renderLayout();
    
    // โหลดข้อมูลและแสดงผลแท็บเริ่มต้น
    await this.loadData();
    this.switchTab(this.currentTab);
  },

  async loadData() {
    try {
      this.showLoading(true);
      var dashRes = await ApiService.getDashboard();
      if (dashRes.success) {
        this.dashboardData = dashRes.data;
        this.groups = dashRes.data.groups || [];
        this.albums = dashRes.data.recentAlbums || [];
      }

      var grpRes = await ApiService.getGroups();
      if (grpRes.success) {
        this.groups = grpRes.data;
      }

      var albRes = await ApiService.getAlbums(this.activeGroupFilter);
      if (albRes.success) {
        this.albums = albRes.data;
      }

      var filRes = await ApiService.getFiles(this.activeGroupFilter);
      if (filRes.success) {
        this.files = filRes.data;
      }

      this.updateNavbarBadges();
    } catch (e) {
      console.error("Load data error:", e);
      this.showToast("เกิดข้อผิดพลาดในการโหลดข้อมูล: " + e.message, "error");
    } finally {
      this.showLoading(false);
    }
  },

  // ==================================================================
  // UI LAYOUT & NAVIGATION
  // ==================================================================

  renderLayout() {
    var root = document.getElementById("app");
    var isMock = AppConfig.isMockMode();
    var user = AuthService.getUser();

    root.innerHTML = `
      <!-- TOP NAVBAR -->
      <header class="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            
            <!-- Logo & Brand -->
            <div class="flex items-center space-x-3 cursor-pointer" onclick="App.switchTab('dashboard')">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center text-white shadow-md shadow-emerald-100">
                <i data-lucide="folder-git-2" class="w-5 h-5"></i>
              </div>
              <div>
                <div class="flex items-center space-x-2">
                  <span class="font-bold text-lg text-slate-800 tracking-tight">LINE Keep Bot</span>
                  <span class="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-medium">Drive Sync</span>
                </div>
                <p class="text-xs text-slate-400 hidden sm:block">เก็บบันทึกไฟล์และรูปภาพจาก LINE สู่ Google Drive</p>
              </div>
            </div>

            <!-- Global Group Filter & Mode Badge -->
            <div class="flex items-center space-x-3">
              
              <!-- Mode Badge Indicator -->
              <div id="mode-badge" class="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isMock ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}">
                <span class="w-2 h-2 rounded-full ${isMock ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}"></span>
                <span>${isMock ? 'โหมดจำลอง (Demo Mode)' : 'เชื่อมต่อสด (Live GAS)'}</span>
              </div>

              <!-- Group Selector -->
              <div class="relative">
                <select id="global-group-select" onchange="App.handleGroupFilterChange(this.value)" class="text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-700 font-medium pr-8">
                  <option value="all">📁 ทุกกลุ่ม LINE</option>
                  ${this.groups.map(g => `<option value="${g.group_id}" ${this.activeGroupFilter === g.group_id ? 'selected' : ''}>${g.group_name}</option>`).join('')}
                </select>
              </div>

              <!-- Action Upload Button -->
              <button onclick="App.openUploadModal()" class="hidden sm:inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium px-3.5 py-2 rounded-lg shadow-sm transition">
                <i data-lucide="upload-cloud" class="w-4 h-4"></i>
                <span>อัปโหลดเข้า Drive</span>
              </button>
            </div>

          </div>
        </div>

        <!-- NAVIGATION TABS -->
        <nav class="bg-slate-50 border-t border-slate-200 overflow-x-auto">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 sm:space-x-4 py-1.5 text-xs sm:text-sm font-medium text-slate-600 whitespace-nowrap">
            <button onclick="App.switchTab('dashboard')" id="tab-dashboard" class="tab-btn px-3 py-2 rounded-lg flex items-center space-x-2 hover:bg-white transition">
              <i data-lucide="layout-dashboard" class="w-4 h-4 text-emerald-600"></i>
              <span>ภาพรวม (Dashboard)</span>
            </button>
            <button onclick="App.switchTab('groups')" id="tab-groups" class="tab-btn px-3 py-2 rounded-lg flex items-center space-x-2 hover:bg-white transition">
              <i data-lucide="users" class="w-4 h-4 text-blue-600"></i>
              <span>กลุ่ม LINE (<span id="badge-groups-count">${this.groups.length}</span>)</span>
            </button>
            <button onclick="App.switchTab('gallery')" id="tab-gallery" class="tab-btn px-3 py-2 rounded-lg flex items-center space-x-2 hover:bg-white transition">
              <i data-lucide="image" class="w-4 h-4 text-emerald-600"></i>
              <span>1.รูปภาพ & อัลบั้ม</span>
            </button>
            <button onclick="App.switchTab('files')" id="tab-files" class="tab-btn px-3 py-2 rounded-lg flex items-center space-x-2 hover:bg-white transition">
              <i data-lucide="file-text" class="w-4 h-4 text-amber-600"></i>
              <span>2.ไฟล์อื่นๆ</span>
            </button>
            <button onclick="App.switchTab('simulator')" id="tab-simulator" class="tab-btn px-3 py-2 rounded-lg flex items-center space-x-2 hover:bg-white transition">
              <i data-lucide="bot" class="w-4 h-4 text-indigo-600"></i>
              <span>จำลองส่งไฟล์ & คำสั่ง</span>
            </button>
            <button onclick="App.switchTab('settings')" id="tab-settings" class="tab-btn px-3 py-2 rounded-lg flex items-center space-x-2 hover:bg-white transition">
              <i data-lucide="settings" class="w-4 h-4 text-slate-600"></i>
              <span>ตั้งค่าการเชื่อมต่อ</span>
            </button>
          </div>
        </nav>
      </header>

      <!-- MAIN CONTENT CONTAINER -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div id="tab-content"></div>
      </main>

      <!-- MODALS CONTAINER -->
      <div id="modal-container"></div>

      <!-- TOAST NOTIFICATIONS -->
      <div id="toast-container" class="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none"></div>
    `;

    lucide.createIcons();
  },

  switchTab(tabName) {
    this.currentTab = tabName;
    document.querySelectorAll(".tab-btn").forEach(el => {
      el.classList.remove("bg-white", "text-emerald-700", "shadow-sm", "font-semibold");
    });
    var activeTabEl = document.getElementById("tab-" + tabName);
    if (activeTabEl) {
      activeTabEl.classList.add("bg-white", "text-emerald-700", "shadow-sm", "font-semibold");
    }

    var content = document.getElementById("tab-content");
    switch (tabName) {
      case "dashboard":
        this.renderDashboard(content);
        break;
      case "groups":
        this.renderGroups(content);
        break;
      case "gallery":
        this.renderGallery(content);
        break;
      case "files":
        this.renderFiles(content);
        break;
      case "simulator":
        this.renderSimulator(content);
        break;
      case "settings":
        this.renderSettings(content);
        break;
    }
    lucide.createIcons();
  },

  handleGroupFilterChange(val) {
    this.activeGroupFilter = val;
    AppConfig.setActiveGroupFilter(val);
    this.loadData().then(() => {
      this.switchTab(this.currentTab);
    });
  },

  updateNavbarBadges() {
    var sel = document.getElementById("global-group-select");
    if (sel) {
      sel.innerHTML = `
        <option value="all" ${this.activeGroupFilter === 'all' ? 'selected' : ''}>📁 ทุกกลุ่ม LINE (${this.groups.length})</option>
        ${this.groups.map(g => `<option value="${g.group_id}" ${this.activeGroupFilter === g.group_id ? 'selected' : ''}>${g.group_name}</option>`).join('')}
      `;
    }
    var countEl = document.getElementById("badge-groups-count");
    if (countEl) countEl.innerText = this.groups.length;
  },

  // ==================================================================
  // 1. DASHBOARD VIEW
  // ==================================================================

  renderDashboard(container) {
    var stats = (this.dashboardData && this.dashboardData.stats) ? this.dashboardData.stats : {
      totalGroups: this.groups.length,
      totalAlbums: this.albums.length,
      totalImages: this.files.filter(f => f.category === 'image').length,
      totalOtherFiles: this.files.filter(f => f.category === 'other').length,
      totalStorageFormatted: "46.2 MB"
    };

    var recentFiles = this.files.slice(0, 6);
    var recentAlbums = this.albums.slice(0, 4);

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Welcome Hero Banner -->
        <div class="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
          <div class="relative z-10 max-w-2xl">
            <h1 class="text-2xl font-bold tracking-tight mb-1">ยินดีต้อนรับสู่ LINE Keep Bot & Google Drive Manager</h1>
            <p class="text-emerald-100 text-sm mb-4 leading-relaxed">
              ระบบเชื่อมต่อเพื่อดึงและสำรองไฟล์จากกลุ่ม LINE ลงสู่ Google Drive แยกโฟลเดอร์ตามกลุ่ม และแยกหมวดหมู่รูปภาพ (ภาพเดี่ยว & อัลบั้ม) พร้อมไฟล์เอกสารอื่นๆ อย่างเป็นระเบียบอัตโนมัติ
            </p>
            <div class="flex flex-wrap gap-2 text-xs font-medium">
              <span class="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
                <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
                <span>แยก 1.รูปภาพ & 2.ไฟล์อื่นๆ</span>
              </span>
              <span class="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
                <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
                <span>สร้างโฟลเดอร์ตามชื่ออัลบั้มอัตโนมัติ</span>
              </span>
              <span class="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
                <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
                <span>รองรับหลายกลุ่ม LINE พร้อมกัน</span>
              </span>
            </div>
          </div>
          <div class="absolute -right-8 -bottom-10 opacity-15 text-white pointer-events-none hidden md:block">
            <i data-lucide="cloud-lightning" class="w-72 h-72"></i>
          </div>
        </div>

        <!-- 4 Metric Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">กลุ่ม LINE ทั้งหมด</p>
              <h3 class="text-2xl font-bold text-slate-800 mt-1">${stats.totalGroups}</h3>
              <p class="text-xs text-emerald-600 mt-1 flex items-center">
                <i data-lucide="activity" class="w-3.5 h-3.5 mr-1"></i> เชื่อมต่อพร้อมทำงาน
              </p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <i data-lucide="users" class="w-6 h-6"></i>
            </div>
          </div>

          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">รูปภาพที่จัดเก็บ</p>
              <h3 class="text-2xl font-bold text-slate-800 mt-1">${stats.totalImages}</h3>
              <p class="text-xs text-slate-500 mt-1">โฟลเดอร์ 1.รูปภาพ</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <i data-lucide="image" class="w-6 h-6"></i>
            </div>
          </div>

          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">อัลบั้มรูปภาพ</p>
              <h3 class="text-2xl font-bold text-slate-800 mt-1">${stats.totalAlbums}</h3>
              <p class="text-xs text-emerald-600 mt-1">แยกโฟลเดอร์ตามชื่อ</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <i data-lucide="folder-heart" class="w-6 h-6"></i>
            </div>
          </div>

          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">เอกสารและไฟล์อื่นๆ</p>
              <h3 class="text-2xl font-bold text-slate-800 mt-1">${stats.totalOtherFiles}</h3>
              <p class="text-xs text-slate-500 mt-1">โฟลเดอร์ 2.ไฟล์อื่นๆ</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <i data-lucide="file-text" class="w-6 h-6"></i>
            </div>
          </div>

        </div>

        <!-- Charts & Structure Overview -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Chart -->
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="font-bold text-slate-800">สัดส่วนการจัดเก็บไฟล์ตามกลุ่ม LINE</h3>
                <p class="text-xs text-slate-500">เปรียบเทียบจำนวนไฟล์รูปภาพและไฟล์อื่นๆ ของแต่ละกลุ่ม</p>
              </div>
              <span class="text-xs font-medium px-2.5 py-1 rounded bg-slate-100 text-slate-600">Google Drive Storage</span>
            </div>
            <div class="h-64">
              <canvas id="groupStorageChart"></canvas>
            </div>
          </div>

          <!-- Google Drive Folder Tree Preview -->
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 class="font-bold text-slate-800 mb-2">โครงสร้างโฟลเดอร์ใน Google Drive</h3>
            <p class="text-xs text-slate-500 mb-4">จัดระเบียบตามกลุ่มและหมวดหมู่อัตโนมัติ</p>

            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono space-y-2">
              <div class="flex items-center text-slate-800 font-semibold">
                <i data-lucide="folder" class="w-4 h-4 text-amber-500 mr-2"></i> LINE_Keep_Bot_Storage/
              </div>
              <div class="pl-4 space-y-1.5 border-l-2 border-slate-200 ml-2 text-slate-600">
                <div class="flex items-center">
                  <i data-lucide="folder" class="w-3.5 h-3.5 text-blue-500 mr-1.5"></i> [ชื่อกลุ่ม LINE 1]/
                </div>
                <div class="pl-4 space-y-1 border-l-2 border-slate-200 ml-2">
                  <div class="flex items-center text-emerald-700 font-medium">
                    <i data-lucide="folder" class="w-3.5 h-3.5 text-emerald-500 mr-1.5"></i> 1.รูปภาพ/
                  </div>
                  <div class="pl-4 space-y-0.5 border-l-2 border-emerald-200 ml-2 text-slate-500">
                    <div>├── 🖼️ ภาพเดี่ยวทั่วไป...</div>
                    <div>└── 📁 [ชื่ออัลบั้ม]/</div>
                  </div>
                  <div class="flex items-center text-amber-700 font-medium pt-1">
                    <i data-lucide="folder" class="w-3.5 h-3.5 text-amber-500 mr-1.5"></i> 2.ไฟล์อื่นๆ/
                  </div>
                  <div class="pl-4 border-l-2 border-amber-200 ml-2 text-slate-500">
                    <div>└── 📄 PDF, Word, Excel, Video</div>
                  </div>
                </div>
                <div class="flex items-center pt-2">
                  <i data-lucide="folder" class="w-3.5 h-3.5 text-blue-500 mr-1.5"></i> [ชื่อกลุ่ม LINE 2]/ ...
                </div>
              </div>
            </div>

            <div class="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>พื้นที่ใช้งานประมาณ:</span>
              <span class="font-bold text-slate-800">${stats.totalStorageFormatted}</span>
            </div>
          </div>

        </div>

        <!-- Recent Files & Albums -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Recent Albums -->
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-slate-800 flex items-center">
                <i data-lucide="folder-heart" class="w-4 h-4 text-purple-600 mr-2"></i> อัลบั้มล่าสุด
              </h3>
              <button onclick="App.switchTab('gallery')" class="text-xs text-emerald-600 hover:underline font-medium">ดูทั้งหมด</button>
            </div>

            <div class="grid grid-cols-2 gap-3">
              ${recentAlbums.map(alb => `
                <div class="border border-slate-100 rounded-xl overflow-hidden hover:shadow-md transition cursor-pointer" onclick="App.openAlbumView('${alb.album_id}')">
                  <div class="h-24 bg-slate-100 relative">
                    <img src="${alb.cover_url || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=500'}" class="w-full h-full object-cover" alt="${alb.album_name}">
                    <span class="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                      ${alb.image_count || 0} ภาพ
                    </span>
                  </div>
                  <div class="p-2.5">
                    <h4 class="font-semibold text-xs text-slate-800 truncate" title="${alb.album_name}">${alb.album_name}</h4>
                    <p class="text-[10px] text-slate-400 mt-0.5 truncate">${this.getGroupName(alb.group_id)}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Recent Files List -->
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-slate-800 flex items-center">
                <i data-lucide="clock" class="w-4 h-4 text-blue-600 mr-2"></i> ไฟล์ล่าสุดที่เพิ่งบันทึก
              </h3>
              <button onclick="App.switchTab('files')" class="text-xs text-emerald-600 hover:underline font-medium">ดูทั้งหมด</button>
            </div>

            <div class="divide-y divide-slate-100">
              ${recentFiles.map(f => `
                <div class="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition">
                  <div class="flex items-center space-x-3 overflow-hidden">
                    <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${f.category === 'image' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}">
                      <i data-lucide="${f.category === 'image' ? 'image' : 'file-text'}" class="w-4 h-4"></i>
                    </div>
                    <div class="truncate">
                      <p class="text-xs font-semibold text-slate-800 truncate" title="${f.file_name}">${f.file_name}</p>
                      <p class="text-[11px] text-slate-400 truncate">โดย ${f.sender_name || 'สมาชิก'} • ${f.group_name || ''}</p>
                    </div>
                  </div>
                  <span class="text-[11px] font-mono text-slate-500 shrink-0 ml-2">${formatFileSize(f.file_size)}</span>
                </div>
              `).join('')}
            </div>
          </div>

        </div>

      </div>
    `;

    this.renderChart();
  },

  renderChart() {
    var ctx = document.getElementById("groupStorageChart");
    if (!ctx) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    var labels = this.groups.map(g => g.group_name.length > 20 ? g.group_name.substring(0, 18) + '...' : g.group_name);
    var imgCounts = this.groups.map(g => g.image_count || 0);
    var fileCounts = this.groups.map(g => g.file_count || 0);

    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: '1.รูปภาพ (ภาพ)',
            data: imgCounts,
            backgroundColor: '#059669',
            borderRadius: 6
          },
          {
            label: '2.ไฟล์อื่นๆ (ไฟล์)',
            data: fileCounts,
            backgroundColor: '#F59E0B',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: false },
          y: { beginAtZero: true }
        },
        plugins: {
          legend: { position: 'top' }
        }
      }
    });
  },

  // ==================================================================
  // 2. GROUPS VIEW
  // ==================================================================

  renderGroups(container) {
    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Header Actions -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold text-slate-800">จัดการกลุ่ม LINE</h2>
            <p class="text-xs sm:text-sm text-slate-500">ดูรายชื่อกลุ่ม LINE ที่เชื่อมต่อ และตั้งค่าการบันทึกไฟล์รายกลุ่ม</p>
          </div>
          <div class="flex items-center space-x-2">
            <button onclick="App.openAddGroupModal()" class="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm transition">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>เพิ่มกลุ่ม LINE ใหม่</span>
            </button>
          </div>
        </div>

        <!-- Groups Cards List -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${this.groups.map(g => {
            var hasActiveAlbum = g.active_album_id && g.active_album_name;
            var replyBadge = g.reply_mode === 'silent' 
              ? '<span class="bg-slate-100 text-slate-600 text-[11px] px-2 py-0.5 rounded font-medium">โหมดเงียบ</span>'
              : g.reply_mode === 'all'
              ? '<span class="bg-blue-100 text-blue-700 text-[11px] px-2 py-0.5 rounded font-medium">แจ้งทุกครั้ง</span>'
              : '<span class="bg-emerald-100 text-emerald-700 text-[11px] px-2 py-0.5 rounded font-medium">แจ้งเฉพาะสรุป/เอกสาร</span>';

            return `
              <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-emerald-300 transition">
                
                <!-- Card Header -->
                <div class="p-5">
                  <div class="flex items-start space-x-3">
                    <img src="${g.picture_url || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150'}" class="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-100" alt="${g.group_name}">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between">
                        <span class="text-[10px] font-mono text-slate-400 truncate">${g.group_id}</span>
                        ${replyBadge}
                      </div>
                      <h3 class="font-bold text-slate-800 text-sm sm:text-base truncate mt-0.5" title="${g.group_name}">${g.group_name}</h3>
                      <div class="flex items-center space-x-3 text-xs text-slate-500 mt-2">
                        <span>🖼️ ${g.image_count || 0} ภาพ</span>
                        <span>📄 ${g.file_count || 0} ไฟล์</span>
                      </div>
                    </div>
                  </div>

                  <!-- Active Album Status Banner -->
                  <div class="mt-4 p-3 rounded-xl ${hasActiveAlbum ? 'bg-purple-50 border border-purple-200 text-purple-900' : 'bg-slate-50 border border-slate-100 text-slate-600'} text-xs">
                    <div class="flex items-center justify-between font-semibold">
                      <span class="flex items-center">
                        <i data-lucide="${hasActiveAlbum ? 'folder-heart' : 'image'}" class="w-3.5 h-3.5 mr-1.5 ${hasActiveAlbum ? 'text-purple-600' : 'text-slate-400'}"></i>
                        โหมดรูปภาพปัจจุบัน:
                      </span>
                      ${hasActiveAlbum ? '<span class="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.2 rounded font-bold">ALBUM ACTIVE</span>' : '<span class="text-[10px] text-slate-400">ภาพเดี่ยว</span>'}
                    </div>
                    <p class="mt-1 font-medium truncate">${hasActiveAlbum ? g.active_album_name : 'บันทึกเป็นภาพเดี่ยวทั่วไป (พิมพ์ #อัลบั้ม เพื่อเริ่ม)'}</p>
                  </div>

                  <!-- Google Drive Subfolders Shortcut -->
                  <div class="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <a href="https://drive.google.com" target="_blank" class="flex items-center justify-center space-x-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-medium transition">
                      <i data-lucide="image" class="w-3.5 h-3.5 text-emerald-600"></i>
                      <span>📁 1.รูปภาพ</span>
                    </a>
                    <a href="https://drive.google.com" target="_blank" class="flex items-center justify-center space-x-1.5 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-medium transition">
                      <i data-lucide="file-text" class="w-3.5 h-3.5 text-amber-600"></i>
                      <span>📁 2.ไฟล์อื่นๆ</span>
                    </a>
                  </div>
                </div>

                <!-- Card Footer Controls -->
                <div class="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div class="flex items-center space-x-2">
                    <span class="w-2 h-2 rounded-full ${g.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}"></span>
                    <span class="text-slate-500">${g.status === 'active' ? 'ทำงานอัตโนมัติ' : 'หยุดชั่วคราว'}</span>
                  </div>
                  <div class="flex items-center space-x-1">
                    <button onclick="App.openEditGroupModal('${g.group_id}')" class="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-white rounded-lg transition" title="ตั้งค่ากลุ่ม">
                      <i data-lucide="settings-2" class="w-4 h-4"></i>
                    </button>
                    <button onclick="App.deleteGroup('${g.group_id}')" class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition" title="ลบกลุ่ม">
                      <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                  </div>
                </div>

              </div>
            `;
          }).join('')}
        </div>

      </div>
    `;
  },

  // ==================================================================
  // 3. GALLERY & ALBUMS VIEW (1.รูปภาพ)
  // ==================================================================

  renderGallery(container) {
    var filteredAlbums = this.albums;
    var filteredImages = this.files.filter(f => f.category === 'image');

    if (this.activeGroupFilter !== 'all') {
      filteredAlbums = filteredAlbums.filter(a => a.group_id === this.activeGroupFilter);
      filteredImages = filteredImages.filter(f => f.group_id === this.activeGroupFilter);
    }

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Section Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div class="flex items-center space-x-2">
              <span class="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">โฟลเดอร์ 1.รูปภาพ</span>
              <h2 class="text-xl font-bold text-slate-800">คลังรูปภาพและอัลบั้ม</h2>
            </div>
            <p class="text-xs sm:text-sm text-slate-500 mt-1">
              จัดเก็บภาพถ่ายจาก LINE ทุกภาพ โดยแยกเป็นภาพเดี่ยว และอัลบั้มที่แยกโฟลเดอร์ตามชื่อ
            </p>
          </div>

          <div class="flex items-center space-x-2">
            <!-- View Mode Switch -->
            <div class="bg-slate-100 p-1 rounded-lg flex items-center text-xs font-semibold text-slate-600">
              <button onclick="App.switchGallerySubTab('albums')" class="px-3 py-1.5 rounded-md flex items-center space-x-1.5 ${this.gallerySubTab === 'albums' ? 'bg-white text-emerald-700 shadow-sm' : ''}">
                <i data-lucide="folder-heart" class="w-3.5 h-3.5"></i>
                <span>โฟลเดอร์อัลบั้ม (${filteredAlbums.length})</span>
              </button>
              <button onclick="App.switchGallerySubTab('single')" class="px-3 py-1.5 rounded-md flex items-center space-x-1.5 ${this.gallerySubTab === 'single' ? 'bg-white text-emerald-700 shadow-sm' : ''}">
                <i data-lucide="image" class="w-3.5 h-3.5"></i>
                <span>ภาพทั้งหมด (${filteredImages.length})</span>
              </button>
            </div>

            <button onclick="App.openCreateAlbumModal()" class="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium px-3.5 py-2 rounded-lg shadow-sm transition">
              <i data-lucide="folder-plus" class="w-4 h-4"></i>
              <span>สร้างอัลบั้มใหม่</span>
            </button>
          </div>
        </div>

        <!-- SUB TAB 1: ALBUMS LIST -->
        ${this.gallerySubTab === 'albums' ? `
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            ${filteredAlbums.map(alb => {
              var parentGroup = this.groups.find(g => g.group_id === alb.group_id);
              var isActive = parentGroup && parentGroup.active_album_id === alb.album_id;

              return `
                <div class="bg-white rounded-2xl border ${isActive ? 'border-purple-400 ring-2 ring-purple-100' : 'border-slate-200'} shadow-sm overflow-hidden hover:shadow-md transition flex flex-col justify-between group">
                  
                  <!-- Cover Image -->
                  <div class="h-44 bg-slate-100 relative cursor-pointer overflow-hidden" onclick="App.openAlbumView('${alb.album_id}')">
                    <img src="${alb.cover_url || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600'}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" alt="${alb.album_name}">
                    
                    ${isActive ? `
                      <span class="absolute top-2 left-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center space-x-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                        <span>ACTIVE ALBUM</span>
                      </span>
                    ` : ''}

                    <span class="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-lg font-mono flex items-center space-x-1">
                      <i data-lucide="image" class="w-3 h-3"></i>
                      <span>${alb.image_count || 0} ภาพ</span>
                    </span>
                  </div>

                  <!-- Details -->
                  <div class="p-4">
                    <span class="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">${this.getGroupName(alb.group_id)}</span>
                    <h3 class="font-bold text-slate-800 text-sm mt-1.5 truncate cursor-pointer hover:text-emerald-600" onclick="App.openAlbumView('${alb.album_id}')" title="${alb.album_name}">${alb.album_name}</h3>
                    <p class="text-[11px] text-slate-400 mt-1">สร้างโดย: ${alb.created_by || 'สมาชิก'}</p>

                    <!-- Active Toggle Button -->
                    <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button onclick="App.toggleActiveAlbum('${alb.group_id}', '${alb.album_id}')" class="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition ${isActive ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'}">
                        ${isActive ? '✓ ปิดโหมดอัลบั้ม' : '📸 ตั้งเป็นอัลบั้มบันทึก'}
                      </button>
                      <a href="${alb.folder_url || 'https://drive.google.com'}" target="_blank" class="text-slate-400 hover:text-emerald-600 p-1" title="เปิดใน Google Drive">
                        <i data-lucide="external-link" class="w-4 h-4"></i>
                      </a>
                    </div>
                  </div>

                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <!-- SUB TAB 2: ALL PHOTOS GRID -->
          <div class="space-y-4">
            
            <!-- Batch Actions Bar -->
            <div class="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
              <div class="flex items-center space-x-3">
                <span class="font-medium text-slate-600">เลือกแล้ว: <strong id="selected-count" class="text-emerald-600">${this.selectedFileIds.length}</strong> ภาพ</span>
              </div>
              <div class="flex items-center space-x-2">
                <button onclick="App.openMoveToAlbumModal()" class="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition flex items-center space-x-1.5">
                  <i data-lucide="folder-input" class="w-3.5 h-3.5"></i>
                  <span>ย้ายรูปที่เลือกเข้าโฟลเดอร์อัลบั้ม</span>
                </button>
              </div>
            </div>

            <!-- Photos Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              ${filteredImages.map(img => {
                var isSelected = this.selectedFileIds.includes(img.file_id);
                return `
                  <div class="img-card bg-white rounded-xl border ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-200'} shadow-sm overflow-hidden relative group">
                    
                    <!-- Checkbox -->
                    <input type="checkbox" onchange="App.toggleFileSelection('${img.file_id}', this.checked)" ${isSelected ? 'checked' : ''} class="absolute top-2 left-2 z-10 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-white/80 cursor-pointer">

                    <!-- Thumbnail -->
                    <div class="h-36 bg-slate-100 relative cursor-pointer" onclick="App.openLightbox('${img.drive_url || img.thumbnail_url}', '${img.file_name}', '${img.album_name}', '${img.sender_name}')">
                      <img src="${img.thumbnail_url || img.drive_url}" class="w-full h-full object-cover" alt="${img.file_name}">
                      ${img.album_name ? `<span class="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded truncate max-w-[85%]">${img.album_name}</span>` : '<span class="absolute bottom-1.5 left-1.5 bg-emerald-600/80 text-white text-[9px] px-1.5 py-0.5 rounded">ภาพเดี่ยว</span>'}
                    </div>

                    <!-- Meta -->
                    <div class="p-2">
                      <p class="text-[11px] font-semibold text-slate-800 truncate" title="${img.file_name}">${img.file_name}</p>
                      <div class="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span>${img.sender_name || 'สมาชิก'}</span>
                        <span>${formatFileSize(img.file_size)}</span>
                      </div>
                    </div>

                  </div>
                `;
              }).join('')}
            </div>

          </div>
        `}

      </div>
    `;
  },

  switchGallerySubTab(subTab) {
    this.gallerySubTab = subTab;
    this.renderGallery(document.getElementById("tab-content"));
    lucide.createIcons();
  },

  toggleFileSelection(fileId, checked) {
    if (checked) {
      if (!this.selectedFileIds.includes(fileId)) this.selectedFileIds.push(fileId);
    } else {
      this.selectedFileIds = this.selectedFileIds.filter(id => id !== fileId);
    }
    var countEl = document.getElementById("selected-count");
    if (countEl) countEl.innerText = this.selectedFileIds.length;
  },

  // ==================================================================
  // 4. OTHER FILES VIEW (2.ไฟล์อื่นๆ)
  // ==================================================================

  renderFiles(container) {
    var otherFiles = this.files.filter(f => f.category === 'other');
    if (this.activeGroupFilter !== 'all') {
      otherFiles = otherFiles.filter(f => f.group_id === this.activeGroupFilter);
    }
    if (this.searchKeyword) {
      var kw = this.searchKeyword.toLowerCase();
      otherFiles = otherFiles.filter(f => 
        (f.file_name && f.file_name.toLowerCase().includes(kw)) ||
        (f.sender_name && f.sender_name.toLowerCase().includes(kw))
      );
    }

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div class="flex items-center space-x-2">
              <span class="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold">โฟลเดอร์ 2.ไฟล์อื่นๆ</span>
              <h2 class="text-xl font-bold text-slate-800">คลังเอกสารและไฟล์อื่นๆ</h2>
            </div>
            <p class="text-xs sm:text-sm text-slate-500 mt-1">
              จัดเก็บไฟล์เอกสาร (PDF, Word, Excel, PowerPoint), วิดีโอ (MP4), ไฟล์เสียง และไฟล์บีบอัด (ZIP) จาก LINE
            </p>
          </div>

          <!-- Search Filter -->
          <div class="flex items-center space-x-2">
            <div class="relative">
              <input type="text" oninput="App.handleFileSearch(this.value)" value="${this.searchKeyword}" placeholder="ค้นหาชื่อไฟล์ หรือผู้ส่ง..." class="text-xs sm:text-sm bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none w-56">
              <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5"></i>
            </div>
            <button onclick="App.openUploadModal('other')" class="inline-flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-medium px-3.5 py-2 rounded-lg shadow-sm transition">
              <i data-lucide="upload" class="w-4 h-4"></i>
              <span>อัปโหลดเอกสาร</span>
            </button>
          </div>
        </div>

        <!-- Files Table -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs sm:text-sm text-slate-600">
              <thead class="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th class="py-3.5 px-4">ชื่อไฟล์</th>
                  <th class="py-3.5 px-4">กลุ่ม LINE</th>
                  <th class="py-3.5 px-4">ผู้ส่งในแชท</th>
                  <th class="py-3.5 px-4">ขนาดไฟล์</th>
                  <th class="py-3.5 px-4">วันที่บันทึก</th>
                  <th class="py-3.5 px-4 text-center">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${otherFiles.length === 0 ? `
                  <tr>
                    <td colspan="6" class="py-8 text-center text-slate-400">
                      <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 text-slate-300"></i>
                      ไม่พบไฟล์เอกสารในเงื่อนไขที่เลือก
                    </td>
                  </tr>
                ` : otherFiles.map(f => {
                  var icon = f.file_name.endsWith('.pdf') ? 'file-text' : f.file_name.endsWith('.xlsx') ? 'sheet' : f.file_name.endsWith('.mp4') ? 'video' : 'file';
                  var iconColor = f.file_name.endsWith('.pdf') ? 'text-red-600 bg-red-50' : f.file_name.endsWith('.xlsx') ? 'text-emerald-600 bg-emerald-50' : 'text-blue-600 bg-blue-50';

                  return `
                    <tr class="hover:bg-slate-50 transition">
                      <td class="py-3 px-4">
                        <div class="flex items-center space-x-3">
                          <div class="w-8 h-8 rounded-lg ${iconColor} flex items-center justify-center shrink-0">
                            <i data-lucide="${icon}" class="w-4 h-4"></i>
                          </div>
                          <div class="font-medium text-slate-800 truncate max-w-xs sm:max-w-md" title="${f.file_name}">
                            ${f.file_name}
                          </div>
                        </div>
                      </td>
                      <td class="py-3 px-4 font-medium text-slate-600 truncate max-w-[150px]">${f.group_name || this.getGroupName(f.group_id)}</td>
                      <td class="py-3 px-4 text-slate-500">${f.sender_name || 'สมาชิก'}</td>
                      <td class="py-3 px-4 font-mono text-slate-500">${formatFileSize(f.file_size)}</td>
                      <td class="py-3 px-4 text-slate-400 text-xs">${f.created_at ? new Date(f.created_at).toLocaleDateString('th-TH') : '-'}</td>
                      <td class="py-3 px-4 text-center">
                        <a href="${f.drive_url || 'https://drive.google.com'}" target="_blank" class="inline-flex items-center space-x-1 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg font-medium transition">
                          <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                          <span>เปิดใน Drive</span>
                        </a>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  },

  handleFileSearch(kw) {
    this.searchKeyword = kw;
    this.renderFiles(document.getElementById("tab-content"));
    lucide.createIcons();
  },

  // ==================================================================
  // 5. SIMULATOR & COMMANDS VIEW
  // ==================================================================

  renderSimulator(container) {
    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Chat Simulator Panel -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-2 flex flex-col h-[650px]">
          
          <!-- Chat Header -->
          <div class="bg-emerald-600 text-white p-4 flex items-center justify-between shadow-sm">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">🤖</div>
              <div>
                <h3 class="font-bold text-sm">LINE Keep Bot Simulator (ทดสอบส่งไฟล์)</h3>
                <p class="text-xs text-emerald-100">จำลองการทำงานของ LINE Webhook ในห้องแชทกลุ่ม</p>
              </div>
            </div>
            <button onclick="App.clearChatSimulator()" class="text-xs bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded transition">ล้างแชท</button>
          </div>

          <!-- Chat Messages Area -->
          <div id="sim-chat-area" class="flex-1 p-4 overflow-y-auto space-y-3 bg-[#849EB8]">
            <div class="text-center my-2">
              <span class="bg-black/20 text-white text-[11px] px-3 py-1 rounded-full">เริ่มต้นการจำลองห้องแชทกลุ่ม LINE</span>
            </div>

            <!-- Bot Greeting -->
            <div class="flex items-start space-x-2">
              <div class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shrink-0 font-bold">🤖</div>
              <div class="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-xs text-slate-800 max-w-[85%] whitespace-pre-line leading-relaxed">
🤖 ยินดีต้อนรับสู่ LINE Keep Bot!
บอทนี้จะช่วยจัดเก็บรูปภาพและไฟล์ทั้งหมดในกลุ่มเข้า Google Drive อัตโนมัติ:
📁 โฟลเดอร์กลุ่ม: ทีมพัฒนาแอปพลิเคชัน & ไอที
  ├ 📸 1.รูปภาพ (แยกภาพเดี่ยว & อัลบั้ม)
  └ 📄 2.ไฟล์อื่นๆ (PDF, Word, Excel, Video)

💡 ลองพิมพ์คำสั่งทดสอบด้านล่างได้เลยครับ เช่น:
• #อัลบั้ม สำรวจหน้างานเชียงใหม่
• #สถานะ
              </div>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div class="bg-slate-100 p-2.5 border-t border-slate-200 flex flex-wrap gap-2 text-xs">
            <button onclick="App.sendSimulatedAction('album_start')" class="bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 px-2.5 py-1 rounded-lg border border-slate-200 font-medium transition">
              💬 พิมพ์: #อัลบั้ม งานสัมมนา 2026
            </button>
            <button onclick="App.sendSimulatedAction('send_single_image')" class="bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 px-2.5 py-1 rounded-lg border border-slate-200 font-medium transition">
              🖼️ ส่งภาพเดี่ยว
            </button>
            <button onclick="App.sendSimulatedAction('send_imageset')" class="bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 px-2.5 py-1 rounded-lg border border-slate-200 font-medium transition">
              📸 ส่งชุด 3 รูปพร้อมกัน (imageSet)
            </button>
            <button onclick="App.sendSimulatedAction('send_pdf')" class="bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 px-2.5 py-1 rounded-lg border border-slate-200 font-medium transition">
              📑 ส่งไฟล์ PDF
            </button>
            <button onclick="App.sendSimulatedAction('status')" class="bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 px-2.5 py-1 rounded-lg border border-slate-200 font-medium transition">
              📊 พิมพ์: #สถานะ
            </button>
            <button onclick="App.sendSimulatedAction('album_end')" class="bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 px-2.5 py-1 rounded-lg border border-slate-200 font-medium transition">
              ⏹️ พิมพ์: #จบอัลบั้ม
            </button>
          </div>

          <!-- Text Input Simulator -->
          <div class="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
            <input type="text" id="sim-input" placeholder="พิมพ์ข้อความหรือคำสั่ง เช่น #อัลบั้ม ประชุมบอร์ด..." onkeydown="if(event.key==='Enter') App.sendSimulatedCustomMessage()" class="flex-1 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
            <button onclick="App.sendSimulatedCustomMessage()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition">ส่ง</button>
          </div>

        </div>

        <!-- Commands Reference Table -->
        <div class="space-y-4">
          
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 class="font-bold text-slate-800 text-sm flex items-center mb-3">
              <i data-lucide="book-open" class="w-4 h-4 text-emerald-600 mr-2"></i> คำสั่งแชท LINE Bot
            </h3>
            <div class="space-y-3 text-xs">
              
              <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <code class="text-emerald-700 font-bold font-mono">#อัลบั้ม [ชื่ออัลบั้ม]</code>
                <p class="text-slate-600 mt-1">สร้างโฟลเดอร์อัลบั้มใน Google Drive และเปลี่ยนโหมดกลุ่มให้บันทึกรูปเข้าอัลบั้มนี้ทันที</p>
              </div>

              <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <code class="text-emerald-700 font-bold font-mono">#จบอัลบั้ม</code>
                <p class="text-slate-600 mt-1">ปิดโหมดอัลบั้ม สลับกลับมาบันทึกรูปภาพเป็นภาพเดี่ยวทั่วไป</p>
              </div>

              <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <code class="text-emerald-700 font-bold font-mono">#สถานะ</code>
                <p class="text-slate-600 mt-1">ขอดูสถิติจำนวนไฟล์ อัลบั้มที่เปิดอยู่ และรับลิงก์ Google Drive ของกลุ่ม</p>
              </div>

              <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <code class="text-emerald-700 font-bold font-mono">#ช่วยเหลือ</code>
                <p class="text-slate-600 mt-1">แสดงรายการคำสั่งช่วยเหลือและคำแนะนำการใช้งาน</p>
              </div>

            </div>
          </div>

          <!-- Feature Tip Card -->
          <div class="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-2xl border border-indigo-100 text-xs space-y-2 text-indigo-900">
            <h4 class="font-bold flex items-center">
              <i data-lucide="sparkles" class="w-4 h-4 text-indigo-600 mr-1.5"></i> ระบบจัดเก็บอัตโนมัติ 100%
            </h4>
            <p class="leading-relaxed text-indigo-800">
              เมื่อมีสมาชิกส่งรูปภาพหรือไฟล์เอกสารเข้ามา ระบบจะจัดเก็บลง Google Drive โดยอัตโนมัติทันที แม้ไม่มีการพิมพ์คำสั่งก็ตาม (รูปเดี่ยวจะเข้า 1.รูปภาพ, เอกสารจะเข้า 2.ไฟล์อื่นๆ)
            </p>
          </div>

        </div>

      </div>
    `;
  },

  sendSimulatedAction(actionType) {
    var chat = document.getElementById("sim-chat-area");
    var group = this.groups[0] || { group_name: "ทีมพัฒนาแอปพลิเคชัน" };

    if (actionType === 'album_start') {
      this.appendUserChat("📸 #อัลบั้ม งานสัมมนา 2026");
      setTimeout(() => {
        this.appendBotChat(`📸 เปิดโหมดอัลบั้มสำเร็จ!\n\n📂 โฟลเดอร์อัลบั้ม: "งานสัมมนา 2026"\n⏰ ระยะเวลาเปิดโหมด: 60 นาที (หรือจนกว่าจะพิมพ์ #จบอัลบั้ม)\n\nรูปภาพที่ส่งหลังจากนี้จะถูกบันทึกแยกเข้าโฟลเดอร์นี้ทั้งหมดอัตโนมัติครับ\n🔗 ลิงก์อัลบั้ม: https://drive.google.com`);
      }, 400);
    } else if (actionType === 'send_single_image') {
      this.appendUserChat("🖼️ [ส่งรูปภาพ: IMG_20261020_001.jpg]");
      setTimeout(() => {
        this.appendBotChat(`📸 บันทึกรูปภาพสำเร็จ!\n📁 ภาพเดี่ยวทั่วไป (1.รูปภาพ)\n💾 ขนาด: 2.45 MB\n🔗 ลิงก์ Drive: https://drive.google.com`);
      }, 500);
    } else if (actionType === 'send_imageset') {
      this.appendUserChat("📸 [ส่งชุดรูปภาพ 3 ภาพพร้อมกัน: imageSet]");
      setTimeout(() => {
        this.appendBotChat(`📸 บันทึกชุดรูปภาพสำเร็จ (3 ภาพ)\n📁 จัดเก็บใน: ชุดรูปภาพ_20261020_2130 (3 ภาพ)\n🔗 ลิงก์โฟลเดอร์: https://drive.google.com`);
      }, 700);
    } else if (actionType === 'send_pdf') {
      this.appendUserChat("📑 [ส่งไฟล์เอกสาร: แผนงานโครงการ_Q4.pdf]");
      setTimeout(() => {
        this.appendBotChat(`📑 บันทึกไฟล์เอกสารสำเร็จ!\n📄 ชื่อไฟล์: แผนงานโครงการ_Q4.pdf\n💾 ขนาด: 1.84 MB\n📁 จัดเก็บใน: 2.ไฟล์อื่นๆ\n🔗 ลิงก์ไฟล์: https://drive.google.com`);
      }, 450);
    } else if (actionType === 'status') {
      this.appendUserChat("#สถานะ");
      setTimeout(() => {
        this.appendBotChat(`📊 สถานะการบันทึกกลุ่ม LINE Keep Bot\n────────────────────\n👥 ชื่อกลุ่ม: ${group.group_name}\n🎯 โหมดปัจจุบัน: ภาพเดี่ยวทั่วไป\n🖼️ รูปภาพที่บันทึกแล้ว: 42 ภาพ\n📄 ไฟล์อื่นๆ ที่บันทึกแล้ว: 18 ไฟล์\n🔔 การแจ้งเตือน: โหมดสรุป\n\n🔗 โฟลเดอร์หลักใน Drive:\nhttps://drive.google.com`);
      }, 350);
    } else if (actionType === 'album_end') {
      this.appendUserChat("#จบอัลบั้ม");
      setTimeout(() => {
        this.appendBotChat(`✅ จบการบันทึกเข้าอัลบั้มเรียบร้อยแล้ว\n📂 อัลบั้มที่ปิด: "งานสัมมนา 2026"\n📷 รูปภาพที่ส่งหลังจากนี้จะถูกบันทึกเป็นภาพเดี่ยวทั่วไป`);
      }, 350);
    }
  },

  sendSimulatedCustomMessage() {
    var input = document.getElementById("sim-input");
    var txt = input.value.trim();
    if (!txt) return;

    this.appendUserChat(txt);
    input.value = "";

    setTimeout(() => {
      if (txt.startsWith("#อัลบั้ม") || txt.startsWith("/album")) {
        var name = txt.replace(/^(#อัลบั้ม|\/album)\s*/, "").trim() || "อัลบั้มใหม่";
        this.appendBotChat(`📸 เปิดโหมดอัลบั้มสำเร็จ!\n📂 โฟลเดอร์อัลบั้ม: "${name}"\n⏰ รูปภาพที่ส่งหลังจากนี้จะเข้าโฟลเดอร์นี้ทั้งหมดครับ`);
      } else if (txt === "#จบอัลบั้ม" || txt === "#ปิดอัลบั้ม") {
        this.appendBotChat("✅ จบการบันทึกเข้าอัลบั้มเรียบร้อยแล้ว สลับสู่โหมดภาพเดี่ยว");
      } else if (txt === "#สถานะ" || txt === "#drive") {
        this.appendBotChat("📊 รายงานสถานะกลุ่ม: บันทึกไฟล์และภาพเรียบร้อย โฟลเดอร์ Google Drive พร้อมใช้งาน");
      } else {
        this.appendBotChat("💡 รับข้อความเรียบร้อย (พิมพ์ #ช่วยเหลือ เพื่อดูรายการคำสั่งที่มี)");
      }
    }, 400);
  },

  appendUserChat(text) {
    var chat = document.getElementById("sim-chat-area");
    var div = document.createElement("div");
    div.className = "flex justify-end";
    div.innerHTML = `
      <div class="bg-[#5AC463] text-white p-2.5 px-3 rounded-2xl rounded-tr-none shadow-sm text-xs max-w-[80%] whitespace-pre-line">
        ${text}
      </div>
    `;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  },

  appendBotChat(text) {
    var chat = document.getElementById("sim-chat-area");
    var div = document.createElement("div");
    div.className = "flex items-start space-x-2";
    div.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shrink-0 font-bold">🤖</div>
      <div class="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-xs text-slate-800 max-w-[85%] whitespace-pre-line leading-relaxed">
        ${text}
      </div>
    `;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  },

  clearChatSimulator() {
    var chat = document.getElementById("sim-chat-area");
    chat.innerHTML = `
      <div class="text-center my-2">
        <span class="bg-black/20 text-white text-[11px] px-3 py-1 rounded-full">รีเซ็ตห้องแชทจำลองแล้ว</span>
      </div>
    `;
  },

  // ==================================================================
  // 6. SETTINGS VIEW
  // ==================================================================

  renderSettings(container) {
    var currentGasUrl = AppConfig.getGasUrl();
    var isMock = AppConfig.isMockMode();
    var lineToken = AppConfig.getLineToken();
    var rootFolderId = AppConfig.getRootFolderId();

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6">
        
        <div>
          <h2 class="text-xl font-bold text-slate-800">ตั้งค่าระบบและการเชื่อมต่อ</h2>
          <p class="text-xs sm:text-sm text-slate-500">กำหนดค่า Google Apps Script Web App URL และ LINE Developers Channel Token</p>
        </div>

        <!-- Mode Toggle Switch Card -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div class="flex items-center space-x-2">
              <span class="w-3 h-3 rounded-full ${isMock ? 'bg-amber-500' : 'bg-emerald-500'}"></span>
              <h3 class="font-bold text-slate-800 text-sm sm:text-base">สถานะการทำงานปัจจุบัน</h3>
            </div>
            <p class="text-xs text-slate-500 mt-1">
              ${isMock ? 'กำลังทำงานในโหมดจำลอง (Demo Mode) เหมาะสำหรับการทดสอบหน้าเว็บโดยไม่ต้องต่อระบบจริง' : 'กำลังเชื่อมต่อกับ Google Apps Script Backend จริง'}
            </p>
          </div>
          <button onclick="App.toggleMockMode()" class="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${isMock ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-amber-100 hover:bg-amber-200 text-amber-800'}">
            ${isMock ? 'สลับเป็นโหมดเชื่อมต่อสด (Live GAS)' : 'สลับเป็นโหมดจำลอง (Demo Mode)'}
          </button>
        </div>

        <!-- Google Apps Script Connection -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 class="font-bold text-slate-800 flex items-center">
            <i data-lucide="link" class="w-4 h-4 text-emerald-600 mr-2"></i> Google Apps Script Web App URL
          </h3>
          <p class="text-xs text-slate-500">
            วาง URL ที่ได้จากการกด "Deploy" > "New deployment" > "Web app" บน Google Apps Script
          </p>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Web App URL</label>
            <input type="text" id="setting-gas-url" value="${currentGasUrl}" placeholder="https://script.google.com/macros/s/AKfycbx.../exec" class="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono">
          </div>

          <div class="flex items-center space-x-3 pt-2">
            <button onclick="App.saveGasSettings()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition">
              บันทึก Web App URL
            </button>
            <button onclick="App.testGasConnection()" class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition">
              ทดสอบการเชื่อมต่อ
            </button>
          </div>
        </div>

        <!-- LINE Messaging API Settings -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 class="font-bold text-slate-800 flex items-center">
            <i data-lucide="bot" class="w-4 h-4 text-emerald-600 mr-2"></i> LINE Developers Messaging API
          </h3>
          <p class="text-xs text-slate-500">
            นำ Channel Access Token จาก LINE Developers Console มาใส่เพื่ออนุญาตให้บอทดึงรูปและตอบกลับในกลุ่ม
          </p>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Channel Access Token (Long-lived)</label>
            <input type="text" id="setting-line-token" value="${lineToken}" placeholder="eyJhbGciOi..." class="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono">
          </div>

          <div class="flex items-center space-x-3 pt-2">
            <button onclick="App.saveLineSettings()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition">
              บันทึก LINE Token
            </button>
            <button onclick="App.testLineBotConnection()" class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition">
              ทดสอบเชื่อมต่อ LINE Bot
            </button>
          </div>
        </div>

        <!-- Setup Instructions Card -->
        <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 text-xs text-slate-700">
          <h3 class="font-bold text-slate-800 text-sm flex items-center">
            <i data-lucide="help-circle" class="w-4 h-4 text-blue-600 mr-2"></i> วิธีการติดตั้งและเริ่มใช้งาน (3 ขั้นตอน)
          </h3>
          <ol class="list-decimal pl-5 space-y-2 leading-relaxed">
            <li><strong>สร้าง Google Sheets และ Apps Script</strong>: นำโค้ดในโฟลเดอร์ <code>backend/</code> (Setup.gs, LineBot.gs, Code.gs) ไปวางใน Apps Script จากนั้นรันฟังก์ชัน <code>setupDatabase()</code> หนึ่งครั้ง</li>
            <li><strong>Deploy Web App</strong>: เลือก Execute as = "Me", Who has access = "Anyone" แล้วคัดลอก URL มาใส่ในช่องด้านบน</li>
            <li><strong>ตั้งค่า LINE Webhook</strong>: นำ Web App URL ไปใส่ในช่อง <strong>Webhook URL</strong> บน LINE Developers Console และเปิดใช้งานสวิตช์ "Use webhook" + เชิญบอทเข้ากลุ่ม LINE</li>
          </ol>
        </div>

      </div>
    `;
  },

  saveGasSettings() {
    var url = document.getElementById("setting-gas-url").value.trim();
    AppConfig.setGasUrl(url);
    if (url) {
      AppConfig.setMockMode(false);
    }
    this.showToast("บันทึก Web App URL สำเร็จแล้ว!", "success");
    this.renderLayout();
    this.switchTab("settings");
  },

  saveLineSettings() {
    var token = document.getElementById("setting-line-token").value.trim();
    AppConfig.setLineToken(token);
    this.showToast("บันทึก LINE Token สำเร็จแล้ว!", "success");
  },

  async testGasConnection() {
    try {
      this.showLoading(true);
      var res = await ApiService.getDashboard();
      if (res.success) {
        this.showToast("✅ เชื่อมต่อ Google Apps Script สำเร็จ!", "success");
      } else {
        this.showToast("⚠️ ไม่สามารถรับข้อมูลได้: " + res.error, "error");
      }
    } catch (e) {
      this.showToast("❌ เชื่อมต่อไม่สำเร็จ: " + e.message, "error");
    } finally {
      this.showLoading(false);
    }
  },

  async testLineBotConnection() {
    try {
      this.showLoading(true);
      var token = AppConfig.getLineToken();
      var res = await ApiService.testLineConnection(token);
      if (res.success) {
        this.showToast("✅ " + res.message, "success");
      } else {
        this.showToast("❌ " + res.error, "error");
      }
    } catch (e) {
      this.showToast("❌ เกิดข้อผิดพลาด: " + e.message, "error");
    } finally {
      this.showLoading(false);
    }
  },

  toggleMockMode() {
    var nowMock = AppConfig.isMockMode();
    AppConfig.setMockMode(!nowMock);
    this.showToast(nowMock ? "สลับเข้าสู่โหมดเชื่อมต่อสด (Live GAS)" : "สลับเข้าสู่โหมดจำลอง (Demo Mode)", "info");
    this.renderLayout();
    this.loadData().then(() => {
      this.switchTab("settings");
    });
  },

  // ==================================================================
  // MODALS & DIALOGS
  // ==================================================================

  openAddGroupModal() {
    var container = document.getElementById("modal-container");
    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl modal-enter space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="font-bold text-slate-800 text-base">เพิ่มกลุ่ม LINE ใหม่</h3>
            <button onclick="App.closeModal()" class="text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="space-y-3 text-xs sm:text-sm">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">ชื่อกลุ่ม LINE *</label>
              <input type="text" id="modal-group-name" placeholder="เช่น ทีมปฏิบัติการภาคสนาม 2026" class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">LINE Group ID (ถ้าทราบ)</label>
              <input type="text" id="modal-group-id" placeholder="เช่น c1a2b3c4... หรือเว้นว่างเพื่อสร้างอัตโนมัติ" class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono">
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">โหมดการตอบกลับของบอท</label>
              <select id="modal-reply-mode" class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                <option value="summary">แจ้งเฉพาะสรุป/เอกสาร (แนะนำ)</option>
                <option value="silent">โหมดเงียบ (ไม่ส่งข้อความรบกวน)</option>
                <option value="all">แจ้งทุกครั้งที่มีการบันทึก</option>
              </select>
            </div>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button onclick="App.closeModal()" class="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium text-xs sm:text-sm transition">ยกเลิก</button>
            <button onclick="App.submitAddGroup()" class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm transition">สร้างกลุ่มและโฟลเดอร์</button>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  },

  async submitAddGroup() {
    var name = document.getElementById("modal-group-name").value.trim();
    var id = document.getElementById("modal-group-id").value.trim();
    var replyMode = document.getElementById("modal-reply-mode").value;

    if (!name) {
      alert("กรุณาระบุชื่อกลุ่ม LINE");
      return;
    }

    try {
      this.showLoading(true);
      var res = await ApiService.saveGroup({
        group_id: id || undefined,
        group_name: name,
        reply_mode: replyMode
      });
      if (res.success) {
        this.showToast("สร้างกลุ่มและโฟลเดอร์ใน Drive สำเร็จ!", "success");
        this.closeModal();
        await this.loadData();
        this.switchTab("groups");
      } else {
        alert(res.error);
      }
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      this.showLoading(false);
    }
  },

  openCreateAlbumModal() {
    var container = document.getElementById("modal-container");
    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl modal-enter space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="font-bold text-slate-800 text-base">สร้างอัลบั้มรูปภาพใหม่</h3>
            <button onclick="App.closeModal()" class="text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="space-y-3 text-xs sm:text-sm">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">กลุ่ม LINE ปลายทาง *</label>
              <select id="modal-album-group" class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                ${this.groups.map(g => `<option value="${g.group_id}" ${this.activeGroupFilter === g.group_id ? 'selected' : ''}>${g.group_name}</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">ชื่ออัลบั้ม (ชื่อโฟลเดอร์ใน Drive) *</label>
              <input type="text" id="modal-album-name" placeholder="เช่น สำรวจหน้างานเชียงใหม่ 2026" class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
            </div>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button onclick="App.closeModal()" class="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium text-xs sm:text-sm transition">ยกเลิก</button>
            <button onclick="App.submitCreateAlbum()" class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm transition">สร้างโฟลเดอร์อัลบั้ม</button>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  },

  async submitCreateAlbum() {
    var groupId = document.getElementById("modal-album-group").value;
    var name = document.getElementById("modal-album-name").value.trim();

    if (!name) {
      alert("กรุณาระบุชื่ออัลบั้ม");
      return;
    }

    try {
      this.showLoading(true);
      var res = await ApiService.createAlbum(groupId, name);
      if (res.success) {
        this.showToast("สร้างโฟลเดอร์อัลบั้มสำเร็จ!", "success");
        this.closeModal();
        await this.loadData();
        this.switchTab("gallery");
      } else {
        alert(res.error);
      }
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      this.showLoading(false);
    }
  },

  async toggleActiveAlbum(groupId, albumId) {
    var group = this.groups.find(g => g.group_id === groupId);
    var isCurrentActive = group && group.active_album_id === albumId;
    var targetAlbumId = isCurrentActive ? "" : albumId;

    try {
      this.showLoading(true);
      var res = await ApiService.setActiveAlbum(groupId, targetAlbumId, 60);
      if (res.success) {
        this.showToast(res.message, "success");
        await this.loadData();
        this.switchTab("gallery");
      } else {
        alert(res.error);
      }
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      this.showLoading(false);
    }
  },

  openMoveToAlbumModal() {
    if (this.selectedFileIds.length === 0) {
      alert("กรุณาเลือกรูปภาพที่ต้องการย้ายอย่างน้อย 1 ภาพ");
      return;
    }

    var container = document.getElementById("modal-container");
    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl modal-enter space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="font-bold text-slate-800 text-base">ย้าย ${this.selectedFileIds.length} รูปภาพเข้าอัลบั้ม</h3>
            <button onclick="App.closeModal()" class="text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="space-y-3 text-xs sm:text-sm">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">เลือกอัลบั้มปลายทาง *</label>
              <select id="modal-target-album" class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                ${this.albums.map(a => `<option value="${a.album_id}" data-name="${a.album_name}">${a.album_name} (${this.getGroupName(a.group_id)})</option>`).join('')}
              </select>
            </div>
            <p class="text-slate-500 text-xs">ระบบจะทำการย้ายตำแหน่งไฟล์จริงใน Google Drive และอัปเดตข้อมูลเมตาเดตาให้อัตโนมัติ</p>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button onclick="App.closeModal()" class="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium text-xs sm:text-sm transition">ยกเลิก</button>
            <button onclick="App.submitMoveToAlbum()" class="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs sm:text-sm transition">ยืนยันการย้าย</button>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  },

  async submitMoveToAlbum() {
    var select = document.getElementById("modal-target-album");
    var albumId = select.value;
    var albumName = select.options[select.selectedIndex].getAttribute("data-name");

    try {
      this.showLoading(true);
      var res = await ApiService.moveFilesToAlbum(this.selectedFileIds, albumId, albumName);
      if (res.success) {
        this.showToast(res.message, "success");
        this.selectedFileIds = [];
        this.closeModal();
        await this.loadData();
        this.switchTab("gallery");
      } else {
        alert(res.error);
      }
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      this.showLoading(false);
    }
  },

  openUploadModal(category = "image") {
    var container = document.getElementById("modal-container");
    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl modal-enter space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="font-bold text-slate-800 text-base">อัปโหลดไฟล์เข้า Google Drive</h3>
            <button onclick="App.closeModal()" class="text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="space-y-3 text-xs sm:text-sm">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">กลุ่ม LINE ปลายทาง *</label>
              <select id="modal-upload-group" class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                ${this.groups.map(g => `<option value="${g.group_id}" ${this.activeGroupFilter === g.group_id ? 'selected' : ''}>${g.group_name}</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">ประเภทการจัดเก็บ</label>
              <select id="modal-upload-category" class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none" onchange="App.handleUploadCategoryChange(this.value)">
                <option value="image" ${category === 'image' ? 'selected' : ''}>📁 1.รูปภาพ</option>
                <option value="other" ${category === 'other' ? 'selected' : ''}>📁 2.ไฟล์อื่นๆ (PDF, Word, Excel, Video)</option>
              </select>
            </div>

            <div id="upload-album-select-container">
              <label class="block font-semibold text-slate-700 mb-1">โฟลเดอร์อัลบั้ม (ไม่บังคับ)</label>
              <select id="modal-upload-album" class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                <option value="">ภาพเดี่ยวทั่วไป (ไม่เข้าอัลบั้ม)</option>
                ${this.albums.map(a => `<option value="${a.album_id}">${a.album_name}</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">เลือกไฟล์จากอุปกรณ์ *</label>
              <input type="file" id="modal-upload-file" class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100">
            </div>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button onclick="App.closeModal()" class="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium text-xs sm:text-sm transition">ยกเลิก</button>
            <button onclick="App.submitUpload()" class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm transition">เริ่มอัปโหลด</button>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  },

  handleUploadCategoryChange(val) {
    var c = document.getElementById("upload-album-select-container");
    if (c) c.style.display = val === 'image' ? 'block' : 'none';
  },

  async submitUpload() {
    var groupId = document.getElementById("modal-upload-group").value;
    var category = document.getElementById("modal-upload-category").value;
    var albumId = document.getElementById("modal-upload-album") ? document.getElementById("modal-upload-album").value : "";
    var fileInput = document.getElementById("modal-upload-file");

    if (!fileInput.files || fileInput.files.length === 0) {
      alert("กรุณาเลือกไฟล์ที่ต้องการอัปโหลด");
      return;
    }

    var file = fileInput.files[0];
    var reader = new FileReader();

    this.showLoading(true);
    reader.onload = async (e) => {
      var dataUrl = e.target.result;
      var base64 = dataUrl.split(",")[1];

      try {
        var res = await ApiService.uploadFile({
          groupId: groupId,
          category: category,
          albumId: albumId,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          base64Data: base64,
          dataUrl: dataUrl
        });

        if (res.success) {
          this.showToast("อัปโหลดไฟล์สำเร็จแล้ว!", "success");
          this.closeModal();
          await this.loadData();
          this.switchTab(category === 'image' ? 'gallery' : 'files');
        } else {
          alert(res.error);
        }
      } catch (err) {
        alert("Upload error: " + err.message);
      } finally {
        this.showLoading(false);
      }
    };
    reader.readAsDataURL(file);
  },

  openLightbox(url, name, album, sender) {
    var container = document.getElementById("modal-container");
    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" onclick="App.closeModal()">
        <div class="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onclick="event.stopPropagation()">
          <button onclick="App.closeModal()" class="absolute -top-10 right-0 text-white hover:text-emerald-400 text-sm flex items-center space-x-1">
            <span>ปิด</span>
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
          <img src="${url}" class="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl" alt="${name}">
          <div class="mt-3 text-center text-white">
            <h4 class="font-bold text-sm sm:text-base">${name}</h4>
            <p class="text-xs text-slate-300 mt-0.5">${album ? '📁 อัลบั้ม: ' + album : '🖼️ ภาพเดี่ยว'} • โดย ${sender || 'สมาชิก'}</p>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  },

  openAlbumView(albumId) {
    var alb = this.albums.find(a => a.album_id === albumId);
    if (!alb) return;
    this.gallerySubTab = "single";
    this.activeAlbumFilter = albumId;
    this.activeGroupFilter = alb.group_id;
    this.renderLayout();
    this.switchTab("gallery");
  },

  closeModal() {
    var container = document.getElementById("modal-container");
    if (container) container.innerHTML = "";
  },

  // ==================================================================
  // UTILITIES & FEEDBACK
  // ==================================================================

  getGroupName(groupId) {
    var g = this.groups.find(x => x.group_id === groupId);
    return g ? g.group_name : "กลุ่ม LINE";
  },

  showLoading(show) {
    var existing = document.getElementById("app-loading");
    if (show && !existing) {
      var d = document.createElement("div");
      d.id = "app-loading";
      d.className = "fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center pointer-events-none";
      d.innerHTML = `
        <div class="bg-white p-4 rounded-2xl shadow-xl flex items-center space-x-3 text-xs font-semibold text-slate-700">
          <svg class="animate-spin w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
          <span>กำลังประมวลผลข้อมูล...</span>
        </div>
      `;
      document.body.appendChild(d);
    } else if (!show && existing) {
      existing.remove();
    }
  },

  showToast(message, type = "info") {
    var container = document.getElementById("toast-container");
    if (!container) return;

    var toast = document.createElement("div");
    toast.className = `p-3 px-4 rounded-xl shadow-lg text-xs font-medium text-white flex items-center space-x-2 pointer-events-auto transition-all transform duration-300 ${
      type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-600' : 'bg-slate-800'
    }`;
    toast.innerHTML = `
      <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'info'}" class="w-4 h-4 shrink-0"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
      toast.classList.add("opacity-0", "translate-y-2");
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};

// เริ่มต้นแอปพลิเคชันเมื่อหน้าเว็บโหลดเสร็จสิ้น
window.addEventListener("DOMContentLoaded", () => {
  App.init();
});
