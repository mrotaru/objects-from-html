const sanitizeString = str => str.trim().replace(/\s+/gm, ' ');

module.exports = {
  sanitizeString,
};
