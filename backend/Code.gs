/**
 * ====================================================================
 * ระบบบริหารจัดการ LINE Keep Bot & Google Drive Storage
 * ไฟล์: Code.gs - Web App Entry Point, REST API & Database Operations
 * ====================================================================
 */

/**
 * จัดการ HTTP GET Requests สำหรับ Frontend Web Application
 */
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getDashboardData";
    var result;

    switch (action) {
      case "setupDatabase":
        setupDatabase();
        result = { success: true, message: "ติดตั้งและตั้งค่าฐานข้อมูลเรียบร้อยแล้ว" };
        break;
      case "getDashboardData":
        result = getDashboardData();
        break;
      case "getGroups":
        result = getGroupsList();
        break;
      case "getAlbums":
        result = getAlbumsList(e.parameter.groupId);
        break;
      case "getFiles":
        result = getFilesList(e.parameter.groupId, e.parameter.category, e.parameter.albumId);
        break;
      case "getLogs":
        result = getWebhookLogsList();
        break;
      case "getSettings":
        result = getSystemSettings();
        break;
      case "getUsers":
        result = getUsersList();
        break;
      default:
        result = { success: false, error: "Unknown action: " + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log("❌ Error in doGet: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * จัดการ HTTP POST Requests (รองรับทั้ง LINE Webhook และ Frontend API)
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, error: "No post data received" });
    }

    var payload = {};
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return jsonResponse({ success: false, error: "Invalid JSON format" });
    }

    // 1. ตรวจสอบว่าเป็น LINE Webhook Event หรือไม่
    if (payload.events && Array.isArray(payload.events)) {
      return handleLineWebhook(e);
    }

    // 2. จัดการคำสั่งจาก Frontend Web Application
    var action = payload.action || (e.parameter ? e.parameter.action : "");
    var result;

    switch (action) {
      case "login":
        result = handleUserLogin(payload.username, payload.password);
        break;
      case "saveGroup":
        result = handleSaveGroup(payload.group);
        break;
      case "updateGroupSettings":
        result = handleUpdateGroupSettings(payload.groupId, payload.settings);
        break;
      case "deleteGroup":
        result = handleDeleteGroup(payload.groupId);
        break;
      case "createAlbum":
        result = handleCreateAlbum(payload.groupId, payload.albumName);
        break;
      case "setActiveAlbum":
        result = handleSetActiveAlbum(payload.groupId, payload.albumId, payload.durationMinutes);
        break;
      case "moveFilesToAlbum":
        result = handleMoveFilesToAlbum(payload.fileIds, payload.targetAlbumId, payload.targetAlbumName);
        break;
      case "uploadFileFromWeb":
        result = handleUploadFromWeb(payload);
        break;
      case "saveSettings":
        result = handleSaveSettings(payload.settings);
        break;
      case "testLineConnection":
        result = handleTestLineConnection(payload.token);
        break;
      case "saveUser":
        result = handleSaveUser(payload.user);
        break;
      case "updateUser":
        result = handleUpdateUser(payload.userId, payload.user);
        break;
      case "deleteUser":
        result = handleDeleteUser(payload.userId);
        break;
      default:
        result = { success: false, error: "Invalid action: " + action };
    }

    return jsonResponse(result);
  } catch (error) {
    Logger.log("❌ Error in doPost: " + error.toString());
    return jsonResponse({ success: false, error: error.message });
  }
}

/**
 * Helper ตอบกลับ JSON พร้อม CORS
 */
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ====================================================================
 * REST API HANDLERS: แดชบอร์ดและข้อมูลทั่วไป
 * ====================================================================
 */

/**
 * ดึงข้อมูลสรุปสำหรับแดชบอร์ดภาพรวม
 */
function getDashboardData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss.getSheetByName("Groups")) {
      setupDatabase();
    }
  } catch (initErr) {
    Logger.log("Auto setupDatabase error: " + initErr.toString());
  }

  var groups = getGroupsList().data || [];
  var albums = getAlbumsList().data || [];
  var files = getFilesList().data || [];

  var totalImages = 0;
  var totalOtherFiles = 0;
  var totalBytes = 0;

  files.forEach(function(f) {
    if (f.category === "image") {
      totalImages++;
    } else {
      totalOtherFiles++;
    }
    totalBytes += (parseInt(f.file_size) || 0);
  });

  return {
    success: true,
    data: {
      stats: {
        totalGroups: groups.length,
        totalAlbums: albums.length,
        totalImages: totalImages,
        totalOtherFiles: totalOtherFiles,
        totalStorageBytes: totalBytes,
        totalStorageFormatted: formatBytes(totalBytes)
      },
      groups: groups,
      recentFiles: files.slice(0, 10),
      recentAlbums: albums.slice(0, 6)
    }
  };
}

