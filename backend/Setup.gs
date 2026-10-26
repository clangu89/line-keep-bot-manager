/**
 * ====================================================================
 * ระบบบริหารจัดการ LINE Keep Bot & Google Drive Storage
 * ไฟล์: Setup.gs - สคริปต์สร้างฐานข้อมูล Google Sheets และโฟลเดอร์ Google Drive
 * ====================================================================
 */

/**
 * ฟังก์ชันติดตั้งระบบฐานข้อมูลและโฟลเดอร์เริ่มต้น (รันครั้งแรกเพียงครั้งเดียว)
 */
function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. ตารางกลุ่ม LINE (Groups)
  setupSheet(ss, "Groups", [
    "group_id", "group_name", "picture_url", "root_folder_id", 
    "images_folder_id", "files_folder_id", "active_album_id", 
    "active_album_name", "active_album_expires", "auto_save", 
    "auto_imageset_album", "reply_mode", "file_count", "image_count", 
    "status", "updated_at"
  ], [
    [
      "GRP-DEMO-001", "ทีมพัฒนาแอปพลิเคชัน & ไอที", 
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150", 
      "", "", "", "", "", "", true, true, "summary", 18, 42, "active", new Date()
    ],
    [
      "GRP-DEMO-002", "ฝ่ายการตลาดและประชาสัมพันธ์ (Marketing)", 
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=150", 
      "", "", "", "ALB-DEMO-001", "งานแถลงข่าวเปิดตัวสินค้า 2026", 
      new Date(Date.now() + 3600000).toISOString(), true, true, "summary", 9, 78, "active", new Date()
    ],
    [
      "GRP-DEMO-003", "ฝ่ายบริหารและบุคคลกลาง (HR & Admin)", 
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=150", 
      "", "", "", "", "", "", true, false, "silent", 34, 15, "active", new Date()
    ]
  ]);

  // 2. ตารางอัลบั้มรูปภาพ (Albums)
  setupSheet(ss, "Albums", [
    "album_id", "group_id", "album_name", "folder_id", 
    "folder_url", "cover_url", "image_count", "created_by", "created_at"
  ], [
    [
      "ALB-DEMO-001", "GRP-DEMO-002", "งานแถลงข่าวเปิดตัวสินค้า 2026", 
      "", "https://drive.google.com", 
      "https://images.unsplash.com/photo-1511578314322-379afb476865?w=500", 
      45, "นิตยา การตลาด", new Date("2026-10-15T10:30:00")
    ],
    [
      "ALB-DEMO-002", "GRP-DEMO-001", "งานสัมมนา Outing ประจำปี 2026", 
      "", "https://drive.google.com", 
      "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=500", 
      32, "สมศักดิ์ ไอที", new Date("2026-10-12T14:20:00")
    ],
    [
      "ALB-DEMO-003", "GRP-DEMO-002", "ภาพถ่ายบรรยากาศบูธจัดแสดงงานนวัตกรรม", 
      "", "https://drive.google.com", 
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500", 
      18, "วิภาวรรณ สื่อสาร", new Date("2026-10-18T16:00:00")
    ]
  ]);

  // 3. ตารางประวัติการบันทึกไฟล์ (Files)
  setupSheet(ss, "Files", [
    "file_id", "group_id", "group_name", "category", "album_id", 
    "album_name", "file_name", "mime_type", "file_size", "drive_file_id", 
    "drive_url", "thumbnail_url", "sender_id", "sender_name", "line_message_id", "created_at"
  ], [
    [
      "FIL-202610-001", "GRP-DEMO-002", "ฝ่ายการตลาดและประชาสัมพันธ์ (Marketing)", 
      "image", "ALB-DEMO-001", "งานแถลงข่าวเปิดตัวสินค้า 2026", 
      "PR_Press_Conference_01.jpg", "image/jpeg", 2450120, "", 
      "https://drive.google.com", "https://images.unsplash.com/photo-1511578314322-379afb476865?w=300", 
      "U11111", "นิตยา การตลาด", "MSG-1001", new Date("2026-10-15T10:32:00")
    ],
    [
      "FIL-202610-002", "GRP-DEMO-001", "ทีมพัฒนาแอปพลิเคชัน & ไอที", 
      "other", "", "", 
      "System_Architecture_2026.pdf", "application/pdf", 4892300, "", 
      "https://drive.google.com", "", 
      "U22222", "สมศักดิ์ ไอที", "MSG-1002", new Date("2026-10-16T11:15:00")
    ],
    [
      "FIL-202610-003", "GRP-DEMO-001", "ทีมพัฒนาแอปพลิเคชัน & ไอที", 
      "other", "", "", 
      "Sprint_Backlog_Q4.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 1245000, "", 
      "https://drive.google.com", "", 
      "U33333", "ประสิทธิ์ พัฒนา", "MSG-1003", new Date("2026-10-17T09:40:00")
    ],
    [
      "FIL-202610-004", "GRP-DEMO-003", "ฝ่ายบริหารและบุคคลกลาง (HR & Admin)", 
      "other", "", "", 
      "นโยบายสวัสดิการพนักงานใหม่_2026.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 856000, "", 
      "https://drive.google.com", "", 
      "U44444", "สมชาย บุคคล", "MSG-1004", new Date("2026-10-18T13:20:00")
    ],
    [
      "FIL-202610-005", "GRP-DEMO-001", "ทีมพัฒนาแอปพลิเคชัน & ไอที", 
      "image", "", "", 
      "UI_Mockup_Mobile_V2.png", "image/png", 1820400, "", 
      "https://drive.google.com", "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=300", 
      "U22222", "สมศักดิ์ ไอที", "MSG-1005", new Date("2026-10-19T15:10:00")
    ]
  ]);

  // 4. ตารางประวัติ Webhook (WebhookLogs)
  setupSheet(ss, "WebhookLogs", [
    "log_id", "timestamp", "event_type", "group_id", 
    "user_id", "message_type", "details"
  ], [
    ["LOG-001", new Date(), "message", "GRP-DEMO-001", "U22222", "image", "บันทึกรูปภาพเดี่ยวสำเร็จ (UI_Mockup_Mobile_V2.png)"],
    ["LOG-002", new Date(), "message", "GRP-DEMO-002", "U11111", "image", "บันทึกเข้าอัลบั้ม: งานแถลงข่าวเปิดตัวสินค้า 2026"]
  ]);

  // 5. ตารางการตั้งค่าระบบ (Settings)
  setupSheet(ss, "Settings", [
    "key", "value", "description"
  ], [
    ["LINE_CHANNEL_ACCESS_TOKEN", "", "Channel Access Token (Long-lived) จาก LINE Developers Console"],
    ["LINE_CHANNEL_SECRET", "", "Channel Secret สำหรับตรวจสอบ Webhook Signature"],
    ["LINE_LIFF_ID", "", "LIFF ID สำหรับเปิดหน้าจออัปโหลดอัลบั้มรูปภาพใน LINE"],
    ["ROOT_FOLDER_NAME", "LINE_Keep_Bot_Storage", "ชื่อโฟลเดอร์หลักใน Google Drive สำหรับเก็บไฟล์จากทุกกลุ่ม LINE"],
    ["ROOT_FOLDER_ID", "", "Drive Folder ID ของโฟลเดอร์หลัก (ระบบจะใส่ให้อัตโนมัติเมื่อรัน setupDatabase)"],
    ["DEFAULT_REPLY_MODE", "summary", "โหมดตอบกลับเริ่มต้นของกลุ่มใหม่: silent (เงียบ), summary (สรุป), all (แจ้งทุกครั้ง)"],
    ["ALBUM_SESSION_MINUTES", "60", "ระยะเวลาเปิดโหมดอัลบั้มค้างไว้ก่อนหมดอายุอัตโนมัติ (นาที)"]
  ]);

  // 6. ตารางผู้ดูแลระบบ (Users)
  setupSheet(ss, "Users", [
    "user_id", "username", "password", "fullname", "role", "status"
  ], [
    ["USR-001", "admin", "admin1234", "ผู้ดูแลระบบ LINE Keep Bot", "admin", "active"]
  ]);

  // สร้างโฟลเดอร์หลักใน Google Drive
  var rootFolder = initDriveRootFolder(ss);
  
  Logger.log("✅ ติดตั้งฐานข้อมูล Google Sheets และโฟลเดอร์ Google Drive สำเร็จแล้ว!");
  Logger.log("📁 Root Folder ID: " + (rootFolder ? rootFolder.getId() : "N/A"));
}

