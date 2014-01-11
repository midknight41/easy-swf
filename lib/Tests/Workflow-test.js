///<reference path="../imports.d.ts"/>
var workflow = require("../Workflow");

var errors = require("../CustomErrors");

//import acts = require("../Activity");
//import wrapper = require("../FunctionWrapper");
var gently = new (require("gently"));

var testGroup = {
    setUp: function (callback) {
        callback();
    },
    tearDown: function (callback) {
        callback();
    },
    "Can create a Decider Host": function (test) {
        var name = "taskList";
        var client = CreateClient();

        var dec = client.createDeciderHost(name);

        test.notEqual(dec, null, "nothing returned");
        test.equal(dec.taskList, name, "taskList not set");

        test.done();
    },
    "Cannot create an Activity Host with a valid task List": function (test) {
        var client = CreateClient();

        try  {
            var act1 = client.createActivityHost(null);
            test.equal(1, 0, "taskList cannot be null");
        } catch (e) {
            test.equal(e.name, new errors.NullArgumentError().name, "Wrong error returned");
        }

        try  {
            var act2 = client.createActivityHost("");
            test.equal(1, 0, "taskList cannot be an empty string");
        } catch (e) {
            test.equal(e.name, new errors.NullArgumentError().name, "Wrong error returned");
        }

        test.done();
    },
    "Cannot create a Decider Host with a valid task List": function (test) {
        var client = CreateClient();

        try  {
            var dec1 = client.createDeciderHost(null);
            test.equal(1, 0, "taskList cannot be null");
        } catch (e) {
            test.equal(e.name, new errors.NullArgumentError().name, "Wrong error returned");
        }

        try  {
            var dec2 = client.createDeciderHost("");
            test.equal(1, 0, "taskList cannot be empty string");
        } catch (e) {
            test.equal(e.name, new errors.NullArgumentError().name, "Wrong error returned");
        }
        test.done();
    },
    "Can start a workflow that exists in config": function (test) {
        var name = "workflowName";
        var options = {
            "domain": "myDomain",
            "reference": "ref",
            "workflowType": name,
            "workflowTypeVersion": "1",
            "taskList": "mainList",
            "activities": null
        };

        var swf = gently.stub("Interfaces", "ISwfDataAccess");

        var config = {
            "awsConfig": {
                "accessKeyId": "access",
                "secretAccessKey": "secret",
                "region": "eu-west-1"
            }
        };

        var client = new workflow.WorkflowClient(options, config, swf);

        gently.expect(swf, "startWorkflowExecution", function (request, callback) {
            test.notEqual(request.workflowId.length, 0, "uuid not set");
            test.equal(request.workflowType.name, options.workflowType, "name not set");
            test.equal(request.workflowType.version, options.workflowTypeVersion, "version not set");
            test.equal(request.domain, options.domain, "domain not set");
        });

        client.startWorkflow(name, function (err) {
        });

        test.done();
    },
    "Invalid options throw an error": function (test) {
        test.done();
    }
};

function CreateClient() {
    var options = gently.stub("Interfaces", "IOptions");
    var swf = gently.stub("Interfaces", "ISwfDataAccess");

    var config = {
        "awsConfig": {
            "accessKeyId": "access",
            "secretAccessKey": "secret",
            "region": "eu-west-1"
        }
    };

    return new workflow.WorkflowClient(options, config, swf);
}

exports.workflowTests = testGroup;
//# sourceMappingURL=Workflow-test.js.map
