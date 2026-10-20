# 📁 LINE Keep Bot & Google Drive Manager

> **เว็บแอปพลิเคชันและระบบบอทอัตโนมัติสำหรับเชื่อมต่อบันทึกไฟล์และรูปภาพจากกลุ่ม LINE ลงสู่ Google Drive**
> พัฒนาด้วย Google Apps Script (Backend REST API & Webhook), Google Sheets (Database), LINE Messaging API และ Frontend ทันสมัยที่ Deploy บน **GitHub Pages**

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-059669?style=flat&logo=github)](https://clangu89.github.io/line-keep-bot-manager/)
[![LINE Messaging API](https://img.shields.io/badge/LINE-Messaging%20API-06C755?style=flat&logo=line)](https://developers.line.biz/)
[![Google Apps Script](https://img.shields.io/badge/Google-Apps%20Script-4285F4?style=flat&logo=google)](https://script.google.com)

---

## 🌟 ฟีเจอร์หลักของระบบ (Key Features)

### 1. แยกประเภทไฟล์ลงโฟลเดอร์ Google Drive ชัดเจน
- **📁 1.รูปภาพ (Images)**: รวบรวมภาพถ่ายทุกภาพที่ส่งเข้ากลุ่ม LINE ไม่ว่าจะเป็นภาพเดี่ยว หรือชุดรูปภาพ
- **📁 2.ไฟล์อื่นๆ (Other Files)**: รวบรวมเอกสารงาน (PDF, Word, Excel, PowerPoint, ZIP) รวมถึงวิดีโอ (MP4) และไฟล์เสียง โดยคงชื่อไฟล์เดิมที่ส่งในแชท

### 2. บันทึกรูปภาพแบบภาพเดี่ยว และอัลบั้ม (3 รูปแบบครบวงจร)
- **โหมดคำสั่งแชท (#อัลบั้ม <ชื่ออัลบั้ม>)**: สมาชิกในกลุ่มพิมพ์คำสั่ง เช่น `#อัลบั้ม งานสัมมนา 2026` บอทจะสร้างโฟลเดอร์ตามชื่ออัลบั้มใน Google Drive และรูปภาพที่ส่งหลังจากนั้นจะถูกดึงเข้าโฟลเดอร์นี้ทั้งหมด (พิมพ์ `#จบอัลบั้ม` เมื่อเสร็จสิ้น)
- **โหมดกำหนด Active Album บนหน้าเว็บ**: แอดมินสามารถสร้างอัลบั้มล่วงหน้า และกดเปิดใช้งานเป็น Active Album ของกลุ่มนั้นได้ทันที หรือย้ายภาพเดี่ยวเข้าอัลบั้มย้อนหลังได้
- **โหมดตรวจจับชุดรูปภาพอัตโนมัติ (imageSet Auto-Album)**: เมื่อส่งรูปหลายรูปพร้อมกัน บอทจะใช้ `LockService` ป้องกัน Race Condition และสร้างโฟลเดอร์อัลบั้มรวมรูปชุดเดียวกันอัตโนมัติ

### 3. รองรับการใช้งานหลายกลุ่ม LINE พร้อมกัน (Multi-Group)
- บอทจะแยกโฟลเดอร์ระดับบนตามชื่อของแต่ละกลุ่ม LINE โดยอัตโนมัติ
- ตั้งค่าการทำงานรายกลุ่มได้: เปิด/ปิดการบันทึกอัตโนมัติ (Auto-Save), ปรับโหมดการตอบกลับของบอท (`โหมดเงียบ`, `โหมดสรุป`, `โหมดแจ้งทุกครั้ง`)

### 4. เว็บแดชบอร์ด Frontend ทันสมัย (GitHub Pages)
- หน้าจัดการรูปภาพและไฟล์ ดูรูปตัวอย่างขนาดใหญ่ (Lightbox Preview)
- ค้นหาและกรองไฟล์ตามกลุ่ม LINE, หมวดหมู่ และอัลบั้ม
- แดชบอร์ดสรุปสถิติจำนวนไฟล์และขนาดพื้นที่จัดเก็บบน Google Drive
- ห้องแชทจำลอง (Chat Simulator) สำหรับทดสอบส่งไฟล์และดูการตอบกลับของบอทได้ทันทีก่อนใช้งานจริง

---

## 📂 โครงสร้างโฟลเดอร์ใน Google Drive

```text
📁 LINE_Keep_Bot_Storage (Root Folder)
 ├── 📁 [ชื่อกลุ่ม LINE ที่ 1]
 │    ├── 📁 1.รูปภาพ
 │    │    ├── 🖼️ IMG_20261020_001.jpg (ภาพเดี่ยว)
 │    │    ├── 📁 งานแถลงข่าวเปิดตัวสินค้า 2026 (โฟลเดอร์อัลบั้ม)
 │    │    │    ├── 🖼️ IMG_Press_01.jpg
 │    │    │    └── 🖼️ IMG_Press_02.jpg
 │    │    └── 📁 ชุดรูปภาพ_20261020_1430 (อัลบั้มอัตโนมัติ)
 │    └── 📁 2.ไฟล์อื่นๆ
 │         ├── 📑 รายงานสรุปผลโครงการ.pdf
 │         ├── 📊 งบประมาณประจำปี.xlsx
 │         └── 🎬 วิดีโอนำเสนอผลงาน.mp4
 └── 📁 [ชื่อกลุ่ม LINE ที่ 2]
      ├── 📁 1.รูปภาพ
      └── 📁 2.ไฟล์อื่นๆ
```

---

## 🛠️ คู่มือการติดตั้งและใช้งาน (Setup & Deployment Guide)

### ขั้นตอนที่ 1: ติดตั้ง Google Apps Script (Backend)
1. เปิด [Google Sheets](https://sheets.new) เปล่าขึ้นมา 1 ไฟล์ ตั้งชื่อเช่น `LINE Keep Bot Database`
2. ไปที่เมนู **ส่วนขยาย (Extensions)** > **Apps Script**
3. ลบโค้ดเดิมใน `Code.gs` และสร้างไฟล์ตามโฟลเดอร์ `backend/` ในโปรเจกต์นี้:
   - `appsscript.json`: เปิดการตั้งค่า Project Settings > ติ๊กเลือก "Show appsscript.json" แล้วนำโค้ดไปวาง
   - `Setup.gs`: สคริปต์สร้างตารางฐานข้อมูลและโฟลเดอร์ Drive
   - `LineBot.gs`: สคริปต์ประมวลผล Webhook และดาวน์โหลดไฟล์จาก LINE
   - `Code.gs`: Web App API และระบบจัดการไฟล์
4. เลือกฟังก์ชัน **`setupDatabase`** ที่เมนูด้านบน แล้วกดปุ่ม **Run (เรียกใช้)**
   - ให้สิทธิ์การเข้าถึง (Authorization) กับบัญชี Google ของท่าน
   - ระบบจะสร้างตาราง 6 ตารางใน Google Sheets และสร้างโฟลเดอร์ `LINE_Keep_Bot_Storage` บน Google Drive ให้ทันที
5. กดปุ่ม **Deploy (การทำให้ใช้งานได้)** > **New deployment (การทำให้ใช้งานได้ใหม่)**
   - เลือกประเภท: **Web app (เว็บแอป)**
   - Description: `LINE Keep Bot Production`
   - Execute as: **Me (ฉัน)**
   - Who has access: **Anyone (ทุกคน)**
   - กด **Deploy** แล้วคัดลอก **Web app URL** ที่ได้ (ลงท้ายด้วย `/exec`)

---

### ขั้นตอนที่ 2: ตั้งค่า LINE Developers (Messaging API)
1. เข้าไปที่ [LINE Developers Console](https://developers.line.biz/)
2. สร้างหรือเลือก Provider และสร้าง Channel ประเภท **Messaging API**
3. ไปที่แท็บ **Messaging API**:
   - ในช่อง **Webhook URL**: นำ Web app URL จากขั้นตอนที่ 1 ไปวาง แล้วกด **Update** และกดปุ่ม **Verify**
   - เปิดสวิตช์ **Use webhook** ให้เป็นสีเขียว
   - หัวข้อ **Auto-reply messages**: กดแก้ไขเพื่อปิด "Auto-reply" ของ LINE Official Account เพื่อไม่ให้ข้อความอัตโนมัติซ้ำกับบอท
   - เลื่อนลงมาล่างสุด กด **Issue** ในหัวข้อ **Channel access token (long-lived)** และคัดลอก Token ไว้
4. เพิ่มเพื่อนบอทด้วย QR Code หรือ Basic ID แล้วเชิญบอทเข้ากลุ่ม LINE ที่ต้องการบันทึกไฟล์

---

### ขั้นตอนที่ 3: ผูกการเชื่อมต่อบนหน้าเว็บ Frontend
1. เปิดหน้าเว็บที่ Deploy บน GitHub Pages:
   👉 **`https://clangu89.github.io/line-keep-bot-manager/`**
2. ไปที่แท็บ **"ตั้งค่าการเชื่อมต่อ" (Settings)**
3. วาง **Web App URL** และ **LINE Channel Access Token** แล้วกดบันทึก
4. กดปุ่ม **"ทดสอบการเชื่อมต่อ"** เพื่อตรวจสอบความถูกต้อง

---

## 💬 รายการคำสั่งแชทสำหรับสมาชิกในกลุ่ม LINE

| คำสั่งแชท | ตัวอย่างการใช้งาน | การทำงานของบอท |
| :--- | :--- | :--- |
| `#อัลบั้ม [ชื่อ]` | `#อัลบั้ม งานสัมมนาพัทยา 2026` | สร้างโฟลเดอร์อัลบั้มใน Google Drive และเปลี่ยนโหมดกลุ่มให้รูปภาพหลังจากนั้นเข้าอัลบั้มนี้ทันที |
| `#จบอัลบั้ม` | `#จบอัลบั้ม` หรือ `#ภาพเดี่ยว` | ปิดโหมดอัลบั้ม และกลับสู่การบันทึกภาพเดี่ยวทั่วไป |
| `#สถานะ` | `#สถานะ` หรือ `#drive` | สรุปจำนวนรูปและไฟล์ที่บันทึกแล้ว พร้อมแสดงลิงก์เปิดโฟลเดอร์ Google Drive |
| `#ช่วยเหลือ` | `#ช่วยเหลือ` หรือ `/help` | แสดงคู่มือคำสั่งทั้งหมดของบอท |

---

## 💻 เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend**: HTML5, Tailwind CSS, Lucide Icons, Chart.js, Vanilla JavaScript (ES6+)
- **Backend**: Google Apps Script (V8 Engine, DriveApp, UrlFetchApp, LockService, CacheService)
- **Database**: Google Sheets API (Multi-Sheet Relational Schema)
- **Storage**: Google Drive Storage API
- **Bot Platform**: LINE Messaging API (Webhook & Content Delivery API)
- **Hosting**: GitHub Pages (`clangu89`)