/**
 * สร้างหรือตั้งค่าหัวตาราง Sheet
 */
function setupSheet(ss, sheetName, headers, initialData) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#059669"); // Emerald Green
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    
    if (initialData && initialData.length > 0) {
      sheet.getRange(2, 1, initialData.length, headers.length).setValues(initialData);
    }
  }
}

/**
 * ค้นหาหรือสร้างโฟลเดอร์หลักใน Google Drive
 */
function initDriveRootFolder(ss) {
  var settingsSheet = ss.getSheetByName("Settings");
  var folderName = "LINE_Keep_Bot_Storage";
  var existingRootId = "";
  
  if (settingsSheet) {
    var data = settingsSheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === "ROOT_FOLDER_NAME" && data[i][1]) {
        folderName = data[i][1].toString().trim();
      }
      if (data[i][0] === "ROOT_FOLDER_ID" && data[i][1]) {
        existingRootId = data[i][1].toString().trim();
      }
    }
  }

  var folder;
  if (existingRootId) {
    try {
      folder = DriveApp.getFolderById(existingRootId);
      return folder;
    } catch (e) {
      Logger.log("⚠️ โฟลเดอร์เดิมไม่พบ หรือไม่มีสิทธิ์เข้าถึง สร้างโฟลเดอร์ใหม่แทน: " + e.message);
    }
  }

  // ค้นหาตามชื่อใน Drive
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder(folderName);
  }

  // บันทึก Folder ID ลงในตาราง Settings
  if (settingsSheet && folder) {
    var data = settingsSheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === "ROOT_FOLDER_ID") {
        settingsSheet.getRange(i + 1, 2).setValue(folder.getId());
        break;
      }
    }
  }

  return folder;
}
