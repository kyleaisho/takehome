/* eslint-disable fp/no-nil */
/* eslint-disable fp/no-unused-expression */
const Immutable = require('immutable');
const assert = require('assert');


function getFlatten() {
  return require('./index');
}

function transformErrors(errors, ignoreKeys) {
  return Immutable.Map(
    getFlatten().flattenErrorProps(errors, ignoreKeys)
  );
}

describe('flatten', () => {
  function getNestedObject() {
    return Immutable.fromJS({
      errorProp: ['Im not an array'],
      errorInArray: ['Im in an array', 'me too'],
      nestedObject: {
        evenMoreNested: {
          invalidNames: ['Theres some invalid names in here', 'more than one it seems'],
          isError: ['yes, there is an error']
        }
      }
    });
  }

  function getResponse() {
    return [
      'Im not an array.',
      'Im in an array.',
      'me too.',
      'Theres some invalid names in here.',
      'more than one it seems.',
      'yes, there is an error.'
    ].join(' ');
  }

  it('returns an empty set for a null object', () => {
    assert.equal(
      getFlatten().flatten(null),
      Immutable.OrderedSet()
    );
  });

  it('returns a string for one error in an object', () => {
    assert.equal(
      getFlatten().flatten(Immutable.fromJS({ onlyOne: ['error'] })).toList().join(' '),
      'error'
    )
  });

  it('contains nested errors', () => {
    assert.equal(
      getFlatten().flatten(Immutable.fromJS(
        {
          firstError: ['error'],
          nestedError: {
            secondError: ['another one']
          }
        }
      )).toList().join('. ') + '.',
      'error. another one.'
    )
  });

  it('gets concatenated into one string', () => {
    assert.equal(
      getFlatten().flatten(getNestedObject()).toList().join('. ') + '.',
      getResponse()
    );
  });

  it('removes duplicates from same level', () => {
    assert.equal(
      getFlatten().flatten(Immutable.fromJS({
        firstError: ['Not unique'],
        secondError: ['Not unique'],
      })).toList().join('. ') + '.',
      'Not unique.'
    );
  });

  it('removes duplicates from deeper levels', () => {
    assert.equal(
      getFlatten().flatten(Immutable.fromJS({
        firstError: ['Not unique'],
        secondError: {
          error: ['Not unique'],
        },
      })).toList().join('. ') + '.',
      'Not unique.'
    );
  });

  it('removes duplicates from array of objects', () => {
    assert.equal(
      getFlatten().flatten(Immutable.fromJS({
        tags: [
          {
            non_field_errors: ['Only alphanumeric characters are allowed'],
            third_error: ['Third error']
          },
          {
            non_field_errors: [
              'Minumum length of 10 characters is required',
              'Only alphanumeric characters are allowed',
            ],
          }]
        })).flatten().toList().join('. ') + '.',
      'Only alphanumeric characters are allowed. Third error. Minumum length of 10 characters is required.'
    );
  });
});

describe('join', () => {
  it('single item', () => {
    assert.equal(
      getFlatten().join(Immutable.List(['Single']), ' ', '.'),
      'Single.'
    );
  });

  it('multiple items', () => {
    assert.equal(
      getFlatten().join(Immutable.List(['first', 'second']), ' ', '.'),
      'first. second.'
    );
  });
});

describe('preserveNesting', () => {
  it('single list error is returned with period', () => {
    assert.equal(
      getFlatten().preserveNesting(Immutable.List(['Single error'])),
      'Single error.'
    );
  });
});

it('should tranform errors', () => {
  // example error object returned from API converted to Immutable.Map
  const errors = Immutable.fromJS({
    name: ['This field is required'],
    age: ['This field is required', 'Only numeric characters are allowed'],
    urls: [{}, {}, {
      site: {
        code: ['This site code is invalid'],
        id: ['Unsupported id'],
      }
    }],
    url: {
      site: {
        code: ['This site code is invalid'],
        id: ['Unsupported id'],
      }
    },
    tags: [{}, {
      non_field_errors: ['Only alphanumeric characters are allowed'],
      another_error: ['Only alphanumeric characters are allowed'],
      third_error: ['Third error']
    }, {}, {
      non_field_errors: [
        'Minumum length of 10 characters is required',
        'Only alphanumeric characters are allowed',
      ],
    }],
    tag: {
      nested: {
        non_field_errors: ['Only alphanumeric characters are allowed'],
      },
    },
  });

  // in this specific case,
  // errors for `url` and `urls` keys should be nested
  // see expected object below
  const result = transformErrors(errors, Immutable.Map({ url: true, urls: true }));

  assert.deepEqual(result.toJS(), {
    name: 'This field is required.',
    age: 'This field is required. Only numeric characters are allowed.',
    urls: [{}, {}, {
      site: {
        code: 'This site code is invalid.',
        id: 'Unsupported id.',
      },
    }],
    url: {
      site: {
        code: 'This site code is invalid.',
        id: 'Unsupported id.',
      },
    },
    tags: 'Only alphanumeric characters are allowed. Third error. ' +
      'Minumum length of 10 characters is required.',
    tag: 'Only alphanumeric characters are allowed.',
  });
});