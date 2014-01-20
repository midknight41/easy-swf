///<reference path="../imports.d.ts"/>
var reg = require("../ActivityRegister");
var help = require("../Helpers/TestHelper");

var act1 = {
    reference: "ProcessRssFeed",
    name: "ProcessRssFeed",
    version: "1",
    taskList: "mainList"
};

var act2 = {
    reference: "CreateFinalFeed",
    name: "CreateFinalFeed",
    version: "2",
    taskList: "mainList"
};

var workflow = {
    domain: "BuildTailoredRssFeed",
    reference: "BasicRssFeed",
    workflowType: "BasicRssFeed",
    workflowTypeVersion: "1",
    taskList: "mainList",
    activities: [act1, act2]
};

var testGroup = {
    setUp: function (callback) {
        callback();
    },
    tearDown: function (callback) {
        callback();
    },
    "Can create an Activity Register": function (test) {
        var ar = new reg.ActivityRegister(workflow);

        test.notEqual(ar, null, "an object should have been created");
        test.done();
    },
    "Throws an error when no workflow is provided": function (test) {
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
    "Can get an Activity by name and version": function (test) {
        var ar = new reg.ActivityRegister(workflow);

        var activity = ar.getActivity("ProcessRssFeed", "1");

        test.equal(activity.name, workflow.activities[0].name);

        test.done();
    },
    "Can get an Activity by ref": function (test) {
        var ar = new reg.ActivityRegister(workflow);

        var activity = ar.getActivityByRef("ProcessRssFeed");

        test.equal(activity.name, workflow.activities[0].name);

        test.done();
    },
    "Throws error on bad request for Activity by ref": function (test) {
        var ar = new reg.ActivityRegister(workflow);

        help.invalidArgumentErrorTest(test, function () {
            ar.getActivityByRef("fakdj");
        });

        test.done();
    },
    "Throws error on bad request for Activity by name and version": function (test) {
        var ar = new reg.ActivityRegister(workflow);

        help.invalidArgumentErrorTest(test, function () {
            ar.getActivity("fadkj", "1");
        });

        test.done();
    }
};

exports.activityRegisterTests = testGroup;
//# sourceMappingURL=ActivityRegister-test.js.map
