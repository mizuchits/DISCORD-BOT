const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "userData.json");


function loadData() {
  if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, "{}");
  return JSON.parse(fs.readFileSync(dataPath, "utf8"));
}


function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}


function getDefaultUser() {
  return {
    coins: 0,
    baitCounts: { premium: 0, golden: 0, legendary: 0 },
    baitEquipped: null,
    inventory: [],
    rod: "Basic Rod",
  };
}


function getUserData(userId) {
  const data = loadData();
  if (!data[userId]) {
    data[userId] = getDefaultUser();
    saveData(data);
  } else {
    
    const def = getDefaultUser();
    for (const key in def) {
      if (typeof def[key] === "object" && def[key] !== null && !Array.isArray(def[key])) {
        data[userId][key] = { ...def[key], ...data[userId][key] };
      } else if (Array.isArray(def[key])) {
        if (!Array.isArray(data[userId][key])) data[userId][key] = [];
      } else if (data[userId][key] === undefined) {
        data[userId][key] = def[key];
      }
    }
    saveData(data);
  }
  return data[userId];
}


function updateUserData(userId, userData) {
  const data = loadData();
  data[userId] = userData;
  saveData(data);
}

module.exports = {
  getUserData,
  updateUserData,
};