const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "userData.json");

// Load user data from the JSON file
function loadUserData() {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

// Save user data to the JSON file
function saveUserData(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Get user data by ID
function getUserData(userId) {
  const data = loadUserData();
  if (!data[userId]) {
    data[userId] = { inventory: [], coins: 100, rod: "Basic Rod", bait: "None" };
    saveUserData(data);
  }
  return data[userId];
}

// Update user data by ID
function updateUserData(userId, updatedData) {
  const data = loadUserData();
  data[userId] = updatedData;
  saveUserData(data);
}

module.exports = { getUserData, updateUserData };