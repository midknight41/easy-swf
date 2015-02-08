import interfaces = require("../Interfaces");
import errors = require("../CustomErrors");
import parser = require("../EventParser");
import help = require("../Helpers/TestHelper");

var testGroup = {
  setUp: function (callback: nodeunit.ICallbackFunction): void {
    callback();
  },
  tearDown: function (callback: nodeunit.ICallbackFunction): void {
    callback();
  },
  "Throws error on null for extractActivities": function (test: nodeunit.Test): void {

    var ar = new parser.EventParser();
    
    help.nullErrorTest(test, function () {
      ar.extractActivities(null);
    });

    test.done();

  }

};

exports.eventParserTests = testGroup; 