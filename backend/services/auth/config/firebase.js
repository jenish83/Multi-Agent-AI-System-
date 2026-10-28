import { cert, initializeApp } from "firebase-admin";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const keyPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "ServiceAccountKey.json",
);

const loadServiceAccount = () => {
    if (fs.existsSync(keyPath)) {
        return JSON.parse(fs.readFileSync(keyPath, "utf8"));
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (projectId && clientEmail && privateKey) {
        return { projectId, clientEmail, privateKey };
    }

    throw new Error(
        "Firebase admin credentials are missing. The auth service needs ServiceAccountKey.json or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.",
    );
};

const app = initializeApp({
    credential: cert(loadServiceAccount()),
});

export default app;