/**
 * ดึงรายชื่อกลุ่ม LINE ทั้งหมด
 */
function getGroupsList() {
  var rows = getSheetDataAsObjects("Groups");
  return { success: true, data: rows };
}

/**
 * ดึงรายการอัลบั้มรูปภาพ
 */
function getAlbumsList(groupId) {
  var rows = getSheetDataAsObjects("Albums");
  if (groupId) {
    rows = rows.filter(function(r) { return r.group_id === groupId; });
  }
  return { success: true, data: rows };
}

/**
 * ดึงรายการไฟล์ทั้งหมด (รองรับการกรองตามกลุ่ม, หมวดหมู่ และอัลบั้ม)
 */
function getFilesList(groupId, category, albumId) {
  var rows = getSheetDataAsObjects("Files");
  if (groupId) {
    rows = rows.filter(function(r) { return r.group_id === groupId; });
  }
  if (category) {
    rows = rows.filter(function(r) { return r.category === category; });
  }
  if (albumId) {
    rows = rows.filter(function(r) { return r.album_id === albumId; });
  }
  return { success: true, data: rows };
}

/**
 * ดึงบันทึก Webhook Logs ล่าสุด
 */
function getWebhookLogsList() {
  var rows = getSheetDataAsObjects("WebhookLogs");
  return { success: true, data: rows.slice(-50).reverse() };
}

/**
 * ดึงค่าการตั้งค่าระบบ
 */
function getSystemSettings() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Settings");
  var settings = {};
  if (sheet) {
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0]) {
        settings[data[i][0]] = data[i][1];
      }
    }
  }
  // ซ่อน Secret ป้องกันหลุด
  if (settings["LINE_CHANNEL_SECRET"]) {
    settings["LINE_CHANNEL_SECRET"] = "••••••••••••••••";
  }
  return { success: true, data: settings };
}

/**
 * ====================================================================
 * REST API HANDLERS: จัดการกลุ่ม LINE, อัลบั้ม และไฟล์
 * ====================================================================
 */

/**
 * เพิ่มหรือบันทึกข้อมูลกลุ่ม LINE ใหม่จากหน้าเว็บ
 */
function handleSaveGroup(group) {
  if (!group || !group.group_name) {
    return { success: false, error: "ชื่อกลุ่ม LINE จำเป็นต้องระบุ" };
  }

  var groupId = group.group_id || ("GRP-" + Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyyMMdd-HHmmss"));
  var folders = ensureGroupFolders(groupId, group.group_name);

  var newRecord = {
    groupId: groupId,
    groupName: group.group_name,
    pictureUrl: group.picture_url || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150",
    rootFolderId: folders.rootFolderId,
    imagesFolderId: folders.imagesFolderId,
    filesFolderId: folders.filesFolderId,
    autoSave: group.auto_save !== false,
    autoImagesetAlbum: group.auto_imageset_album !== false,
    replyMode: group.reply_mode || "summary",
    status: "active"
  };

  registerOrUpdateGroup(newRecord);

  return { success: true, data: newRecord, message: "สร้างกลุ่มและโฟลเดอร์ใน Google Drive สำเร็จแล้ว!" };
}

/**
 * ปรับปรุงการตั้งค่าของกลุ่ม LINE
 */
function handleUpdateGroupSettings(groupId, settings) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Groups");
  if (!sheet) return { success: false, error: "Sheet Groups not found" };

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString() === groupId.toString()) {
      if (settings.group_name !== undefined) sheet.getRange(i + 1, 2).setValue(settings.group_name);
      if (settings.auto_save !== undefined) sheet.getRange(i + 1, 10).setValue(settings.auto_save);
      if (settings.auto_imageset_album !== undefined) sheet.getRange(i + 1, 11).setValue(settings.auto_imageset_album);
      if (settings.reply_mode !== undefined) sheet.getRange(i + 1, 12).setValue(settings.reply_mode);
      if (settings.status !== undefined) sheet.getRange(i + 1, 15).setValue(settings.status);
      sheet.getRange(i + 1, 16).setValue(new Date());
      return { success: true, message: "บันทึกการตั้งค่ากลุ่มสำเร็จ" };
    }
  }
  return { success: false, error: "ไม่พบกลุ่มที่ต้องการแก้ไข" };
}

