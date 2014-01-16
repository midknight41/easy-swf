///<reference path="../imports.d.ts"/>

import interfaces = require("../Interfaces");
import errors = require("../CustomErrors");
import dec = require("../Decider");
import help = require("../Helpers/TestHelper");

var gently = new (require("gently"));


var testGroup = {
  setUp: function (callback: nodeunit.ICallbackFunction): void {
    callback();
  },
  tearDown: function (callback: nodeunit.ICallbackFunction): void {
    callback();
  },
  "Can create a Decider Host": function (test: nodeunit.Test): void {

    var domain = "myDomain";
    var taskList = "myList";

    var swf = gently.stub("Interfaces", "ISwfDataAccess");
    var reg = gently.stub("Activity", "ActivityRegister");
    var parser = gently.stub("EventParser", "EventParser");

    var host = new dec.DecisionHost(reg, domain, taskList, swf, parser);

    test.notEqual(host, null, "nothing returned");
    test.equal(host.taskList, taskList, "taskList not set");

    test.done();
  },
  "Throws an error when given bad constructors: TODO": function (test: nodeunit.Test): void {
    test.done();

  }


};


var testGroup2 = {
  setUp: function (callback: nodeunit.ICallbackFunction): void {
    callback();
  },
  tearDown: function (callback: nodeunit.ICallbackFunction): void {
    callback();
  },
  "Can create a Decision Context": function (test: nodeunit.Test): void {

    var taskList = "myList";

    var swf = gently.stub("Interfaces", "ISwfDataAccess");
    var reg = gently.stub("Activity", "ActivityRegister");
    var parser = gently.stub("EventParser", "EventParser");
    var state = {events: []};
    var activity: interfaces.IActivity = gently.stub("Activity", "Activity");

    activity.name = "test";
    activity.version = "1";
    activity.taskList = taskList;
    activity.reference = "test_1";
    activity.input = "input";

    gently.expect(parser, "extractActivities", function (events) {
      return ([activity]);
    });

    var context = new dec.DecisionContext(taskList, reg, parser, swf, null, state);

    test.notEqual(context, null, "nothing returned");
    test.equal(context.state, state, "taskList not set");
    test.equal(context.activities[0].name, activity.name, "activities not properly set");
    test.done();
  },
  "Throws an error when given bad constructors": function (test: nodeunit.Test): void {

    var taskList = "myList";

    var swf = gently.stub("Interfaces", "ISwfDataAccess");
    var reg = gently.stub("Activity", "ActivityRegister");
    var parser = gently.stub("EventParser", "EventParser");
    var state = { events: [] };

    help.nullErrorTest(test, function () {
      var context = new dec.DecisionContext(null, reg, parser, swf, null, state);
    });

    help.nullErrorTest(test, function () {
      var context = new dec.DecisionContext(taskList, null, parser, swf, null, state);
    });

    help.nullErrorTest(test, function () {
      var context = new dec.DecisionContext(taskList, reg, null, swf, null, state);
    });

    help.nullErrorTest(test, function () {
      var context = new dec.DecisionContext(taskList, reg, parser, null, null, state);
    });

    help.nullErrorTest(test, function () {
      var context = new dec.DecisionContext(taskList, reg, parser, swf, null, null);
    });

    test.done();
  },
  "Can define a feedbackHandler and receive messages": function (test: nodeunit.Test): void {

    var t = basicDCSetup();

    gently.expect(t.parser, "extractActivities", function (events) {
      return ([t.activity]);
    });

    gently.expect(t.swf, "respondRecordMarker", function (taskToken: string, callback: (err: any, data: any) => void) {

      test.equal(taskToken, t.state.taskToken, "task token not correctly set");
      callback(null, "data");

    });

    var called = false;

    var fnc = function (err, message) {
      test.equal(err, null, "unexpected error from feedbackHandler");
      test.equal((message.length > 0), true, "no message returned when one was expected");
      called = true;
    };

    var context = new dec.DecisionContext(t.taskList, t.reg, t.parser, t.swf, fnc, t.state);
    context.doNothing();

    test.equal(called, true, "handler was not called");
    test.done();

  },
  "Can get a function": function (test: nodeunit.Test): void {

    var t = basicDCSetup();

    gently.expect(t.parser, "extractActivities", function (events) {
      return ([t.activity]);
    });

    gently.expect(t.reg, "getActivityByRef", function (events) {
      return (t.activity);
    });

    var context = new dec.DecisionContext(t.taskList, t.reg, t.parser, t.swf, null, t.state);

    var fnc = context.getFunction(t.activity.reference);
    test.notEqual(fnc, null, "did not return a function");

    test.done();

  },
  "Can fail a workflow": function (test: nodeunit.Test): void {

    var errorMsg = "my error";
    var t = basicDCSetup();

    gently.expect(t.parser, "extractActivities", function (events) {
      return ([t.activity]);
    });

    gently.expect(t.swf, "respondFailWorkflowExecution", function (taskToken, message, message2, callback) {
      test.equal(taskToken, t.state.taskToken, "taskToken not properly set");
      test.equal(message, errorMsg, "wrong error message returned");
      test.equal(message2, errorMsg, "wrong error detail returned");
      callback(null, "data");
    });

    var context = new dec.DecisionContext(t.taskList, t.reg, t.parser, t.swf, null, t.state);

    context.failWorkflow(new Error(errorMsg));

    

    test.done();
  },
  "Can signal 'do nothing' when a activity does not yet need to be scheduled": function (test: nodeunit.Test): void {

    var t = basicDCSetup();

    gently.expect(t.parser, "extractActivities", function (events) {
      return ([t.activity]);
    });

    gently.expect(t.swf, "respondRecordMarker", function (taskToken: string, callback: (err: any, data: any) => void) {

      test.equal(taskToken, t.state.taskToken, "task token not correctly set");
      callback(null, "data");

    });

    var context = new dec.DecisionContext(t.taskList, t.reg, t.parser, t.swf, null, t.state);
    context.doNothing();

    test.done();
  },
  "Can complete a workflow": function (test: nodeunit.Test): void {
    var t = basicDCSetup();

    gently.expect(t.parser, "extractActivities", function (events) {
      return ([t.activity]);
    });

    gently.expect(t.swf, "respondCompleteWorkflowExecution", function (taskToken: string, callback: (err: any, data: any) => void) {

      test.equal(taskToken, t.state.taskToken, "task token not correctly set");
      callback(null, "data");

    });

    var context = new dec.DecisionContext(t.taskList, t.reg, t.parser, t.swf, null, t.state);
    context.allDone();

    test.done();
  },
  "Can schedule a task with no input": function (test: nodeunit.Test): void {
    var t = basicDCSetup();

    gently.expect(t.parser, "extractActivities", function (events) {
      return ([t.activity]);
    });

    gently.expect(t.swf, "respondScheduleActivityTask", function (taskToken: string, decisions, callback: (err: any, data: any) => void) {

      test.equal(taskToken, t.state.taskToken, "task token not correctly set");

      var decision = decisions[0].scheduleActivityTaskDecisionAttributes;

      test.equal(decision.input, "", "no input was sent");
      test.equal(decision.activityType.name, t.activity.name, "names do not match");
      test.equal(decision.activityType.version, t.activity.version, "names do not match");
      test.equal(decision.taskList.name, t.taskList, "names do not match");

      callback(null, "data");

    });

    var context = new dec.DecisionContext(t.taskList, t.reg, t.parser, t.swf, null, t.state);
    context.doActivity(t.activity);
    test.done();
  },
  "Can schedule a task with input": function (test: nodeunit.Test): void {
    var t = basicDCSetup();
    var input = "myInput";

    gently.expect(t.parser, "extractActivities", function (events) {
      return ([t.activity]);
    });

    gently.expect(t.swf, "respondScheduleActivityTask", function (taskToken: string, decisions, callback: (err: any, data: any) => void) {

      test.equal(taskToken, t.state.taskToken, "task token not correctly set");

      var decision = decisions[0].scheduleActivityTaskDecisionAttributes;
      test.equal(decision.input, input, "no input was sent");
      test.equal(decision.activityType.name, t.activity.name, "names do not match");
      test.equal(decision.activityType.version, t.activity.version, "names do not match");
      test.equal(decision.taskList.name, t.taskList, "names do not match");
      callback(null, "data");

    });

    var context = new dec.DecisionContext(t.taskList, t.reg, t.parser, t.swf, null, t.state);
    context.doActivity(t.activity, input);
    test.done();
  },
  "Can schedule multiple tasks in parallel": function (test: nodeunit.Test): void {

    var t = basicDCSetup();
    var input = "myInput";
    var act2: interfaces.IActivity = gently.stub("Activity", "Activity");

    act2.name = "test2";
    act2.version = "1";
    act2.taskList = t.taskList;
    act2.reference = "test_2";

    gently.expect(t.parser, "extractActivities", function (events) {
      return ([t.activity, act2]);
    });

    gently.expect(t.swf, "respondScheduleActivityTask", function (taskToken: string, decisions, callback: (err: any, data: any) => void) {

      test.equal(taskToken, t.state.taskToken, "task token not correctly set");

      var decision = decisions[0].scheduleActivityTaskDecisionAttributes;
      var decision2 = decisions[1].scheduleActivityTaskDecisionAttributes;

      test.equal(decision.input, input, "no input was sent");
      test.equal(decision.activityType.name, t.activity.name, "names do not match");
      test.equal(decision.activityType.version, t.activity.version, "names do not match");
      test.equal(decision.taskList.name, t.taskList, "names do not match");

      test.equal(decision2.input, input, "no input was sent");
      test.equal(decision2.activityType.name, t.activity.name, "names do not match");
      test.equal(decision2.activityType.version, t.activity.version, "names do not match");
      test.equal(decision2.taskList.name, t.taskList, "names do not match");

      callback(null, "data");

    });

    var context = new dec.DecisionContext(t.taskList, t.reg, t.parser, t.swf, null, t.state);

    context.doActivity(t.activity, input);
    context.doActivity(t.activity, input);

    test.done();
  },
  "Throws an error when you request an activity that does not exist in config": function (test: nodeunit.Test): void {
    var t = basicDCSetup();
    var input = "myInput";

    gently.expect(t.parser, "extractActivities", function (events) {
      return ([t.activity]);
    });

    var called = false;

    var fnc = function (err, message) {
      test.notEqual(err, null, "an error should have been returned");
      test.equal((message.length > 0), true, "no message returned when one was expected");
      called = true;
    };

    var context = new dec.DecisionContext(t.taskList, t.reg, t.parser, t.swf, fnc, t.state);
    context.doActivity(null, input);

    test.equal(called, true, "feedbackHandler was not called");

    test.done();
  }

};


function basicDCSetup() {

  var taskList = "myList";

  var swf = gently.stub("Interfaces", "ISwfDataAccess");
  var reg = gently.stub("Activity", "ActivityRegister");
  var parser = gently.stub("EventParser", "EventParser");
  var state = { events: [], taskToken: "token" };
  var activity: interfaces.IActivity = gently.stub("Activity", "Activity");

  activity.name = "test";
  activity.version = "1";
  activity.taskList = taskList;
  activity.reference = "test_1";
  activity.input = "input";


  return {
    taskList: taskList,
    swf: swf, reg: reg, parser: parser, state: state, activity: activity
  };

}

exports.deciderTests = testGroup; 
exports.decisionContextTests = testGroup2; 
