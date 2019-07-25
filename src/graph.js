const leavesOnly = ($, elements) => {
  let leafs = [...elements];
  elements.forEach($match => {
    const parents = $($match)
      .parents()
      .toArray();
    parents.forEach($parent => {
      if (elements.find($el => $el === $parent)) {
        leafs = leafs.filter($leaf => $leaf !== $parent);
      }
    });
  });
  return leafs;
};

const sameParent = ($, elements) => {
  const $parent = $(elements[0]).parent();
  return elements.filter($element => $($element.parent).is($($parent)));
};

const sameLevel = ($, ctx, elements) => {
  const distanceFromContext = $(elements[0]).parentsUntil(ctx).length;
  return elements.filter(
    $element => $($element).parentsUntil(ctx).length === distanceFromContext,
  );
};

module.exports = {
  leavesOnly,
  sameParent,
  sameLevel,
};
