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

  async login(username, password) {
    if (!username || !password) {
      return { success: false, error: "กรุณาระบุ Username และ Password" };
    }

    try {
      var res = await ApiService.login(username.trim(), password);
      if (res && res.success && res.user) {
        localStorage.setItem(AppConfig.STORAGE_KEYS.AUTH_USER, JSON.stringify(res.user));
        return { success: true, user: res.user };
      } else {
        return { success: false, error: (res && res.error) ? res.error : "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
      }
    } catch (err) {
      console.error("Auth login error:", err);
      // Fallback สำหรับโหมดออฟไลน์
      if (username.trim() === "admin" && (password === "admin1234" || password === "admin")) {
        var fallbackUser = {
          userId: "USR-001",
          username: "admin",
          fullname: "ผู้ดูแลระบบ LINE Keep Bot",
          role: "admin",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
        };
        localStorage.setItem(AppConfig.STORAGE_KEYS.AUTH_USER, JSON.stringify(fallbackUser));
        return { success: true, user: fallbackUser };
      }
      return { success: false, error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ: " + err.message };
    }
  },

  isAdmin() {
    var user = this.getUser();
    return user !== null && user.role === "admin";
  },

  logout() {
    localStorage.removeItem(AppConfig.STORAGE_KEYS.AUTH_USER);
    window.location.reload();
  }
};
