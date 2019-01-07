
// Move require into a function to avoid using
// variables
function getImmutable() {
  return require('immutable');
}

function flatten(error, acc = getImmutable().List()) {
  if (!error) return acc.join('. ');
  if (typeof error === 'string') return flatten('', acc.set(-1, error))

  return getImmutable().Map.isMap(error) ?
          flatten('', getImmutable().List([
            ...acc,
            ...error.map(v => flatten(v, acc)).values()
          ])) :
          flatten('');
}

// Unsure if there is a pure way to modularize node in v8
// If ES6 modules were available I would use ES6 modules with export
// and import statements
// eslint-disable-next-line fp/no-mutation
module.exports = {
  flatten,
}