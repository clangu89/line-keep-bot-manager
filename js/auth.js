/**
 * ====================================================================
 * LINE Keep Bot & Google Drive Manager
 * ไฟล์: js/auth.js - การจัดการ Session ผู้ใช้งาน และสิทธิ์ Admin
 * ====================================================================
 */

const AuthService = {
  getUser() {
    var userJson = localStorage.getItem(AppConfig.STORAGE_KEYS.AUTH_USER);
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch (e) {
      return null;
    }
  },

  isLoggedIn() {
    return this.getUser() !== null;
  },

  login(username, password) {
    // รหัสผ่านเริ่มต้นสำหรับระบบจำลองและการเข้าสู่ระบบแบบออฟไลน์
    if (username === "admin" && (password === "admin1234" || password === "admin")) {
      var user = {
        userId: "USR-001",
        username: "admin",
        fullname: "ผู้ดูแลระบบ LINE Keep Bot",
        role: "admin",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
      };
      localStorage.setItem(AppConfig.STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
      return { success: true, user: user };
    }
    return { success: false, error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (ค่าเริ่มต้น: admin / admin1234)" };
  },

  logout() {
    localStorage.removeItem(AppConfig.STORAGE_KEYS.AUTH_USER);
    window.location.reload();
  }
};
