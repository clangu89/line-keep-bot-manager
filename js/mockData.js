/**
 * ====================================================================
 * LINE Keep Bot & Google Drive Manager
 * ไฟล์: js/mockData.js - ข้อมูลจำลองสำหรับ Demo / Mock Mode
 * ====================================================================
 */

const MockDatabase = {
  getInitialData() {
    return {
      groups: [
        {
          group_id: "GRP-001",
          group_name: "ทีมพัฒนาแอปพลิเคชัน & ไอที",
          picture_url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150",
          root_folder_id: "1A2B3C_IT_DEV_ROOT",
          images_folder_id: "1A2B3C_IT_IMAGES",
          files_folder_id: "1A2B3C_IT_FILES",
          active_album_id: "",
          active_album_name: "",
          active_album_expires: "",
          auto_save: true,
          auto_imageset_album: true,
          reply_mode: "summary",
          file_count: 8,
          image_count: 24,
          status: "active",
          updated_at: "2026-10-20T14:30:00Z"
        },
        {
          group_id: "GRP-002",
          group_name: "ฝ่ายการตลาดและประชาสัมพันธ์ (Marketing)",
          picture_url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=150",
          root_folder_id: "2D3E4F_MKT_ROOT",
          images_folder_id: "2D3E4F_MKT_IMAGES",
          files_folder_id: "2D3E4F_MKT_FILES",
          active_album_id: "ALB-001",
          active_album_name: "งานแถลงข่าวเปิดตัวสินค้า 2026",
          active_album_expires: new Date(Date.now() + 3600000).toISOString(),
          auto_save: true,
          auto_imageset_album: true,
          reply_mode: "summary",
          file_count: 5,
          image_count: 56,
          status: "active",
          updated_at: "2026-10-20T18:15:00Z"
        },
        {
          group_id: "GRP-003",
          group_name: "ฝ่ายบริหารและบุคคลกลาง (HR & Admin)",
          picture_url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=150",
          root_folder_id: "3G4H5I_HR_ROOT",
          images_folder_id: "3G4H5I_HR_IMAGES",
          files_folder_id: "3G4H5I_HR_FILES",
          active_album_id: "",
          active_album_name: "",
          active_album_expires: "",
          auto_save: true,
          auto_imageset_album: false,
          reply_mode: "silent",
          file_count: 14,
          image_count: 12,
          status: "active",
          updated_at: "2026-10-19T11:00:00Z"
        }
      ],

      albums: [
        {
          album_id: "ALB-001",
          group_id: "GRP-002",
          album_name: "งานแถลงข่าวเปิดตัวสินค้า 2026",
          folder_id: "FLDR_ALB_001",
          folder_url: "https://drive.google.com",
          cover_url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600",
          image_count: 28,
          created_by: "นิตยา การตลาด",
          created_at: "2026-10-18T10:00:00Z"
        },
        {
          album_id: "ALB-002",
          group_id: "GRP-001",
          album_name: "งานสัมมนา Outing ประจำปี 2026",
          folder_id: "FLDR_ALB_002",
          folder_url: "https://drive.google.com",
          cover_url: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600",
          image_count: 16,
          created_by: "สมศักดิ์ ไอที",
          created_at: "2026-10-12T16:30:00Z"
        },
        {
          album_id: "ALB-003",
          group_id: "GRP-002",
          album_name: "ภาพถ่ายบรรยากาศบูธนวัตกรรม",
          folder_id: "FLDR_ALB_003",
          folder_url: "https://drive.google.com",
          cover_url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600",
          image_count: 12,
          created_by: "วิภาวรรณ สื่อสาร",
          created_at: "2026-10-15T14:20:00Z"
        },
        {
          album_id: "ALB-004",
          group_id: "GRP-003",
          album_name: "กิจกรรม CSR ปลูกป่าชุมชน",
          folder_id: "FLDR_ALB_004",
          folder_url: "https://drive.google.com",
          cover_url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600",
          image_count: 9,
          created_by: "สมชาย บุคคล",
          created_at: "2026-10-10T09:15:00Z"
        }
      ],

      files: [
        // รูปภาพในอัลบั้ม
        {
          file_id: "FIL-IMG-001",
          group_id: "GRP-002",
          group_name: "ฝ่ายการตลาดและประชาสัมพันธ์ (Marketing)",
          category: "image",
          album_id: "ALB-001",
          album_name: "งานแถลงข่าวเปิดตัวสินค้า 2026",
          file_name: "IMG_20261018_Press_Stage.jpg",
          mime_type: "image/jpeg",
          file_size: 2450120,
          drive_file_id: "DRV_IMG_001",
          drive_url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200",
          thumbnail_url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=500",
          sender_id: "U_MKT_01",
          sender_name: "นิตยา การตลาด",
          line_message_id: "MSG_LINE_001",
          created_at: "2026-10-18T10:35:00Z"
        },
        {
          file_id: "FIL-IMG-002",
          group_id: "GRP-002",
          group_name: "ฝ่ายการตลาดและประชาสัมพันธ์ (Marketing)",
          category: "image",
          album_id: "ALB-001",
          album_name: "งานแถลงข่าวเปิดตัวสินค้า 2026",
          file_name: "IMG_20261018_Keynote_Speech.jpg",
          mime_type: "image/jpeg",
          file_size: 3120400,
          drive_file_id: "DRV_IMG_002",
          drive_url: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200",
          thumbnail_url: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=500",
          sender_id: "U_MKT_01",
          sender_name: "นิตยา การตลาด",
          line_message_id: "MSG_LINE_002",
          created_at: "2026-10-18T10:40:00Z"
        },
        {
          file_id: "FIL-IMG-003",
          group_id: "GRP-001",
          group_name: "ทีมพัฒนาแอปพลิเคชัน & ไอที",
          category: "image",
          album_id: "ALB-002",
          album_name: "งานสัมมนา Outing ประจำปี 2026",
          file_name: "IMG_20261012_Team_Building.jpg",
          mime_type: "image/jpeg",
          file_size: 2890100,
          drive_file_id: "DRV_IMG_003",
          drive_url: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200",
          thumbnail_url: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=500",
          sender_id: "U_IT_01",
          sender_name: "สมศักดิ์ ไอที",
          line_message_id: "MSG_LINE_003",
          created_at: "2026-10-12T16:45:00Z"
        },
        // ภาพเดี่ยว (Single Images)
        {
          file_id: "FIL-IMG-004",
          group_id: "GRP-001",
          group_name: "ทีมพัฒนาแอปพลิเคชัน & ไอที",
          category: "image",
          album_id: "",
          album_name: "",
          file_name: "IMG_20261020_UI_Wireframe.png",
          mime_type: "image/png",
          file_size: 1540300,
          drive_file_id: "DRV_IMG_004",
          drive_url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200",
          thumbnail_url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=500",
          sender_id: "U_IT_02",
          sender_name: "ประสิทธิ์ ดีไซน์",
          line_message_id: "MSG_LINE_004",
          created_at: "2026-10-20T11:20:00Z"
        },
        {
          file_id: "FIL-IMG-005",
          group_id: "GRP-001",
          group_name: "ทีมพัฒนาแอปพลิเคชัน & ไอที",
          category: "image",
          album_id: "",
          album_name: "",
          file_name: "IMG_20261020_Server_Rack.jpg",
          mime_type: "image/jpeg",
          file_size: 3420000,
          drive_file_id: "DRV_IMG_005",
          drive_url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200",
          thumbnail_url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500",
          sender_id: "U_IT_01",
          sender_name: "สมศักดิ์ ไอที",
          line_message_id: "MSG_LINE_005",
          created_at: "2026-10-20T13:45:00Z"
        },
        {
          file_id: "FIL-IMG-006",
          group_id: "GRP-003",
          group_name: "ฝ่ายบริหารและบุคคลกลาง (HR & Admin)",
          category: "image",
          album_id: "",
          album_name: "",
          file_name: "IMG_20261019_Office_New_Desk.jpg",
          mime_type: "image/jpeg",
          file_size: 1980500,
          drive_file_id: "DRV_IMG_006",
          drive_url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200",
          thumbnail_url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=500",
          sender_id: "U_HR_01",
          sender_name: "สมชาย บุคคล",
          line_message_id: "MSG_LINE_006",
          created_at: "2026-10-19T09:10:00Z"
        },

        // ไฟล์อื่นๆ (Documents, Video, Audio, Archives)
        {
          file_id: "FIL-DOC-001",
          group_id: "GRP-001",
          group_name: "ทีมพัฒนาแอปพลิเคชัน & ไอที",
          category: "other",
          album_id: "",
          album_name: "",
          file_name: "System_Architecture_Overview_2026.pdf",
          mime_type: "application/pdf",
          file_size: 4892300,
          drive_file_id: "DRV_DOC_001",
          drive_url: "https://drive.google.com",
          thumbnail_url: "",
          sender_id: "U_IT_01",
          sender_name: "สมศักดิ์ ไอที",
          line_message_id: "MSG_LINE_101",
          created_at: "2026-10-20T10:15:00Z"
        },
        {
          file_id: "FIL-DOC-002",
          group_id: "GRP-001",
          group_name: "ทีมพัฒนาแอปพลิเคชัน & ไอที",
          category: "other",
          album_id: "",
          album_name: "",
          file_name: "Sprint_Backlog_Q4_2026.xlsx",
          mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          file_size: 1245000,
          drive_file_id: "DRV_DOC_002",
          drive_url: "https://drive.google.com",
          thumbnail_url: "",
          sender_id: "U_IT_02",
          sender_name: "ประสิทธิ์ ดีไซน์",
          line_message_id: "MSG_LINE_102",
          created_at: "2026-10-19T14:30:00Z"
        },
        {
          file_id: "FIL-DOC-003",
          group_id: "GRP-002",
          group_name: "ฝ่ายการตลาดและประชาสัมพันธ์ (Marketing)",
          category: "other",
          album_id: "",
          album_name: "",
          file_name: "Press_Release_New_Product_Launch.docx",
          mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          file_size: 980000,
          drive_file_id: "DRV_DOC_003",
          drive_url: "https://drive.google.com",
          thumbnail_url: "",
          sender_id: "U_MKT_01",
          sender_name: "นิตยา การตลาด",
          line_message_id: "MSG_LINE_103",
          created_at: "2026-10-18T15:20:00Z"
        },
        {
          file_id: "FIL-DOC-004",
          group_id: "GRP-002",
          group_name: "ฝ่ายการตลาดและประชาสัมพันธ์ (Marketing)",
          category: "other",
          album_id: "",
          album_name: "",
          file_name: "Teaser_Commercial_15s.mp4",
          mime_type: "video/mp4",
          file_size: 28400000,
          drive_file_id: "DRV_DOC_004",
          drive_url: "https://drive.google.com",
          thumbnail_url: "",
          sender_id: "U_MKT_02",
          sender_name: "วิภาวรรณ สื่อสาร",
          line_message_id: "MSG_LINE_104",
          created_at: "2026-10-18T16:00:00Z"
        },
        {
          file_id: "FIL-DOC-005",
          group_id: "GRP-003",
          group_name: "ฝ่ายบริหารและบุคคลกลาง (HR & Admin)",
          category: "other",
          album_id: "",
          album_name: "",
          file_name: "แบบฟอร์มขออนุมัติลาหยุดงาน_2026.pdf",
          mime_type: "application/pdf",
          file_size: 654000,
          drive_file_id: "DRV_DOC_005",
          drive_url: "https://drive.google.com",
          thumbnail_url: "",
          sender_id: "U_HR_01",
          sender_name: "สมชาย บุคคล",
          line_message_id: "MSG_LINE_105",
          created_at: "2026-10-17T09:30:00Z"
        },
        {
          file_id: "FIL-DOC-006",
          group_id: "GRP-003",
          group_name: "ฝ่ายบริหารและบุคคลกลาง (HR & Admin)",
          category: "other",
          album_id: "",
          album_name: "",
          file_name: "ตารางสรุปวันหยุดตามประเพณี_2569.xlsx",
          mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          file_size: 890000,
          drive_file_id: "DRV_DOC_006",
          drive_url: "https://drive.google.com",
          thumbnail_url: "",
          sender_id: "U_HR_01",
          sender_name: "สมชาย บุคคล",
          line_message_id: "MSG_LINE_106",
          created_at: "2026-10-16T11:00:00Z"
        },
        {
          file_id: "FIL-DOC-007",
          group_id: "GRP-001",
          group_name: "ทีมพัฒนาแอปพลิเคชัน & ไอที",
          category: "other",
          album_id: "",
          album_name: "",
          file_name: "SSL_Certificates_Bundle_2026.zip",
          mime_type: "application/zip",
          file_size: 3200000,
          drive_file_id: "DRV_DOC_007",
          drive_url: "https://drive.google.com",
          thumbnail_url: "",
          sender_id: "U_IT_01",
          sender_name: "สมศักดิ์ ไอที",
          line_message_id: "MSG_LINE_107",
          created_at: "2026-10-15T13:10:00Z"
        }
      ],

      logs: [
        {
          log_id: "LOG-1005",
          timestamp: "2026-10-20T13:45:12Z",
          event_type: "message",
          group_id: "GRP-001",
          user_id: "U_IT_01",
          message_type: "image",
          details: "บันทึกภาพเดี่ยว IMG_20261020_Server_Rack.jpg สำเร็จ"
        },
        {
          log_id: "LOG-1004",
          timestamp: "2026-10-20T11:20:05Z",
          event_type: "message",
          group_id: "GRP-001",
          user_id: "U_IT_02",
          message_type: "image",
          details: "บันทึกภาพเดี่ยว IMG_20261020_UI_Wireframe.png สำเร็จ"
        },
        {
          log_id: "LOG-1003",
          timestamp: "2026-10-20T10:15:30Z",
          event_type: "message",
          group_id: "GRP-001",
          user_id: "U_IT_01",
          message_type: "file",
          details: "บันทึกเอกสาร System_Architecture_Overview_2026.pdf (4.66 MB) ลงโฟลเดอร์ 2.ไฟล์อื่นๆ"
        },
        {
          log_id: "LOG-1002",
          timestamp: "2026-10-18T10:40:02Z",
          event_type: "message",
          group_id: "GRP-002",
          user_id: "U_MKT_01",
          message_type: "image",
          details: "บันทึกเข้าอัลบั้ม: งานแถลงข่าวเปิดตัวสินค้า 2026"
        },
        {
          log_id: "LOG-1001",
          timestamp: "2026-10-18T10:00:15Z",
          event_type: "message",
          group_id: "GRP-002",
          user_id: "U_MKT_01",
          message_type: "text",
          details: "คำสั่งแชท: #อัลบั้ม งานแถลงข่าวเปิดตัวสินค้า 2026 -> เปิดโหมดอัลบั้มสำเร็จ"
        }
      ],

      users: [
        {
          user_id: "USR-001",
          username: "admin",
          password: "admin1234",
          fullname: "ผู้ดูแลระบบ LINE Keep Bot",
          role: "admin",
          status: "active",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
        },
        {
          user_id: "USR-002",
          username: "staff1",
          password: "staff1234",
          fullname: "สมศักดิ์ ไอที",
          role: "staff",
          status: "active",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
        },
        {
          user_id: "USR-003",
          username: "viewer1",
          password: "viewer1234",
          fullname: "วิภาวรรณ สื่อสาร",
          role: "viewer",
          status: "active",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
        }
      ]
    };
  },

  getData() {
    var stored = localStorage.getItem("line_keep_mock_data");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse mock data from localStorage", e);
      }
    }
    var initial = this.getInitialData();
    this.saveData(initial);
    return initial;
  },

  saveData(data) {
    localStorage.setItem("line_keep_mock_data", JSON.stringify(data));
  },

  resetData() {
    var initial = this.getInitialData();
    this.saveData(initial);
    return initial;
  }
};
