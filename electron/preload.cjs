const { contextBridge } = require('electron')
const os = require('os')

contextBridge.exposeInMainWorld('electronAPI', {
  username: os.userInfo().username,
})
