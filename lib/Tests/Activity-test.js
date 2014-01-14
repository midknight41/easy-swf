///<reference path="../imports.d.ts"/>
var acts = require("../Activity");

//import wrapper = require("../FunctionWrapper");
var gently = new (require("gently"));

var testGroup = {
    setUp: function (callback) {
        callback();
    },
    tearDown: function (callback) {
        callback();
    },
    "Can create an Activity Host": function (test) {
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
    "Handle an activity that has input": function (test) {
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
    "Handle an activity that has no input": function (test) {
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
    "Handle an activity that has null input": function (test) {
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
    "Process an activity that has no activity handler": function (test) {
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

        gently.expect(reg, "getActivityDescriptorByRef", function (reference) {
            test.equal(reference, handler, "activityName not correct on byref");
            return (activity2);
        });

        gently.expect(swf, "pollForActivityTask", function (dom, list, callback) {
            test.equal(dom, domain);
            test.equal(list, taskList);
            callback(null, swfData);
        });

        gently.expect(reg, "getActivityDescriptor", function (name, version) {
            test.equal(name, activityName, "activityName not correct");
            test.equal(version, "1", "version not correct");
            return (activity);
        });

        var host = new acts.ActivityHost(reg, domain, taskList, swf);

        host.handleActivity(handler, function (err, data, next) {
            test.equal(1, 0, "This handler should not get called");
        });

        host.listen(function (err, message) {
            if (err != null) {
                host.stop();
                //  console.log(message);
                //  console.log(err);
            } else {
                //  console.log(message);
            }
        });

        test.done();
    },
    "Throws an error when you define an activity handler in code but not in config": function (test) {
        var domain = "myDomain";
        var taskList = "myList";
        var handler = "myUnhandledActivity";

        var swf = gently.stub("Interfaces", "ISwfDataAccess");
        var reg = gently.stub("ActivityRegister", "ActivityRegister");

        gently.expect(reg, "getActivityDescriptorByRef", function (reference) {
            test.equal(reference, handler, "activityName not correct on byref");
            return (null);
        });

        var host = new acts.ActivityHost(reg, domain, taskList, swf);

        try  {
            host.handleActivity(handler, function (err, data, next) {
                test.equal(1, 0, "This handler should not get called");
            });
        } catch (e) {
        }

        test.done();
    }
};

function TestAnActivity(test, activity, swfData) {
    var domain = "myDomain";
    var taskList = "myList";
    var activityName = activity.reference;

    var swf = gently.stub("Interfaces", "ISwfDataAccess");
    var reg = gently.stub("ActivityRegister", "ActivityRegister");

    gently.expect(reg, "getActivityDescriptorByRef", function (reference) {
        test.equal(reference, activity.reference, "activityName not correct on byref");
        return (activity);
    });

    gently.expect(swf, "pollForActivityTask", function (dom, list, callback) {
        test.equal(dom, domain);
        test.equal(list, taskList);
        callback(null, swfData);
    });

    gently.expect(reg, "getActivityDescriptor", function (name, version) {
        test.equal(name, activityName, "activityName not correct");
        test.equal(version, "1", "version not correct");
        return (activity);
    });

    var host = new acts.ActivityHost(reg, domain, taskList, swf);

    host.handleActivity(activityName, function (err, data, next) {
        test.equal(err, null, "An error occurred");
        test.equal(swfData.input, data, "input was not correctly returned");
        host.stop();
    });

    host.listen(function (err, message) {
        if (err != null)
            console.log("ERROR", err);
        //console.log(message);
    });

    test.done();
}

exports.activityTests = testGroup;
//# sourceMappingURL=Activity-test.js.map