/**
 * ลบกลุ่ม LINE ออกจากระบบ (หรือเปลี่ยนสถานะเป็น inactive)
 */
function handleDeleteGroup(groupId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Groups");
  if (!sheet) return { success: false, error: "Sheet Groups not found" };

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString() === groupId.toString()) {
      sheet.deleteRow(i + 1);
      return { success: true, message: "ลบกลุ่มสำเร็จเรียบร้อยแล้ว" };
    }
  }
  return { success: false, error: "ไม่พบกลุ่มที่ต้องการลบ" };
}

/**
 * สร้างโฟลเดอร์อัลบั้มใหม่ผ่านหน้าเว็บ
 */
function handleCreateAlbum(groupId, albumName) {
  var group = getGroupRecord(groupId);
  if (!group) return { success: false, error: "ไม่พบข้อมูลกลุ่ม LINE นี้" };

  var imagesFolder = DriveApp.getFolderById(group.images_folder_id);
  var albumFolder = getOrCreateSubFolder(imagesFolder, albumName);
  var albumId = "ALB-" + Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyyMMdd-HHmmss");

  var record = {
    albumId: albumId,
    groupId: groupId,
    albumName: albumName,
    folderId: albumFolder.getId(),
    folderUrl: albumFolder.getUrl(),
    coverUrl: "",
    imageCount: 0,
    createdBy: "Web Admin"
  };

  saveAlbumRecord(record);

  return { success: true, data: record, message: "สร้างโฟลเดอร์อัลบั้มใน Google Drive สำเร็จแล้ว!" };
}

/**
 * ตั้งค่า Active Album ประจำกลุ่มผ่านหน้าเว็บ
 */
function handleSetActiveAlbum(groupId, albumId, durationMinutes) {
  var albumName = "";
  var expiresAt = "";

  if (albumId) {
    var albums = getSheetDataAsObjects("Albums");
    var found = albums.find(function(a) { return a.album_id === albumId; });
    if (found) {
      albumName = found.album_name;
      var mins = durationMinutes || 60;
      expiresAt = new Date(Date.now() + mins * 60 * 1000).toISOString();
    }
  }

  updateGroupActiveAlbum(groupId, albumId, albumName, expiresAt);

  return {
    success: true,
    message: albumId ? ("เปิดโหมดบันทึกเข้าอัลบั้ม: " + albumName) : "ปิดโหมดอัลบั้ม สลับสู่โหมดภาพเดี่ยว"
  };
}

/**
 * ย้ายไฟล์ภาพเดี่ยวเข้าไปในอัลบั้มที่เลือก
 */
function handleMoveFilesToAlbum(fileIds, targetAlbumId, targetAlbumName) {
  if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
    return { success: false, error: "ไม่มีไฟล์ที่เลือก" };
  }

  var albums = getSheetDataAsObjects("Albums");
  var targetAlbum = albums.find(function(a) { return a.album_id === targetAlbumId; });
  if (!targetAlbum) {
    return { success: false, error: "ไม่พบอัลบั้มปลายทาง" };
  }

  var targetFolder = DriveApp.getFolderById(targetAlbum.folder_id);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Files");
  if (!sheet) return { success: false, error: "Sheet Files not found" };

  var data = sheet.getDataRange().getValues();
  var movedCount = 0;

  for (var i = 1; i < data.length; i++) {
    var fileId = data[i][0];
    if (fileIds.indexOf(fileId) !== -1) {
      var driveFileId = data[i][9];
      if (driveFileId) {
        try {
          var driveFile = DriveApp.getFileById(driveFileId);
          driveFile.moveTo(targetFolder);
        } catch (e) {
          Logger.log("Cannot move drive file: " + e.message);
        }
      }
      sheet.getRange(i + 1, 5).setValue(targetAlbumId);
      sheet.getRange(i + 1, 6).setValue(targetAlbumName);
      movedCount++;
    }
  }

  // อัปเดตจำนวนภาพในอัลบั้ม
  recalculateAlbumCount(targetAlbumId);

  return { success: true, count: movedCount, message: "ย้าย " + movedCount + " ไฟล์เข้าอัลบั้มสำเร็จแล้ว!" };
}

