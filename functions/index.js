"use strict";

const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const { defineString } = require("firebase-functions/params");
const { HttpsError, onCall } = require("firebase-functions/v2/https");

initializeApp();

const administratorUids = defineString("COMMITTEE_PASSWORD_ADMIN_UIDS", {
  description: "Firebase Authentication UIDs allowed to reset committee passwords, separated by commas."
});
const serviceAccount = defineString("COMMITTEE_PASSWORD_SERVICE_ACCOUNT", {
  description: "Runtime service account with Firebase Authentication Admin and Cloud Datastore Viewer access."
});

exports.resetCommitteePassword = onCall({
  region: "us-central1",
  maxInstances: 2,
  serviceAccount
}, async request => {
  const callerUid = request.auth?.uid;
  if (!callerUid) throw new HttpsError("unauthenticated", "請先登入管理員帳號。");

  const permittedUids = administratorUids.value().split(",").map(uid => uid.trim());
  if (!permittedUids.includes(callerUid)) {
    throw new HttpsError("permission-denied", "此帳號未取得校外委員密碼重設權限。");
  }

  const { uid, password } = request.data || {};
  if (typeof uid !== "string" || !uid || uid.length > 128 || /[/\u0000]/.test(uid) || uid === "." || uid === "..") {
    throw new HttpsError("invalid-argument", "委員帳號識別碼無效。");
  }
  if (typeof password !== "string" || password.length < 6 || password.length > 128 || !password.trim()) {
    throw new HttpsError("invalid-argument", "新密碼須為 6 至 128 碼，且不可全部為空白。");
  }
  if (permittedUids.includes(uid)) {
    throw new HttpsError("permission-denied", "只能重設校外委員密碼。");
  }

  const db = getFirestore();
  const [caller, target] = await db.getAll(db.collection("users").doc(callerUid), db.collection("users").doc(uid));
  if (caller.data()?.role !== "admin" || target.data()?.role !== "committee") {
    throw new HttpsError("permission-denied", "只能由管理員重設校外委員密碼。");
  }

  try {
    // Updating the Authentication password leaves the UID, profile, and scores intact.
    await getAuth().updateUser(uid, { password });
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      throw new HttpsError("not-found", "Firebase Authentication 找不到此委員的登入帳號。");
    }
    if (error.code === "auth/invalid-password" || error.code === "auth/password-does-not-meet-requirements") {
      throw new HttpsError("invalid-argument", "新密碼不符合 Firebase 密碼規則。");
    }
    // The Admin SDK error may include request context. Never log or return it.
    throw new HttpsError("internal", "Firebase 無法重設密碼，請確認函式服務帳戶權限。");
  }

  return { updated: true };
});
