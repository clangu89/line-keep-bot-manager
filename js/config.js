/**
 * ====================================================================
 * LINE Keep Bot & Google Drive Manager
 * ไฟล์: js/config.js - ตั้งค่าคอนฟิกและการเชื่อมต่อ API
 * ====================================================================
 */

const AppConfig = {
  // ค่าเริ่มต้น Web App URL (เชื่อมต่อกับ Google Apps Script Backend จริง)
  DEFAULT_GAS_URL: "https://script.google.com/macros/s/AKfycbxn_Yc3BVxzm6OC5Fs0FbnpEUxEylRS24WL2eYDEFTzYh9r07IxKWe52_8c-jSrSLXO/exec",

  STORAGE_KEYS: {
    GAS_URL: "line_keep_gas_url",
    USE_MOCK: "line_keep_use_mock",
    LINE_TOKEN: "line_keep_channel_token",
    LIFF_ID: "line_keep_liff_id",
    ROOT_FOLDER_ID: "line_keep_root_folder_id",
    AUTH_USER: "line_keep_auth_user",
    ACTIVE_GROUP: "line_keep_active_group"
  },

  getGasUrl() {
    return localStorage.getItem(this.STORAGE_KEYS.GAS_URL) || this.DEFAULT_GAS_URL;
  },

  setGasUrl(url) {
    if (url && url.trim()) {
      localStorage.setItem(this.STORAGE_KEYS.GAS_URL, url.trim());
    } else {
      localStorage.removeItem(this.STORAGE_KEYS.GAS_URL);
    }
  },

  isMockMode() {
    var forcedMock = localStorage.getItem(this.STORAGE_KEYS.USE_MOCK);
    if (forcedMock !== null) {
      return forcedMock === "true";
    }
    // ถ้ายังไม่มีการตั้งค่า GAS Web App URL ให้เข้า Demo/Mock Mode เพื่อให้ทดลองเล่นบน GitHub Pages ได้ทันที
    return !this.getGasUrl();
  },

  setMockMode(isMock) {
    localStorage.setItem(this.STORAGE_KEYS.USE_MOCK, isMock ? "true" : "false");
  },

  getLineToken() {
    return localStorage.getItem(this.STORAGE_KEYS.LINE_TOKEN) || "";
  },

  setLineToken(token) {
    if (token) {
      localStorage.setItem(this.STORAGE_KEYS.LINE_TOKEN, token.trim());
    } else {
      localStorage.removeItem(this.STORAGE_KEYS.LINE_TOKEN);
    }
  },

  getLiffId() {
    return localStorage.getItem(this.STORAGE_KEYS.LIFF_ID) || "";
  },

  setLiffId(id) {
    if (id) {
      localStorage.setItem(this.STORAGE_KEYS.LIFF_ID, id.trim());
    } else {
      localStorage.removeItem(this.STORAGE_KEYS.LIFF_ID);
    }
  },

  getRootFolderId() {
    return localStorage.getItem(this.STORAGE_KEYS.ROOT_FOLDER_ID) || "";
  },

  setRootFolderId(id) {
    if (id) {
      localStorage.setItem(this.STORAGE_KEYS.ROOT_FOLDER_ID, id.trim());
    } else {
      localStorage.removeItem(this.STORAGE_KEYS.ROOT_FOLDER_ID);
    }
  },

  getActiveGroupFilter() {
    return localStorage.getItem(this.STORAGE_KEYS.ACTIVE_GROUP) || "all";
  },

  setActiveGroupFilter(groupId) {
    localStorage.setItem(this.STORAGE_KEYS.ACTIVE_GROUP, groupId || "all");
  }
};
