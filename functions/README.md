# 部署委員存簿封面代傳與密碼重設

在有權管理 `im-project-system-d33f8` 的 Google 帳號下完成以下步驟。請使用 Node.js 22 與 Firebase CLI。

1. 在 Google Cloud 為此函式建立專用服務帳戶。授予該帳戶 `roles/firebaseauth.admin` 與 `roles/datastore.viewer`。部署者需要部署 Cloud Functions 的權限及此服務帳戶的 `roles/iam.serviceAccountUser`。
2. 在 Firebase Authentication 的 Users 頁面查詢可使用此功能的管理員 UID。這些帳號的 Firestore `users/{uid}` 文件必須已有 `role: "admin"`。
3. 從 GitHub 取出此分支。部署前，在 Firebase Storage 的 Rules 頁面比對現有規則與根目錄的 `storage.rules`。如果正式站另有更新，先保留那些規則，再加入檔案中的 `match /committee/{uid}/{fileName}`。Firestore 的 `committeeDocs/{uid}` 須允許管理員新增及更新文件，沿用委員本人的既有權限。
4. 在專案根目錄登入並部署 Storage 規則和密碼重設函式。

   ```sh
   firebase login
   npm --prefix functions ci
   firebase deploy --project im-project-system-d33f8 --only storage,functions:resetCommitteePassword
   ```

   遇到參數提示時，在 `COMMITTEE_PASSWORD_ADMIN_UIDS` 填入允許的管理員 UID，使用逗號分隔。在 `COMMITTEE_PASSWORD_SERVICE_ACCOUNT` 填入專用服務帳戶的電子郵件地址。Firebase CLI 會儲存這些設定到本機，Git 會略過設定檔。

5. Storage 規則發布後，在管理後台測試代傳封面。函式啟用後，將此分支合入 `main`，讓 GitHub Pages 帶入「設定新密碼」按鈕，再用測試委員帳號確認新密碼可登入。
