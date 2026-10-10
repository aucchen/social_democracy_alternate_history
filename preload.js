/**
 * The preload script runs before `index.html` is loaded
 * in the renderer. It has access to web APIs as well as
 * Electron's renderer process modules and some polyfilled
 * Node.js functions.
 *
 * https://www.electronjs.org/docs/latest/tutorial/sandbox
 */

const steamworks = require('steamworks.js');

// TODO: wrap in a try/except block?
try {
    const client = steamworks.init(3083910);
    window.client = client;
    console.log("client", client);
} catch (error) {
    const client = null;
    window.client = client;
    console.error(error);
    console.log('Steam not detected');
}

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
});

// TODO: add achievement thing here...
//   // TODO: on achievement, call steam api...
window.onAchieve = function(achievementName) {
  console.log(achievementName);
  if (client.achievement.activate(achievementName)) {
      console.log('steam achievement');
      client.stats.store();
  }
};

window.restart = function() {
  if (confirm("Do you wish to restart the game? Progress will not be saved.")) {
    window.location.reload();
    return false;
  }
};

window.exit = function() {
  if (confirm("Do you wish to exit the game? Progress will not be saved.")) {
    //const remote = require('electron').remote;
    //let w = remote.getCurrentWindow();
    //w.close();
    //window.uploadAutoSaves();
    window.close();
  }
};

window.onbeforeunload = function() {
    window.uploadAutoSaves();
};


window.cloudLoad = function(filename, timestampFilename) {
    if (client && client.cloud.isEnabledForAccount() && client.cloud.isEnabledForApp()) {
        if (client.cloud.fileExists(filename) && client.cloud.fileExists(timestampFilename)) {
            var data = client.cloud.readFile(filename);
            var timestamp = client.cloud.readFile(timestampFilename);
            return [data, timestamp];
        }
    } else {
        return null;
    }
};

window.onSave = function(save_prefix, slot, saveString, timestamp) {
    // This is called from dendrynexus when a save is done, and this does a cloud save.
    // cloud saves make the game feel a little laggy - instead, only upload autosaves when exiting.
    window.dendryUI.populateSaveSlots(slot + 1, 2);
    if (slot.includes('a')) {
        return;
    }
    var save_filename = save_prefix + '_' + slot;
    var date_filename = save_prefix + '_timestamp_' + slot;
    if (client && client.cloud.isEnabledForAccount() && client.cloud.isEnabledForApp()) {
        if (client.cloud.writeFile(save_filename, saveString) && client.cloud.writeFile(date_filename, timestamp)) {
            console.log('Cloud save successful');
        } else {
            console.log('Cloud save unsuccessful');
        }
    }
    window.dendryUI.populateSaveSlots(this.max_slots, 2);
};

/////////////////////////
// cloud save logic:
// on populating localStorage from cloud storage:
// - if a cloud file exists for a slot and a local slot doesn't: write the cloud slot to localStorage
// - if a local slot exists and a cloud one does as well: prompt the user.
// on saving:
// - if a local slot exists and a cloud slot doesn't: write the local slot to cloud storage.
// - write to cloud storage, overwriting cloud storage.
window.populateCloudSaves = function() {
  // -1 = localPriority is not set, 1 = prioritize local, 0 = prioritize cloud
  var localPriority = -1;
  var max_slots = 8;
  var max_auto_slots = 2;
  function getFilename(id) {
      return window.dendryUI.save_prefix + '_' + id;
  }
  function getTimestampFilename(id) {
      return window.dendryUI.save_prefix + '_timestamp_' + id;
  }
  function populateSlot(id) {
    var filename = getFilename(id);
    var timestampFilename = getTimestampFilename(id);
    var result = cloudLoad(filename, timestampFilename);
    if (result) {
        var data = result[0];
        var timestamp = result[1];
        if (localStorage[timestampFilename] && localStorage[timestampFilename] != timestamp) {
            if (localPriority == -1) {
                if (confirm("Warning: cloud saves are different from local saves - overwrite local saves with cloud saves?")) {
                    localPriority = 0;
                    localStorage[filename] = data;
                    localStorage[timestampFilename] = timestamp;
                } else {
                    localPriority = 1;
                }
            } else if (localPriority == 1) {
            } else {
                localStorage[filename] = data;
                localStorage[timestampFilename] = timestamp;
            }
        } else {
            localStorage[filename] = data;
            localStorage[timestampFilename] = timestamp;
        }
    }
  }
  if (client) {
      console.log("Populating cloud saves...");
      for (var i = 0; i < max_slots; i++) {
          populateSlot(i);
      }
      for (i = 0; i < max_auto_slots; i++) {
          populateSlot('a'+i);
      }
      window.dendryUI.populateSaveSlots(8, 2);
  } else {
      console.log("Can't populate cloud saves - Steam client is not available.");
  }
};

// upload autosaves to the cloud when exiting
window.uploadAutoSaves = function() {
  var max_slots = 8;
  var max_auto_slots = 2;
  function getFilename(id) {
      return window.dendryUI.save_prefix + '_' + id;
  }
  function getTimestampFilename(id) {
      return window.dendryUI.save_prefix + '_timestamp_' + id;
  }
  function uploadSlot(id) {
    var filename = getFilename(id);
    var timestampFilename = getTimestampFilename(id);
    var saveString = localStorage[filename];
    var timestamp = localStorage[timestampFilename];
    if (!saveString || !timestamp) {
        return;
    }
    if (client && client.cloud.isEnabledForAccount() && client.cloud.isEnabledForApp()) {
        if (client.cloud.writeFile(filename, saveString) && client.cloud.writeFile(timestampFilename, timestamp)) {
            console.log('Cloud save successful');
        } else {
            console.log('Cloud save unsuccessful');
        }
    }
  }
  if (client) {
      console.log("Uploading cloud saves...");
      for (i = 0; i < max_auto_slots; i++) {
          uploadSlot('a'+i);
      }
  } else {
      console.log("Can't upload cloud saves - Steam client is not available.");
  }
};
