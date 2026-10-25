/**
 * ====================================================================
 * LINE Keep Bot & Google Drive Manager
 * ไฟล์: js/api.js - Service Layer สื่อสารกับ GAS Backend & Mock DB
 * ====================================================================
 */

const ApiService = {
  /**
   * เรียก API ทั่วไป (สลับระหว่าง Mock Data กับ Live Google Apps Script Web App)
   */
  async request(action, params = {}, method = "GET", postData = null) {
    if (AppConfig.isMockMode()) {
      return this.handleMockRequest(action, params, postData);
    }

    var gasUrl = AppConfig.getGasUrl();
    if (!gasUrl) {
      throw new Error("ยังไม่ได้ระบุ Google Apps Script Web App URL");
    }

    try {
      if (method === "GET") {
        var url = new URL(gasUrl);
        url.searchParams.append("action", action);
        Object.keys(params).forEach(function(k) {
          if (params[k] !== undefined && params[k] !== null) {
            url.searchParams.append(k, params[k]);
          }
        });

        var response = await fetch(url.toString(), {
          method: "GET",
          headers: { "Accept": "application/json" }
        });
        return await response.json();
      } else {
        var payload = Object.assign({ action: action }, postData || {});
        var response = await fetch(gasUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" }, // ใช้ text/plain เพื่อป้องกัน CORS preflight
          body: JSON.stringify(payload)
        });
        return await response.json();
      }
    } catch (err) {
      console.error("API Request Error:", err);
      throw err;
    }
  },

  // ==================================================================
  // PUBLIC API ENDPOINTS
  // ==================================================================

  async getDashboard() {
    return await this.request("getDashboardData");
  },

  async getGroups() {
    return await this.request("getGroups");
  },

  async getAlbums(groupId) {
    return await this.request("getAlbums", { groupId: groupId });
  },

  async getFiles(groupId, category, albumId) {
    return await this.request("getFiles", {
      groupId: groupId === "all" ? "" : groupId,
      category: category === "all" ? "" : category,
      albumId: albumId || ""
    });
  },

  async getLogs() {
    return await this.request("getLogs");
  },

  async getSettings() {
    return await this.request("getSettings");
  },

  async saveGroup(groupData) {
    return await this.request("saveGroup", {}, "POST", { group: groupData });
  },

  async updateGroupSettings(groupId, settings) {
    return await this.request("updateGroupSettings", {}, "POST", { groupId: groupId, settings: settings });
  },

  async deleteGroup(groupId) {
    return await this.request("deleteGroup", {}, "POST", { groupId: groupId });
  },

  async createAlbum(groupId, albumName) {
    return await this.request("createAlbum", {}, "POST", { groupId: groupId, albumName: albumName });
  },

  async setActiveAlbum(groupId, albumId, durationMinutes) {
    return await this.request("setActiveAlbum", {}, "POST", {
      groupId: groupId,
      albumId: albumId,
      durationMinutes: durationMinutes || 60
    });
  },

  async moveFilesToAlbum(fileIds, targetAlbumId, targetAlbumName) {
    return await this.request("moveFilesToAlbum", {}, "POST", {
      fileIds: fileIds,
      targetAlbumId: targetAlbumId,
      targetAlbumName: targetAlbumName
    });
  },

  async uploadFile(payload) {
    return await this.request("uploadFileFromWeb", {}, "POST", payload);
  },

  async saveSettings(settings) {
    return await this.request("saveSettings", {}, "POST", { settings: settings });
  },

  async testLineConnection(token) {
    return await this.request("testLineConnection", {}, "POST", { token: token });
  },

  async login(username, password) {
    return await this.request("login", {}, "POST", { username: username, password: password });
  },

  async getUsers() {
    return await this.request("getUsers");
  },

  async saveUser(userData) {
    return await this.request("saveUser", {}, "POST", { user: userData });
  },

  async updateUser(userId, userData) {
    return await this.request("updateUser", {}, "POST", { userId: userId, user: userData });
  },

  async deleteUser(userId) {
    return await this.request("deleteUser", {}, "POST", { userId: userId });
  },

  // ==================================================================
  // MOCK DATA IMPLEMENTATION (เมื่อทำงานบน Demo Mode)
  // ==================================================================

  handleMockRequest(action, params, postData) {
    var db = MockDatabase.getData();

    // จำลอง Network Delay เล็กน้อยให้ดูเป็นธรรมชาติ
    return new Promise(function(resolve) {
      setTimeout(function() {
        switch (action) {
          case "getDashboardData": {
            var totalImages = db.files.filter(function(f) { return f.category === "image"; }).length;
            var totalOtherFiles = db.files.filter(function(f) { return f.category === "other"; }).length;
            var totalBytes = db.files.reduce(function(sum, f) { return sum + (f.file_size || 0); }, 0);

            resolve({
              success: true,
              data: {
                stats: {
                  totalGroups: db.groups.length,
                  totalAlbums: db.albums.length,
                  totalImages: totalImages,
                  totalOtherFiles: totalOtherFiles,
                  totalStorageBytes: totalBytes,
                  totalStorageFormatted: formatFileSize(totalBytes)
                },
                groups: db.groups,
                recentFiles: db.files.slice(0, 8),
                recentAlbums: db.albums.slice(0, 4)
              }
            });
            break;
          }

          case "getGroups": {
            resolve({ success: true, data: db.groups });
            break;
          }

          case "getAlbums": {
            var filteredAlbums = db.albums;
            if (params.groupId && params.groupId !== "all") {
              filteredAlbums = filteredAlbums.filter(function(a) { return a.group_id === params.groupId; });
            }
            resolve({ success: true, data: filteredAlbums });
            break;
          }

          case "getFiles": {
            var filteredFiles = db.files;
            if (params.groupId && params.groupId !== "all") {
              filteredFiles = filteredFiles.filter(function(f) { return f.group_id === params.groupId; });
            }
            if (params.category && params.category !== "all") {
              filteredFiles = filteredFiles.filter(function(f) { return f.category === params.category; });
            }
            if (params.albumId) {
              filteredFiles = filteredFiles.filter(function(f) { return f.album_id === params.albumId; });
            }
            resolve({ success: true, data: filteredFiles });
            break;
          }

          case "getLogs": {
            resolve({ success: true, data: db.logs });
            break;
          }

          case "getSettings": {
            resolve({
              success: true,
              data: {
                LINE_CHANNEL_ACCESS_TOKEN: AppConfig.getLineToken(),
                LINE_CHANNEL_SECRET: "••••••••••••••••",
                ROOT_FOLDER_NAME: "LINE_Keep_Bot_Storage",
                ROOT_FOLDER_ID: AppConfig.getRootFolderId() || "DRV_ROOT_SAMPLE_12345",
                DEFAULT_REPLY_MODE: "summary",
                ALBUM_SESSION_MINUTES: "60"
              }
            });
            break;
          }

          case "saveGroup": {
            var newGroup = Object.assign({
              group_id: "GRP-" + Date.now().toString().slice(-4),
              picture_url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150",
              root_folder_id: "DRV_GRP_" + Date.now(),
              images_folder_id: "DRV_IMG_" + Date.now(),
              files_folder_id: "DRV_FIL_" + Date.now(),
              active_album_id: "",
              active_album_name: "",
              active_album_expires: "",
              auto_save: true,
              auto_imageset_album: true,
              reply_mode: "summary",
              file_count: 0,
              image_count: 0,
              status: "active",
              updated_at: new Date().toISOString()
            }, postData.group);

            db.groups.unshift(newGroup);
            MockDatabase.saveData(db);
            resolve({ success: true, data: newGroup, message: "สร้างกลุ่มและโฟลเดอร์ Google Drive จำลองสำเร็จ!" });
            break;
          }

          case "updateGroupSettings": {
            var targetGroup = db.groups.find(function(g) { return g.group_id === postData.groupId; });
            if (targetGroup) {
              Object.assign(targetGroup, postData.settings, { updated_at: new Date().toISOString() });
              MockDatabase.saveData(db);
              resolve({ success: true, message: "บันทึกการตั้งค่ากลุ่มสำเร็จ" });
            } else {
              resolve({ success: false, error: "ไม่พบกลุ่มที่ต้องการแก้ไข" });
            }
            break;
          }

          case "deleteGroup": {
            db.groups = db.groups.filter(function(g) { return g.group_id !== postData.groupId; });
            MockDatabase.saveData(db);
            resolve({ success: true, message: "ลบกลุ่มสำเร็จ" });
            break;
          }

          case "createAlbum": {
            var albId = "ALB-" + Date.now().toString().slice(-4);
            var newAlb = {
              album_id: albId,
              group_id: postData.groupId,
              album_name: postData.albumName,
              folder_id: "FLDR_" + albId,
              folder_url: "https://drive.google.com",
              cover_url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=500",
              image_count: 0,
              created_by: "Web Admin",
              created_at: new Date().toISOString()
            };
            db.albums.unshift(newAlb);
            MockDatabase.saveData(db);
            resolve({ success: true, data: newAlb, message: "สร้างโฟลเดอร์อัลบั้มสำเร็จ!" });
            break;
          }

          case "setActiveAlbum": {
            var grp = db.groups.find(function(g) { return g.group_id === postData.groupId; });
            if (grp) {
              if (postData.albumId) {
                var alb = db.albums.find(function(a) { return a.album_id === postData.albumId; });
                grp.active_album_id = postData.albumId;
                grp.active_album_name = alb ? alb.album_name : "";
                grp.active_album_expires = new Date(Date.now() + (postData.durationMinutes || 60) * 60000).toISOString();
              } else {
                grp.active_album_id = "";
                grp.active_album_name = "";
                grp.active_album_expires = "";
              }
              MockDatabase.saveData(db);
              resolve({
                success: true,
                message: postData.albumId ? ("เปิดโหมดบันทึกเข้าอัลบั้ม: " + grp.active_album_name) : "กลับสู่โหมดภาพเดี่ยว"
              });
            } else {
              resolve({ success: false, error: "ไม่พบกลุ่ม" });
            }
            break;
          }

          case "moveFilesToAlbum": {
            var moved = 0;
            db.files.forEach(function(f) {
              if (postData.fileIds.includes(f.file_id)) {
                f.album_id = postData.targetAlbumId;
                f.album_name = postData.targetAlbumName;
                moved++;
              }
            });
            // อัปเดตตัวนับอัลบั้ม
            var targetAlb = db.albums.find(function(a) { return a.album_id === postData.targetAlbumId; });
            if (targetAlb) {
              targetAlb.image_count = db.files.filter(function(f) { return f.album_id === postData.targetAlbumId; }).length;
            }
            MockDatabase.saveData(db);
            resolve({ success: true, count: moved, message: "ย้าย " + moved + " รูปภาพเข้าอัลบั้มสำเร็จแล้ว!" });
            break;
          }

          case "uploadFileFromWeb": {
            var fileGroup = db.groups.find(function(g) { return g.group_id === postData.groupId; });
            var newFile = {
              file_id: "FIL-" + Date.now().toString().slice(-6),
              group_id: postData.groupId,
              group_name: fileGroup ? fileGroup.group_name : "กลุ่ม LINE",
              category: postData.category,
              album_id: postData.albumId || "",
              album_name: postData.albumName || "",
              file_name: postData.fileName,
              mime_type: postData.mimeType || "application/octet-stream",
              file_size: postData.fileSize || 1024000,
              drive_file_id: "DRV_UPL_" + Date.now(),
              drive_url: "https://drive.google.com",
              thumbnail_url: postData.category === "image" ? (postData.dataUrl || "https://images.unsplash.com/photo-1511578314322-379afb476865?w=500") : "",
              sender_id: "WEB_ADMIN",
              sender_name: "Web Admin",
              line_message_id: "WEB_UPLOAD",
              created_at: new Date().toISOString()
            };
            db.files.unshift(newFile);
            if (fileGroup) {
              if (postData.category === "image") fileGroup.image_count = (fileGroup.image_count || 0) + 1;
              else fileGroup.file_count = (fileGroup.file_count || 0) + 1;
            }
            MockDatabase.saveData(db);
            resolve({ success: true, data: newFile, message: "อัปโหลดไฟล์เข้า Google Drive จำลองสำเร็จ!" });
            break;
          }

          case "saveSettings": {
            if (postData.settings.LINE_CHANNEL_ACCESS_TOKEN) {
              AppConfig.setLineToken(postData.settings.LINE_CHANNEL_ACCESS_TOKEN);
            }
            if (postData.settings.ROOT_FOLDER_ID) {
              AppConfig.setRootFolderId(postData.settings.ROOT_FOLDER_ID);
            }
            resolve({ success: true, message: "บันทึกการตั้งค่าสำเร็จแล้ว!" });
            break;
          }

          case "testLineConnection": {
            resolve({
              success: true,
              botInfo: {
                displayName: "LINE Keep Assistant Bot",
                userId: "U_BOT_LINE_KEEP_2026",
                basicId: "@linekeep_bot"
              },
              message: "เชื่อมต่อ LINE Bot สำเร็จ (โหมดจำลอง)"
            });
            break;
          }

          case "login": {
            var usersList = db.users || MockDatabase.getInitialData().users || [];
            var foundUser = usersList.find(function(u) {
              return u.username.toLowerCase() === (postData.username || "").toLowerCase() &&
                     u.password === postData.password &&
                     u.status === "active";
            });

            if (foundUser) {
              resolve({
                success: true,
                user: {
                  userId: foundUser.user_id,
                  username: foundUser.username,
                  fullname: foundUser.fullname,
                  role: foundUser.role || "staff",
                  avatar: foundUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                }
              });
            } else {
              resolve({ success: false, error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หรือบัญชีถูกระงับ" });
            }
            break;
          }

          case "getUsers": {
            var allUsers = db.users || MockDatabase.getInitialData().users || [];
            var sanitizedUsers = allUsers.map(function(u) {
              return {
                user_id: u.user_id,
                username: u.username,
                fullname: u.fullname,
                role: u.role || "staff",
                status: u.status || "active",
                avatar: u.avatar || ""
              };
            });
            resolve({ success: true, data: sanitizedUsers });
            break;
          }

          case "saveUser": {
            var users = db.users || MockDatabase.getInitialData().users || [];
            var cleanUname = (postData.user.username || "").trim().toLowerCase();

            if (users.some(function(u) { return u.username.toLowerCase() === cleanUname; })) {
              resolve({ success: false, error: "Username นี้มีอยู่ในระบบแล้ว" });
              return;
            }

            var newUser = {
              user_id: "USR-" + Date.now().toString().slice(-4),
              username: cleanUname,
              password: postData.user.password,
              fullname: postData.user.fullname || cleanUname,
              role: postData.user.role || "staff",
              status: postData.user.status || "active",
              avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
            };

            users.push(newUser);
            db.users = users;
            MockDatabase.saveData(db);
            resolve({ success: true, data: newUser, message: "เพิ่มผู้ใช้งานสำเร็จแล้ว!" });
            break;
          }

          case "updateUser": {
            var userList = db.users || MockDatabase.getInitialData().users || [];
            var uTarget = userList.find(function(u) { return u.user_id === postData.userId; });
            if (uTarget) {
              if (postData.user.fullname !== undefined) uTarget.fullname = postData.user.fullname;
              if (postData.user.role !== undefined) uTarget.role = postData.user.role;
              if (postData.user.status !== undefined) uTarget.status = postData.user.status;
              if (postData.user.password && postData.user.password.trim()) {
                uTarget.password = postData.user.password.trim();
              }
              db.users = userList;
              MockDatabase.saveData(db);
              resolve({ success: true, message: "บันทึกข้อมูลผู้ใช้สำเร็จแล้ว!" });
            } else {
              resolve({ success: false, error: "ไม่พบผู้ใช้ที่ต้องการแก้ไข" });
            }
            break;
          }

          case "deleteUser": {
            var existingUsers = db.users || MockDatabase.getInitialData().users || [];
            var targetU = existingUsers.find(function(u) { return u.user_id === postData.userId; });

            if (!targetU) {
              resolve({ success: false, error: "ไม่พบผู้ใช้" });
              return;
            }

            var activeAdmins = existingUsers.filter(function(u) { return u.role === "admin" && u.status === "active"; });
            if (targetU.role === "admin" && activeAdmins.length <= 1) {
              resolve({ success: false, error: "ไม่สามารถลบผู้ดูแลระบบ (Admin) คนสุดท้ายได้" });
              return;
            }

            db.users = existingUsers.filter(function(u) { return u.user_id !== postData.userId; });
            MockDatabase.saveData(db);
            resolve({ success: true, message: "ลบผู้ใช้งานสำเร็จแล้ว!" });
            break;
          }

          default:
            resolve({ success: false, error: "Unknown mock action: " + action });
        }
      }, 150);
    });
  }
};

/**
 * Helper จัดฟอร์แมตขนาดไฟล์
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  var k = 1024;
  var sizes = ["B", "KB", "MB", "GB", "TB"];
  var i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
