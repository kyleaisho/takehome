
// Move require into a function to avoid using
// variables
function getImmutable() {
  return require('immutable');
}

// Joins the list with '. ' separator and a '.' at the end
function join(list) {
  return list.join('. ') + '.';
}

// Changes Map of maps and lists of errors into an OrderedSet to remove duplication
// still may be a nested set but this can be remedied with Immutable::Set::flatten
function flatten(error, acc = getImmutable().OrderedSet()) {
  if (!error || error.size === 0) return acc;
  if (getImmutable().List.isList(error)) return acc.union(error);

  return flatten(error.first(), acc).union(flatten(error.rest(), acc));
}

// Returns true if object is a list and all
// elements are strings
function isListOfStrings(list) {
  return getImmutable().List.isList(list) &&
    list.every(prop => typeof prop === 'string');
}

// Maintains nestting for maps, but moves errors
// out of the arrays and concatenates them
function preserveNesting(obj) {
  if (isListOfStrings(obj)) {
    return join(obj);
  }

  return obj.map((val) => preserveNesting(val));
}

// Main function to invoke when flattening an error map
function flattenErrorProps(error, ignoreKeys = getImmutable().Map()) {
  if (!error) return getImmutable().Map();

  return error.map((val, key) => ignoreKeys.has(key) ?
    preserveNesting(val) :
    join(flatten(val).flatten().toList())
  );
}

// Unsure if there is a pure way to modularize node in v8
// If ES6 modules were available I would use ES6 modules with export
// and import statements
// eslint-disable-next-line fp/no-mutation
module.exports = {
  flatten,
  flattenErrorProps,
  preserveNesting,
  join,
}