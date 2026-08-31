const apiKey = "AIzaSyD9YsaKNmLXDmDEAA4CcG_KXdGGfJVEOE";
const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;

async function testAuth() {
  console.log("Testing REST API Signup with Referer header...");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Referer": "http://localhost:3000/"
    },
    body: JSON.stringify({
      email: "admin123@gmail.com",
      password: "hoanganhadmin5632",
      returnSecureToken: true
    })
  });

  const data = await res.json();
  console.log("Response:", data);
}

testAuth();
