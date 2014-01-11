///<reference path="../imports.d.ts"/>

import interfaces = require("../Interfaces");
import errors = require("../CustomErrors");
import acts = require("../Activity");
//import wrapper = require("../FunctionWrapper");

var gently = new (require("gently"));


var testGroup = {
  setUp: function (callback: nodeunit.ICallbackFunction): void {
    callback();
  },
  tearDown: function (callback: nodeunit.ICallbackFunction): void {
    callback();
  },
  "Can create an Activity Host": function (test: nodeunit.Test): void {

    var domain = "myDomain";
    var taskList = "myList";

    var options = gently.stub("Interfaces", "IOptions");
    var swf = gently.stub("Interfaces", "ISwfDataAccess");
    var reg = gently.stub("Activity", "ActivityRegister");

    var host = new acts.ActivityHost(reg, domain, taskList, swf);

    test.notEqual(acts, null, "nothing returned");
    test.equal(host.taskList, taskList, "taskList not set");
    test.equal(host.activityRegister, reg, "register not set");

    test.done();
  },
  "Handle an activity": function (test: nodeunit.Test): void {

    var domain = "myDomain";
    var taskList = "myList";
    var activityName = "myActivity";

    var options = gently.stub("Interfaces", "IOptions");
    var swf = gently.stub("Interfaces", "ISwfDataAccess");
    var reg = gently.stub("ActivityRegister", "ActivityRegister");
    var activity = gently.stub("Activity", "Activity");

    activity.reference = activityName;
    activity.name = activityName;
    activity.taskList = taskList;
    activity.version = "1";
    
    gently.expect(reg, "getActivityDescriptorByRef", function (reference) {
      test.equal(reference, activityName, "activityName not correct");
      return (activity);

    });

    gently.expect(swf, "pollForActivityTask", function (dom: string, list: string, callback) {

    });

    var host = new acts.ActivityHost(reg, domain, taskList, swf);

    host.handleActivity(activityName, function (err, data, next) {
      
    });

    host.listen();

    test.done();
  }
  
};


exports.activityTests = testGroup;