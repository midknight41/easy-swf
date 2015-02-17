var workflow = require("../Workflow");
var errors = require("../CustomErrors");
//import acts = require("../Activity");
//import wrapper = require("../FunctionWrapper");
var gently = new (require("gently"));
var testGroup = {
    setUp: function (callback) {
        if (process.env.AWS_ACCESS_KEY_ID)
            delete process.env.AWS_ACCESS_KEY_ID;
        if (process.env.AWS_SECRET_ACCESS_KEY)
            delete process.env.AWS_SECRET_ACCESS_KEY;
        if (process.env.AWS_REGION)
            delete process.env.AWS_REGION;
        callback();
    },
    tearDown: function (callback) {
        if (process.env.AWS_ACCESS_KEY_ID)
            delete process.env.AWS_ACCESS_KEY_ID;
        if (process.env.AWS_SECRET_ACCESS_KEY)
            delete process.env.AWS_SECRET_ACCESS_KEY;
        if (process.env.AWS_REGION)
            delete process.env.AWS_REGION;
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
        try {
            var act1 = client.createActivityHost(null);
            test.equal(1, 0, "taskList cannot be null");
        }
        catch (e) {
            test.equal(e.name, new errors.NullOrEmptyArgumentError().name, "Wrong error returned");
        }
        try {
            var act2 = client.createActivityHost("");
            test.equal(1, 0, "taskList cannot be an empty string");
        }
        catch (e) {
            test.equal(e.name, new errors.NullOrEmptyArgumentError().name, "Wrong error returned");
        }
        test.done();
    },
    "Cannot create a Decider Host with a valid task List": function (test) {
        var client = CreateClient();
        try {
            var dec1 = client.createDeciderHost(null);
            test.equal(1, 0, "taskList cannot be null");
        }
        catch (e) {
            test.equal(e.name, new errors.NullOrEmptyArgumentError().name, "Wrong error returned");
        }
        try {
            var dec2 = client.createDeciderHost("");
            test.equal(1, 0, "taskList cannot be empty string");
        }
        catch (e) {
            test.equal(e.name, new errors.NullOrEmptyArgumentError().name, "Wrong error returned");
        }
        test.done();
    },
    "Can start a workflow that exists in config": function (test) {
        var name = "workflowName";
        var version = "1";
        var options = {
            "domain": "myDomain",
            "taskList": "mainList",
        };
        var swf = gently.stub("Interfaces", "ISwfDataAccess");
        var config = {
            "accessKeyId": "access",
            "secretAccessKey": "secret",
            "region": "eu-west-1"
        };
        var client = new workflow.WorkflowClient(options, config, swf);
        gently.expect(swf, "startWorkflowExecution", function (request, callback) {
            test.notEqual(request.workflowId.length, 0, "uuid not set");
            test.equal(request.workflowType.name, name, "name not set");
            test.equal(request.workflowType.version, version, "version not set");
            test.equal(request.domain, options.domain, "domain not set");
        });
        client.startWorkflow(name, version, null, function (err) {
        });
        test.done();
    },
    "Null or Bad workflow definition throws an error": function (test) {
        var name = "workflowName";
        var swf = gently.stub("Interfaces", "ISwfDataAccess");
        var config = {
            "accessKeyId": "access",
            "secretAccessKey": "secret",
            "region": "eu-west-1"
        };
        var options = {
            "domain": "myDomain",
            "reference": "ref",
            "workflowType": name,
            "workflowTypeVersion": "1",
            "taskList": "mainList",
            "activities": null
        };
        ConstructorTest(test, null, config, swf, new errors.NullOrEmptyArgumentError("msg"));
        options.domain = null;
        ConstructorTest(test, options, config, swf);
        options.domain = "myDomain";
        options.taskList = null;
        ConstructorTest(test, options, config, swf);
        test.done();
    },
    "Null data layer does not throw an error": function (test) {
        var name = "workflowName";
        var options = {
            "domain": "myDomain",
            "reference": "ref",
            "workflowType": name,
            "workflowTypeVersion": "1",
            "taskList": "mainList",
            "activities": null
        };
        var swf = null;
        var config = {
            "accessKeyId": "access",
            "secretAccessKey": "secret",
            "region": "eu-west-1"
        };
        var client = new workflow.WorkflowClient(options, config, swf);
        test.done();
    },
    "Null AWS config throws an error if process.env.AWS_ACCESS_KEY_ID is missing": function (test) {
        var name = "workflowName";
        var options = {
            "domain": "myDomain",
            "taskList": "mainList",
        };
        var swf = gently.stub("Interfaces", "ISwfDataAccess");
        process.env.AWS_SECRET_ACCESS_KEY = "abc";
        process.env.AWS_REGION = "abc";
        ConstructorTest(test, options, null, swf);
        test.done();
    },
    "Null AWS config throws an error in process.env.AWS_SECRET_ACCESS_KEY is missing": function (test) {
        var name = "workflowName";
        var options = {
            "domain": "myDomain",
            "taskList": "mainList",
        };
        var swf = gently.stub("Interfaces", "ISwfDataAccess");
        process.env.AWS_ACCESS_KEY_ID = "abc";
        process.env.AWS_REGION = "abc";
        ConstructorTest(test, options, null, swf);
        test.done();
    },
    "Null AWS config throws an error in process.env.AWS_REGION is missing": function (test) {
        var name = "workflowName";
        var options = {
            "domain": "myDomain",
            "taskList": "mainList",
        };
        var swf = gently.stub("Interfaces", "ISwfDataAccess");
        process.env.AWS_ACCESS_KEY_ID = "abc";
        process.env.AWS_SECRET_ACCESS_KEY = "abc";
        ConstructorTest(test, options, null, swf);
        test.done();
    },
    "Null AWS config doesn't throw an error in process.env is correctly set up": function (test) {
        var name = "workflowName";
        var options = {
            "domain": "myDomain",
            "taskList": "mainList",
        };
        var swf = gently.stub("Interfaces", "ISwfDataAccess");
        process.env.AWS_ACCESS_KEY_ID = "abc";
        process.env.AWS_SECRET_ACCESS_KEY = "abc";
        process.env.AWS_REGION = "abc";
        var client = new workflow.WorkflowClient(options, null, swf);
        test.done();
    },
    "AWS config doesn't throw an error if process.env is correctly set up and the passed config doesn't contain any credentials": function (test) {
        var name = "workflowName";
        var options = {
            "domain": "myDomain",
            "taskList": "mainList",
        };
        var swf = gently.stub("Interfaces", "ISwfDataAccess");
        process.env.AWS_ACCESS_KEY_ID = "abc";
        process.env.AWS_SECRET_ACCESS_KEY = "abc";
        process.env.AWS_REGION = "abc";
        var nonCreds = {
            httpProxy: "abc"
        };
        var client = new workflow.WorkflowClient(options, nonCreds, swf);
        test.done();
    },
    "AWS config doesn't throw an error if credentials are passed in": function (test) {
        var name = "workflowName";
        var options = {
            "domain": "myDomain",
            "taskList": "mainList",
        };
        var swf = gently.stub("Interfaces", "ISwfDataAccess");
        var config = {
            "accessKeyId": "access",
            "secretAccessKey": "secret",
            "region": "eu-west-1"
        };
        var client = new workflow.WorkflowClient(options, config, swf);
        test.done();
    },
    "AWS config throws an error if partial credentials are passed in and process.env variables are missing": function (test) {
        var name = "workflowName";
        var options = {
            "domain": "myDomain",
            "taskList": "mainList",
        };
        var swf = gently.stub("Interfaces", "ISwfDataAccess");
        var config = {
            "accessKeyId": "access",
            "region": "eu-west-1"
        };
        ConstructorTest(test, options, config, swf);
        test.done();
    }
};
function ConstructorTest(test, options, config, swf, errorType) {
    if (errorType == null)
        errorType = new errors.InvalidArgumentError("msg");
    try {
        var client = new workflow.WorkflowClient(options, config, swf);
        test.equal(1, 0, "an error should have occurred");
    }
    catch (e) {
        test.equal(e.name, errorType.name, "received wrong error: " + e.name + ":" + e.message);
    }
}
function CreateClient() {
    var options = {
        "domain": "myDomain",
        "reference": "ref",
        "workflowType": "myName",
        "workflowTypeVersion": "1",
        "taskList": "mainList",
        "activities": []
    };
    var swf = gently.stub("Interfaces", "ISwfDataAccess");
    var config = {
        "accessKeyId": "access",
        "secretAccessKey": "secret",
        "region": "eu-west-1"
    };
    return new workflow.WorkflowClient(options, config, swf);
}
exports.workflowTests = testGroup;
//# sourceMappingURL=Workflow-test.js.map