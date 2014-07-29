/// <reference path="imports.d.ts" />
var AWS = require("aws-sdk");
var a = require("./Activity");
var d = require("./Decider");
var e = require("./EventParser");
var dal = require("./SwfDataAccess");
var r = require("./ActivityRegister");
var w = require("./WorkflowItemRegister");

var uuid = require("uuid");
var errors = require("./CustomErrors");

var WorkflowClient = (function () {
    function WorkflowClient(workflow, awsConfig, swf) {
        this.validateOptions(workflow);
        this.validateConfig(awsConfig);

        this.config = awsConfig;

        AWS.config.update(this.config);

        this.workflow = workflow;

        if (swf == null)
            this.swf = new dal.SwfDataAccess();
        else
            this.swf = swf;
    }
    WorkflowClient.prototype.validateOptions = function (workflow) {
        if (workflow == null)
            throw new errors.NullArgumentError("workflow");
        if (workflow.domain == null)
            throw new errors.InvalidArgumentError("domain is mandatory");
        if (workflow.taskList == null)
            throw new errors.InvalidArgumentError("taskList is mandatory");
    };

    WorkflowClient.prototype.validateConfig = function (awsConfig) {
        if (awsConfig == null)
            throw new errors.NullArgumentError("awsConfig");
        if (awsConfig.accessKeyId == null)
            throw new errors.InvalidArgumentError("accessKeyId is mandatory");
        if (awsConfig.secretAccessKey == null)
            throw new errors.InvalidArgumentError("secretAccessKey is mandatory");
        if (awsConfig.region == null)
            throw new errors.InvalidArgumentError("region is mandatory");
    };

    WorkflowClient.prototype.createActivityHost = function (taskList) {
        if (taskList == null || taskList == "")
            throw new errors.NullArgumentError("taskList cannot be null or empty");

        var reg = new r.ActivityRegister(this.workflow);
        var host = new a.ActivityHost(reg, this.workflow.domain, taskList, this.swf);

        return host;
    };

    WorkflowClient.prototype.createDeciderHost = function (taskList) {
        if (taskList == null || taskList == "")
            throw new errors.NullArgumentError("taskList cannot be null of empty");

        var eventParser = new e.EventParser();
        var reg = new r.ActivityRegister(this.workflow);
        var wiRegister = new w.WorkflowItemRegister();

        var host = new d.DecisionHost(wiRegister, reg, this.workflow.domain, taskList, this.swf, eventParser);

        return host;
    };

    WorkflowClient.prototype.startWorkflowOld = function (reference, input, callback) {
        if (reference == null || reference == "")
            throw new errors.NullArgumentError("reference is mandatory");

        input = input == null ? input = "" : input;

        var request = {
            domain: this.workflow.domain,
            workflowId: uuid.v4(),
            input: input,
            workflowType: {
                name: this.workflow.workflowType,
                version: this.workflow.workflowTypeVersion
            },
            taskList: { name: this.workflow.taskList }
        };

        var me = this;

        this.swf.startWorkflowExecution(request, callback);
    };

    WorkflowClient.prototype.startWorkflow = function (name, version, input, callback) {
        if (name == null || name == "")
            throw new errors.NullArgumentError("name is mandatory");
        if (version == null || version == "")
            throw new errors.NullArgumentError("version is mandatory");

        input = input == null ? input = "" : input;

        var request = {
            domain: this.workflow.domain,
            workflowId: uuid.v4(),
            input: input,
            workflowType: {
                name: name,
                version: version
            },
            taskList: { name: this.workflow.taskList }
        };

        var me = this;

        this.swf.startWorkflowExecution(request, callback);
    };
    return WorkflowClient;
})();
exports.WorkflowClient = WorkflowClient;
