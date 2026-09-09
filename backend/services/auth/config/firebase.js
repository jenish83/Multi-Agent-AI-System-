import { cert, initializeApp } from "firebase-admin";

import serviceAccountKey from "../ServiceAccountKey.json" with { type: "json" };

const app = initializeApp({
  credential: cert(serviceAccountKey)
});

export default app;