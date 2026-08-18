// =========================================================
//  Firebase 專案設定（首頁與管理員後台共用，只需在這裡填一次）
//  取得方式：Firebase 主控台 → 專案設定(齒輪) → 一般 →
//            你的應用程式 → SDK 設定與配置 → 選「Config」。
//  這些值可以公開放在 GitHub，不是機密；真正的權限由資料庫安全規則控管。
// =========================================================
const firebaseConfig = {
  apiKey:            "AIzaSyBaJAEyTtUvo1OKVZGb3DIA0JZCzKwXOMA",
  authDomain:        "im-project-system-d33f8.firebaseapp.com",
  projectId:         "im-project-system-d33f8",
  storageBucket:     "im-project-system-d33f8.firebasestorage.app",
  messagingSenderId: "236210145511",
  appId:             "1:236210145511:web:e848c14473876adeb33a42",
  measurementId:     "G-DKD0BWCESG"
};

if (typeof firebase !== "undefined") {
  firebase.initializeApp(firebaseConfig);
}
