/**
 * ====================================================================
 * ระบบบริหารจัดการ LINE Keep Bot & Google Drive Storage
 * ไฟล์: LineBot.gs - ประมวลผล Webhook และจัดการไฟล์จาก LINE Messaging API
 * ====================================================================
 */

/**
 * ฟังก์ชันหลักประมวลผล Webhook Events จาก LINE
 */
function handleLineWebhook(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: "ok", message: "No post data" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var contents = JSON.parse(e.postData.contents);
    var events = contents.events || [];
    
    if (events.length === 0) {
      return ContentService.createTextOutput(JSON.stringify({ status: "ok", message: "No events" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    for (var i = 0; i < events.length; i++) {
      processLineEvent(events[i]);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log("❌ Error in handleLineWebhook: " + error.toString());
    logWebhookEvent("ERROR", "", "", "webhook", error.toString());
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * แยกประเภทและประมวลผลแต่ละ Event จาก LINE
 */
function processLineEvent(event) {
  var eventType = event.type;
  var source = event.source || {};
  var sourceType = source.type; // 'group', 'room', 'user'
  var groupId = source.groupId || source.roomId || source.userId;
  var userId = source.userId || "";
  var replyToken = event.replyToken;

  logWebhookEvent(eventType, groupId, userId, event.message ? event.message.type : "", "Processing event");

  // กรณีบอทถูกเชิญเข้ากลุ่ม (Join Event)
  if (eventType === "join") {
    handleBotJoinGroup(groupId, replyToken);
    return;
  }

  // กรณีบอทถูกเตะออกจากกลุ่ม (Leave Event)
  if (eventType === "leave") {
    handleBotLeaveGroup(groupId);
    return;
  }

  // กรณีรับข้อความ (Message Event)
  if (eventType === "message") {
    var message = event.message;
    var messageType = message.type;

    if (messageType === "text") {
      handleTextMessage(groupId, userId, message.text, replyToken, sourceType);
    } else if (messageType === "image") {
      handleImageMessage(groupId, userId, message, replyToken, sourceType);
    } else if (messageType === "file" || messageType === "video" || messageType === "audio") {
      handleOtherFileMessage(groupId, userId, message, messageType, replyToken, sourceType);
    }
  }
}

/**
 * จัดการเมื่อบอทถูกเชิญเข้ากลุ่ม LINE
 */
function handleBotJoinGroup(groupId, replyToken) {
  var groupInfo = fetchLineGroupSummary(groupId);
  var groupName = groupInfo ? groupInfo.groupName : ("กลุ่ม LINE (" + groupId.substring(0, 8) + ")");
  var pictureUrl = groupInfo ? groupInfo.pictureUrl : "";

  var groupFolders = ensureGroupFolders(groupId, groupName);

  // บันทึกหรืออัปเดตลงตาราง Groups
  registerOrUpdateGroup({
    groupId: groupId,
    groupName: groupName,
    pictureUrl: pictureUrl,
    rootFolderId: groupFolders.rootFolderId,
    imagesFolderId: groupFolders.imagesFolderId,
    filesFolderId: groupFolders.filesFolderId,
    status: "active"
  });

  // ส่งข้อความทักทายและแจ้งวิธีใช้งาน
  var welcomeText = "🤖 ยินดีต้อนรับสู่ LINE Keep Bot!\n\n" +
    "บอทนี้จะช่วยจัดเก็บรูปภาพและไฟล์ทั้งหมดในกลุ่มเข้า Google Drive อัตโนมัติ:\n" +
    "📁 โฟลเดอร์กลุ่ม: " + groupName + "\n" +
    "  ├ 📸 1.รูปภาพ (แยกภาพเดี่ยว & อัลบั้ม)\n" +
    "  └ 📄 2.ไฟล์อื่นๆ (PDF, Word, Excel, Video)\n\n" +
    "💡 คำสั่งที่ใช้ได้ในแชท:\n" +
    "• พิมพ์ \"#อัลบั้ม [ชื่อ]\" เพื่อสร้างและเริ่มบันทึกเข้าอัลบั้ม\n" +
    "• พิมพ์ \"#จบอัลบั้ม\" เพื่อกลับสู่โหมดภาพเดี่ยว\n" +
    "• พิมพ์ \"#สถานะ\" เพื่อดูโฟลเดอร์ Drive และสถิติ\n" +
    "• พิมพ์ \"#ช่วยเหลือ\" เพื่อดูคู่มือคำสั่งทั้งหมด\n\n" +
    "🔗 ลิงก์ Drive: " + groupFolders.rootFolderUrl;

  replyLineText(replyToken, welcomeText);
}

/**
 * จัดการเมื่อบอทออกจากกลุ่ม
 */
function handleBotLeaveGroup(groupId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Groups");
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === groupId) {
      sheet.getRange(i + 1, 15).setValue("inactive"); // status column
      sheet.getRange(i + 1, 16).setValue(new Date());  // updated_at column
      break;
    }
  }
}

/**
 * ประมวลผลข้อความตัวอักษรและคำสั่งแชท (#อัลบั้ม, #จบอัลบั้ม, #สถานะ)
 */
function handleTextMessage(groupId, userId, text, replyToken, sourceType) {
  var cleanText = text ? text.trim() : "";
  
  // ตรวจสอบคำสั่งเริ่มอัลบั้ม (#อัลบั้ม <ชื่อ>, /album <ชื่อ>)
  if (/^(#อัลบั้ม|\/album)\s+/i.test(cleanText)) {
    var albumName = cleanText.replace(/^(#อัลบั้ม|\/album)\s+/i, "").trim();
    if (!albumName) {
      replyLineText(replyToken, "⚠️ กรุณาระบุชื่ออัลบั้ม เช่น:\n#อัลบั้ม งานสัมมนา 2026");
      return;
    }
    startGroupAlbum(groupId, albumName, userId, replyToken);
    return;
  }

  // ตรวจสอบคำสั่งปิดอัลบั้ม
  if (/^(#จบอัลบั้ม|#ปิดอัลบั้ม|\/endalbum|#ภาพเดี่ยว)$/i.test(cleanText)) {
    endGroupAlbum(groupId, replyToken);
    return;
  }

  // คำสั่งตรวจสอบสถานะและลิงก์ Google Drive
  if (/^(#สถานะ|#โฟลเดอร์|#drive|\/status)$/i.test(cleanText)) {
    showGroupStatus(groupId, replyToken);
    return;
  }

  // คำสั่งช่วยเหลือ
  if (/^(#ช่วยเหลือ|#help|\/help)$/i.test(cleanText)) {
    showHelpGuide(replyToken);
    return;
  }
}

/**
 * เริ่มโหมดบันทึกอัลบั้มรูปภาพ
 */
function startGroupAlbum(groupId, albumName, userId, replyToken) {
  var group = getGroupRecord(groupId);
  if (!group) {
    var groupInfo = fetchLineGroupSummary(groupId);
    var groupName = groupInfo ? groupInfo.groupName : "กลุ่ม LINE";
    var folders = ensureGroupFolders(groupId, groupName);
    group = registerOrUpdateGroup({
      groupId: groupId,
      groupName: groupName,
      rootFolderId: folders.rootFolderId,
      imagesFolderId: folders.imagesFolderId,
      filesFolderId: folders.filesFolderId
    });
  }

  var imagesFolder = DriveApp.getFolderById(group.images_folder_id);
  var albumFolder = getOrCreateSubFolder(imagesFolder, albumName);
  var albumId = "ALB-" + Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyyMMdd-HHmmss");

  // บันทึก/อัปเดตลงตาราง Albums
  saveAlbumRecord({
    albumId: albumId,
    groupId: groupId,
    albumName: albumName,
    folderId: albumFolder.getId(),
    folderUrl: albumFolder.getUrl(),
    createdBy: userId || "LINE Member"
  });

  // อัปเดตสถานะ Active Album ในตาราง Groups (อายุ 60 นาที)
  var sessionMinutes = getSettingValue("ALBUM_SESSION_MINUTES", 60);
  var expiresAt = new Date(Date.now() + sessionMinutes * 60 * 1000).toISOString();

  updateGroupActiveAlbum(groupId, albumId, albumName, expiresAt);

  var replyMsg = "📸 เปิดโหมดอัลบั้มสำเร็จ!\n\n" +
    "📂 โฟลเดอร์อัลบั้ม: \"" + albumName + "\"\n" +
    "⏰ ระยะเวลาเปิดโหมด: " + sessionMinutes + " นาที (หรือจนกว่าจะพิมพ์ #จบอัลบั้ม)\n\n" +
    "รูปภาพที่ส่งหลังจากนี้จะถูกบันทึกแยกเข้าโฟลเดอร์นี้ทั้งหมดอัตโนมัติครับ\n" +
    "🔗 ลิงก์อัลบั้ม: " + albumFolder.getUrl();

  replyLineText(replyToken, replyMsg);
}

/**
 * สิ้นสุดโหมดอัลบั้ม กลับสู่ภาพเดี่ยว
 */
function endGroupAlbum(groupId, replyToken) {
  var group = getGroupRecord(groupId);
  var prevAlbumName = group ? group.active_album_name : "";

  updateGroupActiveAlbum(groupId, "", "", "");

  var replyMsg = "✅ จบการบันทึกเข้าอัลบั้มเรียบร้อยแล้ว\n\n" +
    (prevAlbumName ? "📂 อัลบั้มที่ปิด: \"" + prevAlbumName + "\"\n" : "") +
    "📷 รูปภาพที่ส่งหลังจากนี้จะถูกบันทึกเป็นภาพเดี่ยวทั่วไป";

  replyLineText(replyToken, replyMsg);
}

/**
 * แสดงสถานะและลิงก์ Google Drive ของกลุ่ม
 */
function showGroupStatus(groupId, replyToken) {
  var group = getGroupRecord(groupId);
  if (!group) {
    replyLineText(replyToken, "⚠️ ยังไม่พบข้อมูลการบันทึกของกลุ่มนี้ในระบบ กรุณาลองส่งรูปภาพหรือไฟล์เพื่อเริ่มต้นใช้งานครับ");
    return;
  }

  var activeStatus = "ภาพเดี่ยวทั่วไป";
  if (group.active_album_id && group.active_album_name) {
    var isExpired = group.active_album_expires && new Date(group.active_album_expires) < new Date();
    if (!isExpired) {
      activeStatus = "📸 อัลบั้ม: " + group.active_album_name;
    }
  }

  var statusText = "📊 สถานะการบันทึกกลุ่ม LINE Keep Bot\n" +
    "────────────────────\n" +
    "👥 ชื่อกลุ่ม: " + group.group_name + "\n" +
    "🎯 โหมดปัจจุบัน: " + activeStatus + "\n" +
    "🖼️ รูปภาพที่บันทึกแล้ว: " + (group.image_count || 0) + " ภาพ\n" +
    "📄 ไฟล์อื่นๆ ที่บันทึกแล้ว: " + (group.file_count || 0) + " ไฟล์\n" +
    "🔔 การแจ้งเตือน: " + (group.reply_mode === "silent" ? "โหมดเงียบ" : group.reply_mode === "all" ? "แจ้งทุกครั้ง" : "แจ้งเฉพาะสรุป/เอกสาร") + "\n\n" +
    "🔗 โฟลเดอร์หลักใน Drive:\n" +
    "https://drive.google.com/drive/folders/" + group.root_folder_id;

  replyLineText(replyToken, statusText);
}

/**
 * แสดงคู่มือคำสั่งช่วยเหลือ
 */
function showHelpGuide(replyToken) {
  var guide = "📖 คู่มือคำสั่ง LINE Keep Bot\n" +
    "────────────────────\n" +
    "1️⃣ #อัลบั้ม [ชื่ออัลบั้ม]\n" +
    "   สร้างและเปิดโหมดบันทึกรูปเข้าอัลบั้ม เช่น:\n" +
    "   #อัลบั้ม สำรวจหน้างานเชียงใหม่\n\n" +
    "2️⃣ #จบอัลบั้ม\n" +
    "   ปิดโหมดอัลบั้ม สลับกลับมาบันทึกภาพเดี่ยว\n\n" +
    "3️⃣ #สถานะ\n" +
    "   ดูสรุปจำนวนไฟล์ และรับลิงก์ Google Drive\n\n" +
    "4️⃣ #ช่วยเหลือ\n" +
    "   แสดงรายการคำสั่งนี้อีกครั้ง\n\n" +
    "💡 Tip: ไฟล์เอกสารและวิดีโอจะถูกเก็บเข้าโฟลเดอร์ \"2.ไฟล์อื่นๆ\" โดยอัตโนมัติเสมอ";

  replyLineText(replyToken, guide);
}

/**
 * จัดการเมื่อมีสมาชิกส่งรูปภาพเข้ากลุ่ม (รองรับทั้งภาพเดี่ยว, อัลบั้ม และ imageSet)
 */
function handleImageMessage(groupId, userId, message, replyToken, sourceType) {
  var messageId = message.id;
  var imageSet = message.imageSet; // { id: "xxx", index: 1, total: 5 }
  
  var group = getGroupRecord(groupId);
  if (!group) {
    var groupInfo = fetchLineGroupSummary(groupId);
    var groupName = groupInfo ? groupInfo.groupName : "กลุ่ม LINE";
    var folders = ensureGroupFolders(groupId, groupName);
    group = registerOrUpdateGroup({
      groupId: groupId,
      groupName: groupName,
      rootFolderId: folders.rootFolderId,
      imagesFolderId: folders.imagesFolderId,
      filesFolderId: folders.filesFolderId
    });
  }

  // ถ้าปิด auto_save รายกลุ่มไว้ ไม่ต้องบันทึก
  if (group.auto_save === false || group.auto_save === "false") {
    return;
  }

  var targetFolder;
  var albumId = "";
  var albumName = "";

  // ตรวจสอบว่ามี Active Album หรือไม่
  var hasActiveAlbum = false;
  if (group.active_album_id && group.active_album_name) {
    var isExpired = group.active_album_expires && new Date(group.active_album_expires) < new Date();
    if (!isExpired) {
      hasActiveAlbum = true;
      albumId = group.active_album_id;
      albumName = group.active_album_name;
    } else {
      // หมดอายุแล้ว รีเซ็ต
      updateGroupActiveAlbum(groupId, "", "", "");
    }
  }

  var imagesFolder = DriveApp.getFolderById(group.images_folder_id);

  if (hasActiveAlbum) {
    targetFolder = getOrCreateSubFolder(imagesFolder, albumName);
  } else if (imageSet && (group.auto_imageset_album !== false && group.auto_imageset_album !== "false")) {
    // ส่งหลายรูปพร้อมกัน (imageSet) -> จัดกลุ่มเข้าโฟลเดอร์อัตโนมัติ
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      var cache = CacheService.getScriptCache();
      var cachedFolderId = cache.get("imgset_" + imageSet.id);
      
      if (cachedFolderId) {
        targetFolder = DriveApp.getFolderById(cachedFolderId);
        albumName = cache.get("imgset_name_" + imageSet.id) || "ชุดรูปภาพ_" + imageSet.id.substring(0, 8);
        albumId = "SET-" + imageSet.id;
      } else {
        var timeStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyyMMdd_HHmm");
        albumName = "ชุดรูปภาพ_" + timeStr + " (" + imageSet.total + " ภาพ)";
        targetFolder = getOrCreateSubFolder(imagesFolder, albumName);
        albumId = "SET-" + imageSet.id;
        
        cache.put("imgset_" + imageSet.id, targetFolder.getId(), 3600);
        cache.put("imgset_name_" + imageSet.id, albumName, 3600);
        
        saveAlbumRecord({
          albumId: albumId,
          groupId: groupId,
          albumName: albumName,
          folderId: targetFolder.getId(),
          folderUrl: targetFolder.getUrl(),
          createdBy: "Auto-ImageSet"
        });
      }
    } catch (lockError) {
      Logger.log("Lock error for imageSet: " + lockError.toString());
      targetFolder = imagesFolder;
    } finally {
      lock.releaseLock();
    }
  } else {
    // ภาพเดี่ยวทั่วไป -> เก็บใน 1.รูปภาพ
    targetFolder = imagesFolder;
  }

  // ดาวน์โหลด Binary Content จาก LINE
  var imageBlob = fetchLineMessageBinary(messageId);
  if (!imageBlob) {
    Logger.log("❌ ไม่สามารถดาวน์โหลดรูปภาพ ID: " + messageId);
    return;
  }

  var timestamp = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyyMMdd_HHmmss");
  var filename = "IMG_" + timestamp + "_" + messageId.substring(messageId.length - 4) + ".jpg";
  imageBlob.setName(filename);

  var driveFile = targetFolder.createFile(imageBlob);
  driveFile.setDescription("บันทึกจากกลุ่ม LINE: " + group.group_name + " เมื่อ " + new Date().toLocaleString("th-TH"));

  // ดึงโปรไฟล์ผู้ส่ง
  var senderName = fetchUserProfile(groupId, userId);

  // บันทึกลงตาราง Files
  var fileId = "FIL-" + Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyyMMdd-HHmmss") + "-" + Math.floor(Math.random() * 1000);
  saveFileRecord({
    fileId: fileId,
    groupId: groupId,
    groupName: group.group_name,
    category: "image",
    albumId: albumId,
    albumName: albumName,
    fileName: filename,
    mimeType: driveFile.getMimeType(),
    fileSize: driveFile.getSize(),
    driveFileId: driveFile.getId(),
    driveUrl: driveFile.getUrl(),
    thumbnailUrl: driveFile.getThumbnail ? driveFile.getThumbnail().getUrl() : "",
    senderId: userId,
    senderName: senderName,
    lineMessageId: messageId
  });

  incrementGroupCount(groupId, "image");

  // การตอบกลับตาม Reply Mode
  var replyMode = group.reply_mode || "summary";
  if (replyMode === "all") {
    var replyText = "📸 บันทึกรูปภาพสำเร็จ!\n" +
      "📁 " + (albumName ? ("อัลบั้ม: " + albumName) : "ภาพเดี่ยว") + "\n" +
      "🔗 ลิงก์รูป: " + driveFile.getUrl();
    replyLineText(replyToken, replyText);
  } else if (replyMode === "summary" && imageSet && imageSet.index === imageSet.total) {
    var summaryText = "📸 บันทึกชุดรูปภาพสำเร็จ (" + imageSet.total + " ภาพ)\n" +
      "📁 จัดเก็บใน: " + (albumName || "1.รูปภาพ") + "\n" +
      "🔗 ลิงก์โฟลเดอร์: " + targetFolder.getUrl();
    replyLineText(replyToken, summaryText);
  }
}

/**
 * จัดการเมื่อมีสมาชิกส่งไฟล์อื่นๆ เข้ากลุ่ม (เอกสาร PDF, Word, Excel, วิดีโอ, เสียง)
 */
function handleOtherFileMessage(groupId, userId, message, messageType, replyToken, sourceType) {
  var messageId = message.id;
  var group = getGroupRecord(groupId);
  if (!group) {
    var groupInfo = fetchLineGroupSummary(groupId);
    var groupName = groupInfo ? groupInfo.groupName : "กลุ่ม LINE";
    var folders = ensureGroupFolders(groupId, groupName);
    group = registerOrUpdateGroup({
      groupId: groupId,
      groupName: groupName,
      rootFolderId: folders.rootFolderId,
      imagesFolderId: folders.imagesFolderId,
      filesFolderId: folders.filesFolderId
    });
  }

  if (group.auto_save === false || group.auto_save === "false") {
    return;
  }

  var filesFolder = DriveApp.getFolderById(group.files_folder_id);
  var fileBlob = fetchLineMessageBinary(messageId);
  if (!fileBlob) {
    Logger.log("❌ ไม่สามารถดาวน์โหลดไฟล์ ID: " + messageId);
    return;
  }

  var originalFileName = message.fileName || "";
  if (!originalFileName) {
    var ext = messageType === "video" ? ".mp4" : messageType === "audio" ? ".m4a" : ".bin";
    originalFileName = "FILE_" + Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyyMMdd_HHmmss") + ext;
  }
  fileBlob.setName(originalFileName);

  var driveFile = filesFolder.createFile(fileBlob);
  driveFile.setDescription("บันทึกจากกลุ่ม LINE: " + group.group_name + " โดย " + userId);

  var senderName = fetchUserProfile(groupId, userId);
  var fileId = "FIL-" + Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyyMMdd-HHmmss") + "-" + Math.floor(Math.random() * 1000);

  saveFileRecord({
    fileId: fileId,
    groupId: groupId,
    groupName: group.group_name,
    category: "other",
    albumId: "",
    albumName: "",
    fileName: originalFileName,
    mimeType: driveFile.getMimeType(),
    fileSize: driveFile.getSize(),
    driveFileId: driveFile.getId(),
    driveUrl: driveFile.getUrl(),
    thumbnailUrl: "",
    senderId: userId,
    senderName: senderName,
    lineMessageId: messageId
  });

  incrementGroupCount(groupId, "file");

  var replyMode = group.reply_mode || "summary";
  if (replyMode === "all" || replyMode === "summary") {
    var fileTypeIcon = originalFileName.endsWith(".pdf") ? "📑" : originalFileName.endsWith(".xlsx") ? "📊" : "📄";
    var replyText = fileTypeIcon + " บันทึกไฟล์เอกสารสำเร็จ!\n" +
      "📄 ชื่อไฟล์: " + originalFileName + "\n" +
      "💾 ขนาด: " + formatBytes(driveFile.getSize()) + "\n" +
      "📁 จัดเก็บใน: 2.ไฟล์อื่นๆ\n" +
      "🔗 ลิงก์ไฟล์: " + driveFile.getUrl();
    replyLineText(replyToken, replyText);
  }
}

/**
 * ====================================================================
 * HELPER FUNCTIONS: ติดต่อ LINE Messaging API & Google Drive
 * ====================================================================
 */

/**
 * ดาวน์โหลดข้อมูล Binary ของไฟล์จาก LINE Content API
 */
function fetchLineMessageBinary(messageId) {
  var token = getSettingValue("LINE_CHANNEL_ACCESS_TOKEN", "");
  if (!token) {
    Logger.log("⚠️ ไม่มี LINE_CHANNEL_ACCESS_TOKEN ใน Settings");
    return null;
  }

  var url = "https://api-data.line.me/v2/bot/message/" + messageId + "/content";
  var options = {
    method: "get",
    headers: {
      "Authorization": "Bearer " + token
    },
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() === 200) {
    return response.getBlob();
  } else {
    Logger.log("❌ Error fetchLineMessageBinary status " + response.getResponseCode() + ": " + response.getContentText());
    return null;
  }
}

/**
 * ดึงข้อมูลชื่อและรูปโปรไฟล์กลุ่ม LINE
 */
function fetchLineGroupSummary(groupId) {
  var token = getSettingValue("LINE_CHANNEL_ACCESS_TOKEN", "");
  if (!token || !groupId || !groupId.startsWith("c")) {
    return null;
  }

  try {
    var url = "https://api.line.me/v2/bot/group/" + groupId + "/summary";
    var options = {
      method: "get",
      headers: { "Authorization": "Bearer " + token },
      muteHttpExceptions: true
    };
    var res = UrlFetchApp.fetch(url, options);
    if (res.getResponseCode() === 200) {
      return JSON.parse(res.getContentText());
    }
  } catch (e) {
    Logger.log("Cannot fetch group summary: " + e.message);
  }
  return null;
}

/**
 * ดึงชื่อโปรไฟล์ของผู้ส่งในกลุ่ม LINE
 */
function fetchUserProfile(groupId, userId) {
  if (!userId) return "สมาชิกในกลุ่ม";
  var token = getSettingValue("LINE_CHANNEL_ACCESS_TOKEN", "");
  if (!token) return "สมาชิกในกลุ่ม";

  try {
    var url = (groupId && groupId.startsWith("c"))
      ? ("https://api.line.me/v2/bot/group/" + groupId + "/member/" + userId)
      : ("https://api.line.me/v2/bot/profile/" + userId);
      
    var res = UrlFetchApp.fetch(url, {
      method: "get",
      headers: { "Authorization": "Bearer " + token },
      muteHttpExceptions: true
    });
    if (res.getResponseCode() === 200) {
      var profile = JSON.parse(res.getContentText());
      return profile.displayName || "สมาชิกในกลุ่ม";
    }
  } catch (e) {
    Logger.log("Profile fetch failed: " + e.message);
  }
  return "สมาชิกในกลุ่ม";
}

/**
 * ส่งข้อความตอบกลับไปยัง LINE
 */
function replyLineText(replyToken, text) {
  if (!replyToken) return;
  var token = getSettingValue("LINE_CHANNEL_ACCESS_TOKEN", "");
  if (!token) return;

  var url = "https://api.line.me/v2/bot/message/reply";
  var payload = {
    replyToken: replyToken,
    messages: [
      {
        type: "text",
        text: text
      }
    ]
  };

  try {
    UrlFetchApp.fetch(url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch (e) {
    Logger.log("Reply failed: " + e.message);
  }
}

/**
 * สร้างหรือตรวจสอบโครงสร้างโฟลเดอร์ของกลุ่มใน Google Drive
 * 📁 Root -> 📁 [GroupName] -> 📁 1.รูปภาพ & 📁 2.ไฟล์อื่นๆ
 */
function ensureGroupFolders(groupId, groupName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var rootFolder = initDriveRootFolder(ss);

  var groupFolders = rootFolder.getFoldersByName(groupName);
  var groupFolder;
  if (groupFolders.hasNext()) {
    groupFolder = groupFolders.next();
  } else {
    groupFolder = rootFolder.createFolder(groupName);
  }

  // โฟลเดอร์ 1.รูปภาพ
  var imgFolders = groupFolder.getFoldersByName("1.รูปภาพ");
  var imagesFolder = imgFolders.hasNext() ? imgFolders.next() : groupFolder.createFolder("1.รูปภาพ");

  // โฟลเดอร์ 2.ไฟล์อื่นๆ
  var fileFolders = groupFolder.getFoldersByName("2.ไฟล์อื่นๆ");
  var filesFolder = fileFolders.hasNext() ? fileFolders.next() : groupFolder.createFolder("2.ไฟล์อื่นๆ");

  return {
    rootFolderId: groupFolder.getId(),
    rootFolderUrl: groupFolder.getUrl(),
    imagesFolderId: imagesFolder.getId(),
    imagesFolderUrl: imagesFolder.getUrl(),
    filesFolderId: filesFolder.getId(),
    filesFolderUrl: filesFolder.getUrl()
  };
}

/**
 * ค้นหาหรือสร้างโฟลเดอร์ย่อยในโฟลเดอร์ที่ระบุ
 */
function getOrCreateSubFolder(parentFolder, subFolderName) {
  var folders = parentFolder.getFoldersByName(subFolderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parentFolder.createFolder(subFolderName);
}

/**
 * แปลงขนาดไบต์เป็นหน่วยที่อ่านง่าย
 */
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 Bytes";
  var k = 1024;
  var sizes = ["Bytes", "KB", "MB", "GB"];
  var i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