/**
 * อัปโหลดไฟล์จากหน้าเว็บเข้า Google Drive โดยตรง
 */
function handleUploadFromWeb(payload) {
  var groupId = payload.groupId;
  var group = getGroupRecord(groupId);
  if (!group) return { success: false, error: "ไม่พบกลุ่มปลายทาง" };

  var category = payload.category || "other";
  var albumId = payload.albumId || "";
  var albumName = payload.albumName || "";
  var targetFolder;

  if (category === "image") {
    if (albumId) {
      var albums = getSheetDataAsObjects("Albums");
      var alb = albums.find(function(a) { return a.album_id === albumId; });
      targetFolder = alb ? DriveApp.getFolderById(alb.folder_id) : DriveApp.getFolderById(group.images_folder_id);
    } else {
      targetFolder = DriveApp.getFolderById(group.images_folder_id);
    }
  } else {
    targetFolder = DriveApp.getFolderById(group.files_folder_id);
  }

  var decodedBytes = Utilities.base64Decode(payload.base64Data);
  var blob = Utilities.newBlob(decodedBytes, payload.mimeType || "application/octet-stream", payload.fileName);
  var driveFile = targetFolder.createFile(blob);

  var fileId = "FIL-" + Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyyMMdd-HHmmss") + "-" + Math.floor(Math.random() * 1000);
  saveFileRecord({
    fileId: fileId,
    groupId: groupId,
    groupName: group.group_name,
    category: category,
    albumId: albumId,
    albumName: albumName,
    fileName: payload.fileName,
    mimeType: driveFile.getMimeType(),
    fileSize: driveFile.getSize(),
    driveFileId: driveFile.getId(),
    driveUrl: driveFile.getUrl(),
    thumbnailUrl: "",
    senderId: "WEB-ADMIN",
    senderName: "Web Admin",
    lineMessageId: "WEB-UPLOAD"
  });

  incrementGroupCount(groupId, category);

  return { success: true, fileId: fileId, driveUrl: driveFile.getUrl(), message: "อัปโหลดไฟล์สำเร็จ!" };
}

/**
 * บันทึกการตั้งค่าระบบ
 */
function handleSaveSettings(settings) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Settings");
  if (!sheet) return { success: false, error: "Sheet Settings not found" };

  var data = sheet.getDataRange().getValues();
  for (var key in settings) {
    var found = false;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(settings[key]);
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([key, settings[key], ""]);
    }
  }
  return { success: true, message: "บันทึกการตั้งค่าระบบสำเร็จแล้ว!" };
}

/**
 * ทดสอบการเชื่อมต่อกับ LINE Messaging API
 */
function handleTestLineConnection(token) {
  var testToken = token || getSettingValue("LINE_CHANNEL_ACCESS_TOKEN", "");
  if (!testToken) {
    return { success: false, error: "ไม่พบ LINE Channel Access Token" };
  }

  try {
    var res = UrlFetchApp.fetch("https://api.line.me/v2/bot/info", {
      method: "get",
      headers: { "Authorization": "Bearer " + testToken },
      muteHttpExceptions: true
    });

    if (res.getResponseCode() === 200) {
      var botInfo = JSON.parse(res.getContentText());
      return { success: true, botInfo: botInfo, message: "เชื่อมต่อ LINE Bot สำเร็จ: " + botInfo.displayName };
    } else {
      return { success: false, error: "LINE API Error (" + res.getResponseCode() + "): " + res.getContentText() };
    }
  } catch (e) {
    return { success: false, error: "เกิดข้อผิดพลาดในการเชื่อมต่อ: " + e.message };
  }
}

/**
 * ตรวจสอบการเข้าสู่ระบบ
 */
