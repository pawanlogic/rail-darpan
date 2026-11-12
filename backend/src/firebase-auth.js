import admin from "firebase-admin";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

let firebaseAuth = null;

function initializeFirebaseAuth() {
  if (firebaseAuth) return firebaseAuth;

  if (admin.apps.length) {
    firebaseAuth = admin.auth();
    return firebaseAuth;
  }

  let serviceAccount;

  const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const pathEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (jsonEnv) {
    serviceAccount = JSON.parse(jsonEnv);
  } else {
    const keyPath = pathEnv
      ? path.resolve(pathEnv)
      : path.join(
          os.homedir(),
          ".config",
          "rail-darpan",
          "service-account.json"
        );

    if (!fs.existsSync(keyPath)) {
      throw new Error("Firebase service account file not found.");
    }

    serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));
  }

  if (
    !serviceAccount.project_id ||
    !serviceAccount.client_email ||
    !serviceAccount.private_key
  ) {
    throw new Error("Firebase service account configuration is incomplete.");
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  firebaseAuth = admin.auth();

  console.log("Firebase Admin initialized:", serviceAccount.project_id);

  return firebaseAuth;
}

export async function requireFirebaseAuth(req, res, next) {
  const authorization = req.headers.authorization || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({
      error: "Login required. Please sign in to use railway features.",
      code: "AUTH_REQUIRED"
    });
  }

  try {
    const decodedToken = await initializeFirebaseAuth().verifyIdToken(
      match[1],
      true
    );

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      phoneNumber: decodedToken.phone_number || null,
      name: decodedToken.name || null
    };

    return next();
  } catch (error) {
    console.error("Firebase authentication failed:", error.stack || error.message);

    return res.status(401).json({
      error: "Your login is invalid or expired. Please sign in again.",
      code: "INVALID_TOKEN"
    });
  }
}
