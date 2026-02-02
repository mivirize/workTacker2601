const fs = require('fs');
const path = require('path');

const PREFS_PATH = path.resolve(__dirname, '../user_data/Default/Preferences');
const OUTPUT_DIR = path.resolve(__dirname, '../output');

function patchPreferences() {
    if (!fs.existsSync(PREFS_PATH)) {
        console.log("Preferences file not found at: " + PREFS_PATH);
        console.log("Skipping patch (maybe browser hasn't created it yet).");
        return;
    }

    try {
        const data = fs.readFileSync(PREFS_PATH, 'utf8');
        const prefs = JSON.parse(data);

        // Ensure download object exists
        if (!prefs.download) prefs.download = {};
        if (!prefs.savefile) prefs.savefile = {};

        // Apply settings to disable "Save As" dialog
        prefs.download.prompt_for_download = false;
        prefs.download.directory_upgrade = true;
        prefs.download.default_directory = OUTPUT_DIR;

        // Some versions use savefile
        prefs.savefile.default_directory = OUTPUT_DIR;
        prefs.savefile.type = 2; // ?

        // Write back
        fs.writeFileSync(PREFS_PATH, JSON.stringify(prefs, null, 2));
        console.log(`Successfully patched Chrome Preferences to disable download prompt.`);
        console.log(`Download Directory set to: ${OUTPUT_DIR}`);
    } catch (e) {
        console.error("Failed to patch preferences: " + e);
    }
}

patchPreferences();
