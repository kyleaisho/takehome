const Immutable = require('immutable');
const assert = require('assert');


function getFlatten() {
  return require('./index');
}

function transformErrors(errors, ignoreKeys) {
  return Immutable.Map(
    getFlatten().flatten(errors, ignoreKeys)
  );
}

xit('non nested objects', () => {
  assert.deepEqual(transformErrors({
    error: 'This is an error',
    error2: 'This is an error2',
  }).toJS(), {
    error: 'This is an error',
    error2: 'This is an error2',
  })
});

xdescribe('Array concatenate', () => {
  it('empty array returns empty string', () => {
    // this is an assumption
    assert.equal(getFlatten().arrayErrorConcatenate(
      ['']),
      ''
    );
  })

  it('array of errors are concatenated', () => {
    assert.equal(getFlatten().arrayErrorConcatenate(
      ['first error', 'second error']),
      'first error. second error'
    );
  })
});

describe('flatten', () => {
  function getNestedObject() {
    return Immutable.fromJS({
      errorProp: 'Im not an array',
      errorInArray: ['Im in an array', 'me too'],
      nestedObject: {
        evenMoreNested: {
          invalidNames: ['Theres some invalid names in here', 'more than one it seems'],
          isError: 'yes, there is an error'
        }
      }
    });
  }

  it('returns an empty string for a null object', () => {
    assert.equal(
      getFlatten().flatten(null),
      ''
    );
  });

  it('returns a string when a string is passed', () => {
    assert.equal(
      getFlatten().flatten('an error'),
      'an error'
    );
  });

  it('returns a string for one error in an object', () => {
    assert.equal(
      getFlatten().flatten(Immutable.fromJS({ onlyOne: 'error' })),
      'error'
    )
  });

  it('contains nested errors', () => {
    assert.equal(
      getFlatten().flatten(Immutable.fromJS(
        {
          firstError: 'error',
          nestedError: {
            secondError: 'another one'
          }
        }
      )),
      'error. another one'
    )
  });

  xit('gets concatenated into one string', () => {
    assert.equal(
      getFlatten().flatten(getNestedObject()),
      `Im not an array.
        Im in an array.
        me too.
        Theres some invalid names in here.
        more than one it seems`
    );
  });
});

xit('should tranform errors', () => {
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