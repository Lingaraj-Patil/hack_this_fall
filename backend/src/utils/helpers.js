const crypto = require('crypto');

class Helpers {
  static generateInviteCode(length = 8) {
    return crypto.randomBytes(length).toString('hex').toUpperCase();
  }

  static calculateHeartRegen(lastRegenTime, maxHearts, currentHearts) {
    if (currentHearts >= maxHearts) return currentHearts;

    const now = Date.now();
    const hoursElapsed = (now - lastRegenTime) / (1000 * 60 * 60);
    const regenHours = parseInt(process.env.HEARTS_REGEN_HOURS) || 3;
    const heartsToAdd = Math.floor(hoursElapsed / regenHours);

    return Math.min(currentHearts + heartsToAdd, maxHearts);
  }

  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static sanitizeUsername(username) {
    return username.toLowerCase().replace(/[^a-z0-9_]/g, '');
  }

  static getWeekNumber(date = new Date()) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }
}

module.exports = Helpers;