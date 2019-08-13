const markers = (inputItems, isStart, isEnd = () => false, config = {}) => {
  const insideItems = [];
  const outsideItems = [];
  let currentOutsideGroup = [];
  let currentInsideGroup = [];
  let inside = false;
  inputItems.forEach((item, i) => {
    if (inside) {
      if (isStart(item) || isEnd(item)) {
        inside = false
        if (isStart(item)) {
          currentInsideGroup.length && insideItems.push(currentInsideGroup);
          currentInsideGroup = config.includeStartItems ? [item] : [];
          inside = true
        } else { // item not start
          if (isEnd(item) && config.includeEndItems) {
            currentInsideGroup.push(item);
          }
          currentInsideGroup.length && insideItems.push(currentInsideGroup);
          currentInsideGroup = [];
        }
      } else { // item not start, not end
        currentInsideGroup.push(item);
      }
      if (i === inputItems.length - 1) {
        currentInsideGroup.length && insideItems.push(currentInsideGroup)
      }
    } else { // outside
      if (isStart(item)) {
        inside = true;
        currentOutsideGroup.length && outsideItems.push(currentOutsideGroup);
        if (config.includeStartItems) {
          currentInsideGroup.push(item);
        }
        currentOutsideGroup = [];
      } else {
        !isEnd(item) && currentOutsideGroup.push(item);
      }
    }
    if (i === inputItems.length - 1) {
      currentOutsideGroup.length && outsideItems.push(currentOutsideGroup);
    }
  });
  return { items: insideItems, outsideItems };
}

module.exports = markers
