console.log("Process type:", process.type); console.log("Electron from require:", typeof require("electron")); const e = require("electron"); console.log("Keys:", Object.keys(e || {}));
