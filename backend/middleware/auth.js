const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // 1. Get the token from the header
  const token = req.header('Authorization');
  console.log("Token received:", token ? "Yes" : "No");
  if (!token) return res.status(401).json({ message: "Access Denied" });

  try {
    // 2. Verify the token
    // Note: We use the string "SECRET_KEY" (same as in auth.js routes)
    const verified = jwt.verify(token, "SECRET_KEY");
    req.user = verified; // Save user info to request
    console.log("User Verified:", req.user);
    next(); // Allow request to proceed
  } catch (err) {
    console.log("Token Verification Failed:", err.message);
    res.status(400).json({ message: "Invalid Token" });
  }
};

module.exports = verifyToken;