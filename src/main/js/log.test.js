var assert = require('assert');
var log = require('./log');

describe('toMessage Test', function() {
    
    var should_return_function_return_value = 'should return function return value';
    it(should_return_function_return_value, function() {
        const expected = "ExpectedResult";
        const found = log.toMessage(function() { return expected; });
        assert.strictEqual(expected, found, should_return_function_return_value + ", but FAILED");
    });
});