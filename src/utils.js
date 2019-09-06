module.exports = {
  toArray: maybeArray =>
    Array.isArray(maybeArray) ? maybeArray : [maybeArray],
  firstOrSelf: maybeArray =>
    Array.isArray(maybeArray) ? maybeArray[0] : maybeArray,
};