function handleUserLogin(username, password) {
  var users = getSheetDataAsObjects("Users");
  var user = users.find(function(u) {
    return u.username === username && u.password === password && u.status === "active";
  });

  if (user) {
    return {
      success: true,
      user: {
        userId: user.user_id,
        username: user.username,
        fullname: user.fullname,
        role: user.role
      }
    };
  }
  return { success: false, error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
}

/**
 * ดึงรายชื่อผู้ใช้งานทั้งหมด (ซ่อนรหัสผ่าน)
 */
function getUsersList() {
  var rows = getSheetDataAsObjects("Users");
  var sanitized = rows.map(function(u) {
    return {
      user_id: u.user_id,
      username: u.username,
      fullname: u.fullname,
      role: u.role || "staff",
      status: u.status || "active"
    };
  });
  return { success: true, data: sanitized };
}

/**
 * เพิ่มผู้ใช้งานใหม่
 */
function handleSaveUser(user) {
  if (!user || !user.username || !user.password) {
    return { success: false, error: "กรุณาระบุ Username และ Password" };
  }

  var cleanUsername = user.username.trim().toLowerCase();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Users");
  if (!sheet) return { success: false, error: "Sheet Users not found" };

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] && data[i][1].toString().trim().toLowerCase() === cleanUsername) {
      return { success: false, error: "Username นี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น" };
    }
  }

  var userId = "USR-" + Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyyMMdd-HHmmss");
  var newRow = [
    userId,
    cleanUsername,
    user.password,
    user.fullname || cleanUsername,
    user.role || "staff",
    user.status || "active"
  ];

  sheet.appendRow(newRow);

  return {
    success: true,
    data: {
      user_id: userId,
      username: cleanUsername,
      fullname: user.fullname || cleanUsername,
      role: user.role || "staff",
      status: user.status || "active"
    },
    message: "เพิ่มผู้ใช้งานสำเร็จแล้ว!"
  };
}

/**
 * อัปเดตข้อมูลผู้ใช้งาน
 */
function handleUpdateUser(userId, userData) {
  if (!userId || !userData) {
    return { success: false, error: "ข้อมูลไม่ครบถ้วน" };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Users");
  if (!sheet) return { success: false, error: "Sheet Users not found" };

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      if (userData.fullname !== undefined) sheet.getRange(i + 1, 4).setValue(userData.fullname);
      if (userData.role !== undefined) sheet.getRange(i + 1, 5).setValue(userData.role);
      if (userData.status !== undefined) sheet.getRange(i + 1, 6).setValue(userData.status);
      if (userData.password && userData.password.trim()) {
        sheet.getRange(i + 1, 3).setValue(userData.password.trim());
      }
      return { success: true, message: "บันทึกข้อมูลผู้ใช้สำเร็จแล้ว!" };
    }
  }
  return { success: false, error: "ไม่พบผู้ใช้ที่ต้องการแก้ไข" };
}

/**
 * ลบผู้ใช้งาน (ป้องกันการลบ Admin คนสุดท้าย)
 */
function handleDeleteUser(userId) {
  if (!userId) return { success: false, error: "ไม่ระบุ User ID" };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Users");
  if (!sheet) return { success: false, error: "Sheet Users not found" };

  var data = sheet.getDataRange().getValues();
  var targetRow = -1;
  var targetRole = "";
  var adminCount = 0;

  for (var i = 1; i < data.length; i++) {
    if (data[i][4] === "admin" && data[i][5] === "active") {
      adminCount++;
    }
    if (data[i][0] === userId) {
      targetRow = i + 1;
      targetRole = data[i][4];
    }
  }

  if (targetRow === -1) {
    return { success: false, error: "ไม่พบผู้ใช้งานที่ต้องการลบ" };
  }

  if (targetRole === "admin" && adminCount <= 1) {
    return { success: false, error: "ไม่สามารถลบผู้ดูแลระบบ (Admin) คนสุดท้ายของระบบได้" };
  }

  sheet.deleteRow(targetRow);
  return { success: true, message: "ลบผู้ใช้งานสำเร็จแล้ว!" };
}

/**
 * ====================================================================
 * DATABASE UTILITY FUNCTIONS
 * ====================================================================
 */

function getGroupRecord(groupId) {
  var groups = getSheetDataAsObjects("Groups");
  return groups.find(function(g) { return g.group_id === groupId; });
}

