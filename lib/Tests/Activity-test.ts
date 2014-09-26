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

    test.notEqual(host, null, "nothing returned");
    test.equal(host.taskList, taskList, "taskList not set");

    test.done();
  },
  "Handle an activity that has input": function (test: nodeunit.Test): void {

    var taskList = "myList";
    var activityName = "myActivity";

    var activity = gently.stub("Activity", "Activity");

    activity.reference = activityName;
    activity.name = activityName;
    activity.taskList = taskList;
    activity.version = "1";

    var swfData = {
      startedEventId: 1,
      taskToken: "token",
      activityType: { name: activityName, version: "1" },
      input: "input"
    };

    TestAnActivity(test, activity, swfData);

  },
  "Handle an activity that has no input": function (test: nodeunit.Test): void {

    var taskList = "myList";
    var activityName = "myActivity";

    var activity = gently.stub("Activity", "Activity");

    activity.reference = activityName;
    activity.name = activityName;
    activity.taskList = taskList;
    activity.version = "1";

    var swfData = {
      startedEventId: 1,
      taskToken: "token",
      activityType: { name: activityName, version: "1" },
      input: ""
    };

    TestAnActivity(test, activity, swfData);
  },
  "Handle an activity that has null input": function (test: nodeunit.Test): void {

    var taskList = "myList";
    var activityName = "myActivity";

    var activity = gently.stub("Activity", "Activity");

    activity.reference = activityName;
    activity.name = activityName;
    activity.taskList = taskList;
    activity.version = "1";

    var swfData = {
      startedEventId: 1,
      taskToken: "token",
      activityType: { name: activityName, version: "1" },
      input: null
    };

    TestAnActivity(test, activity, swfData);
  },
  "Process an activity that has no activity handler": function (test: nodeunit.Test): void {

    var domain = "myDomain";
    var taskList = "myList";
    var activityName = "myActivity";
    var handler = "myUnhandledActivity";

    var activity = gently.stub("Activity", "Activity");

    activity.reference = activityName;
    activity.name = activityName;
    activity.taskList = taskList;
    activity.version = "1";

    var activity2 = gently.stub("Activity", "Activity");

    activity2.reference = handler;
    activity2.name = handler;
    activity2.taskList = taskList;
    activity2.version = "1";

    var swfData = {
      startedEventId: 1,
      taskToken: "token",
      activityType: { name: activityName, version: "1" },
      input: "input"
    };

    var swf = gently.stub("Interfaces", "ISwfDataAccess");
    var reg = gently.stub("ActivityRegister", "ActivityRegister");

    gently.expect(reg, "getActivity", function (name, version) {
      test.equal(name, handler, "activityName not correct");
      test.equal(version, "1", "version not correct");
      return (activity2);
    });
    
    gently.expect(swf, "pollForActivityTask", function (dom: string, list: string, callback) {
      test.equal(dom, domain);
      test.equal(list, taskList);
      callback(null, swfData);
    });

    gently.expect(reg, "getActivity", function (name, version) {
      test.equal(name, activityName, "activityName not correct");
      test.equal(version, "1", "version not correct");
      return (activity);
    });

    var host = new acts.ActivityHost(reg, domain, taskList, swf);

    host.handleActivity(handler, "1", function (err, data, next) {
      test.equal(1, 0, "This handler should not get called");
    });

    host.listen(function (err, message) {

      if (err != null) {
        host.stop();
      }
    });

    test.done();

  },
  "Handles good parameters passed from the next() function": function (test: nodeunit.Test): void {

    TestNextFunction(test, null, "result");
  },
  "Handles bad parameters passed from the next() function": function (test: nodeunit.Test): void {

    TestNextFunction(test, null, null);
  },
  "Handles an error passed from the next() function": function (test: nodeunit.Test): void {

    TestNextFunction(test, new Error("msg"), null);
  }

  
};

function TestNextFunction(test, inErr, result) {
  var taskList = "myList";
  var activityName = "myActivity";
  var domain = "myDomain";

  var activity = gently.stub("Activity", "Activity");

  activity.reference = activityName;
  activity.name = activityName;
  activity.taskList = taskList;
  activity.version = "1";

  var swfData = {
    startedEventId: 1,
    taskToken: "token",
    activityType: { name: activityName, version: "1" },
    input: ""
  };

  var swf = gently.stub("Interfaces", "ISwfDataAccess");
  var reg = gently.stub("ActivityRegister", "ActivityRegister");

  gently.expect(reg, "getActivity", function (name, version) {
    test.equal(name, activityName, "activityName not correct");
    test.equal(version, "1", "version not correct");
    return (activity);
  });

  gently.expect(swf, "pollForActivityTask", function (dom: string, list: string, callback) {
    test.equal(dom, domain);
    test.equal(list, taskList);
    callback(null, swfData);
  });

  gently.expect(reg, "getActivity", function (name, version) {
    test.equal(name, activityName, "activityName not correct");
    test.equal(version, "1", "version not correct");
    return (activity);
  });

  if (inErr != null) {
    gently.expect(swf, "respondActivityTaskFailed", function (token, data, callback) {
      callback(null, "");
    });
  } else {

    gently.expect(swf, "respondActivityTaskCompleted", function (token, data, callback) {
      callback(null, "");
    });

  }

  var host = new acts.ActivityHost(reg, domain, taskList, swf);

  host.handleActivity(activityName, "1", function (err, data, next) {
    test.equal(err, null, "An error occurred");
    test.equal(swfData.input, data, "input was not correctly returned");

    next(inErr, result);

    host.stop();
  });

  host.listen(function (err, message) {

    
    //if (err != null) console.log("ERROR", err);
    //console.log(message);

  });

  test.done();

}


function TestAnActivity(test: nodeunit.Test, activity: interfaces.IActivity, swfData) {

  var domain = "myDomain";
  var taskList = "myList";
  var activityName = activity.reference;

  var swf = gently.stub("Interfaces", "ISwfDataAccess");
  var reg = gently.stub("ActivityRegister", "ActivityRegister");


  gently.expect(reg, "getActivity", function (name, version) {
    test.equal(name, activityName, "activityName not correct");
    test.equal(version, "1", "version not correct");
    return (activity);
  });

  gently.expect(swf, "pollForActivityTask", function (dom: string, list: string, callback) {
    test.equal(dom, domain);
    test.equal(list, taskList);
    callback(null, swfData);
  });

  gently.expect(reg, "getActivity", function (name, version) {
    test.equal(name, activityName, "activityName not correct");
    test.equal(version, "1", "version not correct");
    return (activity);
  });

  var host = new acts.ActivityHost(reg, domain, taskList, swf);

  host.handleActivity(activityName, "1", function (err, data, next) {
    test.equal(err, null, "An error occurred");
    test.equal(swfData.input, data, "input was not correctly returned");
    host.stop();
  });

  host.listen(function (err, message) {

    if (err != null) console.log("ERROR", err);
    //console.log(message);

  });

  test.done();
}


exports.activityTests = testGroup;