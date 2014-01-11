/// <reference path="imports.d.ts" />
exports.monitor = console;
exports.debug = console;

var AWS = require("aws-sdk");
var a = require("./Activity");
var d = require("./Decider");
var e = require("./EventParser");
var dal = require("./SwfDataAccess");
var r = require("./ActivityRegister");

var uuid = require("uuid");
var errors = require("./CustomErrors");

var WorkflowClient = (function () {
    function WorkflowClient(workflow, awsConfig, swf) {
        this.config = awsConfig;

        AWS.config.update(this.config);

        this.workflow = workflow;

        //validate options before preceding
        if (swf == null)
            this.swf = new dal.SwfDataAccess();
        else
            this.swf = swf;
    }
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
        var host = new d.DecisionHost(reg, this.workflow.domain, taskList, this.swf, eventParser);

        return host;
    };

    WorkflowClient.prototype.startWorkflow = function (reference, callback) {
        var request = {
            domain: this.workflow.domain,
            workflowId: uuid.v4(),
            workflowType: {
                name: this.workflow.workflowType,
                version: this.workflow.workflowTypeVersion
            },
            taskList: { name: this.workflow.taskList }
        };

        var me = this;

        this.swf.startWorkflowExecution(request, callback);
    };
    return WorkflowClient;
})();
exports.WorkflowClient = WorkflowClient;