function registerOrUpdateGroup(item) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Groups");
  if (!sheet) return null;

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === item.groupId) {
      if (item.groupName) sheet.getRange(i + 1, 2).setValue(item.groupName);
      if (item.pictureUrl) sheet.getRange(i + 1, 3).setValue(item.pictureUrl);
      if (item.rootFolderId) sheet.getRange(i + 1, 4).setValue(item.rootFolderId);
      if (item.imagesFolderId) sheet.getRange(i + 1, 5).setValue(item.imagesFolderId);
      if (item.filesFolderId) sheet.getRange(i + 1, 6).setValue(item.filesFolderId);
      if (item.status) sheet.getRange(i + 1, 15).setValue(item.status);
      sheet.getRange(i + 1, 16).setValue(new Date());
      return getGroupRecord(item.groupId);
    }
  }

  // เพิ่มแถวใหม่
  sheet.appendRow([
    item.groupId,
    item.groupName,
    item.pictureUrl || "",
    item.rootFolderId || "",
    item.imagesFolderId || "",
    item.filesFolderId || "",
    "", "", "",
    item.autoSave !== undefined ? item.autoSave : true,
    item.autoImagesetAlbum !== undefined ? item.autoImagesetAlbum : true,
    item.replyMode || "summary",
    0, 0,
    item.status || "active",
    new Date()
  ]);

  return getGroupRecord(item.groupId);
}

function updateGroupActiveAlbum(groupId, albumId, albumName, expiresAt) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Groups");
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === groupId) {
      sheet.getRange(i + 1, 7).setValue(albumId || "");
      sheet.getRange(i + 1, 8).setValue(albumName || "");
      sheet.getRange(i + 1, 9).setValue(expiresAt || "");
      sheet.getRange(i + 1, 16).setValue(new Date());
      break;
    }
  }
}

function saveAlbumRecord(item) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Albums");
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === item.albumId) {
      if (item.albumName) sheet.getRange(i + 1, 3).setValue(item.albumName);
      if (item.coverUrl) sheet.getRange(i + 1, 6).setValue(item.coverUrl);
      return;
    }
  }

  sheet.appendRow([
    item.albumId,
    item.groupId,
    item.albumName,
    item.folderId,
    item.folderUrl,
    item.coverUrl || "",
    item.imageCount || 0,
    item.createdBy || "",
    new Date()
  ]);
}

function saveFileRecord(item) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Files");
  if (!sheet) return;

  sheet.appendRow([
    item.fileId,
    item.groupId,
    item.groupName,
    item.category,
    item.albumId || "",
    item.albumName || "",
    item.fileName,
    item.mimeType,
    item.fileSize,
    item.driveFileId,
    item.driveUrl,
    item.thumbnailUrl || "",
    item.senderId || "",
    item.senderName || "",
    item.lineMessageId || "",
    new Date()
  ]);

  if (item.albumId) {
    recalculateAlbumCount(item.albumId);
  }
}

function incrementGroupCount(groupId, category) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Groups");
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === groupId) {
      var col = category === "image" ? 14 : 13; // image_count (14), file_count (13)
      var current = parseInt(data[i][col - 1]) || 0;
      sheet.getRange(i + 1, col).setValue(current + 1);
      sheet.getRange(i + 1, 16).setValue(new Date());
      break;
    }
  }
}

function recalculateAlbumCount(albumId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var filesSheet = ss.getSheetByName("Files");
  var albumsSheet = ss.getSheetByName("Albums");
  if (!filesSheet || !albumsSheet) return;

  var filesData = filesSheet.getDataRange().getValues();
  var count = 0;
  for (var i = 1; i < filesData.length; i++) {
    if (filesData[i][4] === albumId) {
      count++;
    }
  }

  var albumsData = albumsSheet.getDataRange().getValues();
  for (var j = 1; j < albumsData.length; j++) {
    if (albumsData[j][0] === albumId) {
      albumsSheet.getRange(j + 1, 7).setValue(count);
      break;
    }
  }
}

function logWebhookEvent(eventType, groupId, userId, messageType, details) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("WebhookLogs");
    if (!sheet) return;

    var logId = "LOG-" + Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyyMMdd-HHmmss-SSS");
    sheet.appendRow([logId, new Date(), eventType, groupId, userId, messageType, details]);
  } catch (e) {
    Logger.log("Log error: " + e.message);
  }
}

function getSettingValue(key, defaultValue) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Settings");
  if (!sheet) return defaultValue;

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === key && data[i][1] !== "") {
      return data[i][1];
    }
  }
  return defaultValue;
}

function getSheetDataAsObjects(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var result = [];

  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var header = headers[j];
      var val = data[i][j];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, "Asia/Bangkok", "yyyy-MM-dd'T'HH:mm:ss'Z'");
      }
      obj[header] = val;
    }
    result.push(obj);
  }
  return result;
}
