const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

const firebaseAdmin = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FSA_PROJECT_ID,
    privateKey: process.env.FSA_PRIVATE_KEY,
    clientEmail: process.env.FSA_CLIENT_EMAIL
  })
});

module.exports = firebaseAdmin;