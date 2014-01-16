///<reference path="../imports.d.ts"/>
var parser = require("../EventParser");
var help = require("../Helpers/TestHelper");

var testGroup = {
    setUp: function (callback) {
        callback();
    },
    tearDown: function (callback) {
        callback();
    },
    "Throws error on null for extractActivities": function (test) {
        var ar = new parser.EventParser();

        help.nullErrorTest(test, function () {
            ar.extractActivities(null);
        });

        test.done();
    }
};

exports.eventParserTests = testGroup;
//# sourceMappingURL=EventParser-test.js.map
