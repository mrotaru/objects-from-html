const { getParents } = require('./html');

const leavesOnly = elements => {
  let leaves = [...elements];
  elements.forEach($element => {
    const parents = getParents($element);
    parents.forEach($parent => {
      if (elements.find($el => $el === $parent)) {
        leaves = leaves.filter($leaf => $leaf !== $parent);
      }
    });
  });
  return leaves;
};

const sameParent = elements => {
  const $firstParent = elements[0].parent;
  return elements.filter($element => $element.parent === $firstParent);
};

const sameLevel = (elements, levelNode) => {
  const parents = getParents(elements[0], levelNode);
  const distanceFromContext = parents.length;
  return elements.filter(
    $element => getParents($element, levelNode).length === distanceFromContext,
  );
};

module.exports = {
  leavesOnly,
  sameParent,
  sameLevel,
};
