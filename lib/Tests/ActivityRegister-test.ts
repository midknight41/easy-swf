///<reference path="../imports.d.ts"/>

import interfaces = require("../Interfaces");
import errors = require("../CustomErrors");
import acts = require("../Activity");
import reg = require("../ActivityRegister");
import help = require("../Helpers/TestHelper");

var act1: interfaces.IActivity = {

  reference: "ProcessRssFeed",
  name: "ProcessRssFeed",
  version: "1",
  taskList: "mainList"
};

var act2: interfaces.IActivity = {

  reference: "CreateFinalFeed",
  name: "CreateFinalFeed",
  version: "2",
  taskList: "mainList"
};

var workflow: interfaces.IOptions = {
  domain: "BuildTailoredRssFeed",
  reference: "BasicRssFeed",
  workflowType: "BasicRssFeed",
  workflowTypeVersion: "1",
  taskList: "mainList",
  activities: [act1, act2]
};

var testGroup = {
  setUp: function (callback: nodeunit.ICallbackFunction): void {
    callback();
  },
  tearDown: function (callback: nodeunit.ICallbackFunction): void {
    callback();
  },
  "Can create an Activity Register": function (test: nodeunit.Test): void {

    var ar = new reg.ActivityRegister(workflow);

    test.notEqual(ar, null, "an object should have been created");
    test.done();

  },
  "Throws an error when no workflow is provided": function (test: nodeunit.Test): void {

    help.nullErrorTest(test, function () {
      var ar = new reg.ActivityRegister(null);
    });

    test.done();
  },
  //"Can get an Activity by ref": function (test: nodeunit.Test): void {

  //  var ar = new reg.ActivityRegister(workflow);

  //  var activity = ar.getActivityByRef("ProcessRssFeed");

  //  test.equal(activity.name, workflow.activities[0].name);

  //  test.done();
  //},
  "Can get an Activity by name and version": function (test: nodeunit.Test): void {
    var ar = new reg.ActivityRegister(workflow);

    var activity = ar.getActivity("ProcessRssFeed", "1");

    test.equal(activity.name, workflow.activities[0].name);

    test.done();

  },
  "Can get an Activity by ref": function (test: nodeunit.Test): void {

    var ar = new reg.ActivityRegister(workflow);
    
    var activity = ar.getActivityByRef("ProcessRssFeed");

    test.equal(activity.name, workflow.activities[0].name);

    test.done();

  },
  "Throws error on bad request for Activity by ref": function (test: nodeunit.Test): void {

    var ar = new reg.ActivityRegister(workflow);

    help.invalidArgumentErrorTest(test, function () {
      ar.getActivityByRef("fakdj");
    });

    test.done();
  },
  "Throws error on bad request for Activity by name and version": function (test: nodeunit.Test): void {
    var ar = new reg.ActivityRegister(workflow);

    help.invalidArgumentErrorTest(test, function () {
      ar.getActivity("fadkj", "1");
    });

    test.done();

  }
};


exports.activityRegisterTests = testGroup;