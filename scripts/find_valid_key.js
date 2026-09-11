const baseKey = "AIzaSyD9YsaKNmLXDmDEAA4CcG_KXdGGfJVEOE";

// Potential character replacements for OCR font ambiguities
const replacements = [
  baseKey,
  baseKey.replace("JVEOE", "JVE0E"),
  baseKey.replace("KNmLX", "KNmIX"),
  baseKey.replace("KNmLX", "KNm1X"),
  baseKey.replace("KNmLX", "KNmlX"),
  baseKey.replace("KNmLX", "KNmUX"),
  baseKey.replace("DEAA4", "DEAA4"),
  baseKey.replace("O", "0"),
  "AIzaSyD9YsaKNmLXDmDEAA4CcG_KXdGGfJVE0E",
  "AIzaSyD9YsaKNmIXDmDEAA4CcG_KXdGGfJVEOE",
  "AIzaSyD9YsaKNmIXDmDEAA4CcG_KXdGGfJVE0E",
  "AIzaSyD9YsaKNm1XDmDEAA4CcG_KXdGGfJVEOE",
  "AIzaSyD9YsaKNm1XDmDEAA4CcG_KXdGGfJVE0E"
];

async function checkKey(key) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${key}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test_key_check@gmail.com", password: "password123", returnSecureToken: true })
    });
    const data = await res.json();
    if (data.error && data.error.message.includes("API key not valid")) {
      return false;
    }
    console.log(`FOUND VALID KEY! -> [${key}]`, data);
    return true;
  } catch (err) {
    return false;
  }
}

async function findKey() {
  console.log("Checking key variations...");
  for (const k of replacements) {
    const valid = await checkKey(k);
    if (valid) return;
  }
  console.log("No exact key match found yet.");
}

findKey();
