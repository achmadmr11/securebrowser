const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const DEFAULTS = {
  examUrl: 'https://cbtportal.smapluspgri.sch.id/',
  appTitle: 'Secure Exam Browser',
  adminPassword: 'admin123',
  exitPassword: 'keluar123'
};

class Store {
  constructor() {
    try {
      const userDataPath = app.getPath('userData');
      this.filePath = path.join(userDataPath, 'examedu_config.json');
      this.data = this.loadData();
    } catch (err) {
      this.data = { ...DEFAULTS };
    }
  }

  loadData() {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf-8');
        return Object.assign({}, DEFAULTS, JSON.parse(fileContent));
      }
    } catch (e) {
      console.error('Failed to load store data:', e);
    }
    return { ...DEFAULTS };
  }

  get(key) {
    return this.data[key] !== undefined ? this.data[key] : DEFAULTS[key];
  }

  getAll() {
    return { ...this.data };
  }

  set(key, value) {
    this.data[key] = value;
    this.saveData();
  }

  setMultiple(obj) {
    this.data = Object.assign(this.data, obj);
    this.saveData();
  }

  saveData() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save store data:', e);
    }
  }
}

module.exports = Store;
