/// <reference path="imports.d.ts" />
exports.monitor = console;
exports.debug = console;

var uuid = require("uuid");
var AWS = require("aws-sdk");
var a = require("./Activity");
var d = require("./Decider");
var e = require("./EventParser");

var WorkflowClient = (function () {
    function WorkflowClient(workflow, awsConfig) {
        this.config = awsConfig;

        AWS.config.update(this.config);

        this.workflow = workflow;

        //validate options before preceding
        this.swf = new AWS.SimpleWorkflow();
    }
    WorkflowClient.prototype.createActivityHost = function (taskList) {
        var reg = new ActivityRegister(this.workflow);
        var host = new a.ActivityHost(reg, this.workflow.domain, taskList, this.swf);

        return host;
    };
    WorkflowClient.prototype.createDeciderHost = function (taskList) {
        var eventParser = new e.EventParser();
        var reg = new ActivityRegister(this.workflow);
        var host = new d.DecisionHost(reg, this.workflow.domain, taskList, this.swf, eventParser);

        return host;
    };

    //startWorkflow(name: string, version: string, taskList: string, callback: (err) => void ) {
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

        me.swf.client.startWorkflowExecution(request, function (error, data) {
            exports.monitor.log("[Workflow] starting", me.workflow.domain);

            if (error == null) {
            } else {
                exports.debug.log("ERROR", error);
                callback(error);
            }
        });
    };
    return WorkflowClient;
})();
exports.WorkflowClient = WorkflowClient;

var ActivityRegister = (function () {
    function ActivityRegister(workflow) {
        this.workflow = workflow;
    }
    ActivityRegister.prototype.getActivityDescriptor = function (name, version) {
        var configEntries = this.workflow.activities.filter(function (item, index, array) {
            if (item.name == name && item.version == version)
                return true;
        });

        if (configEntries.length > 0) {
            return configEntries[0];
        } else {
            throw new Error("Cannot find activity " + name + ":" + version + " in config");
        }
    };

    ActivityRegister.prototype.getActivityDescriptorByRef = function (reference) {
        var configEntries = this.workflow.activities.filter(function (item, index, array) {
            if (item.reference == reference)
                return true;
        });

        if (configEntries.length > 0) {
            return configEntries[0];
        } else {
            throw new Error("Cannot find activity " + reference + " in config");
        }
    };
    return ActivityRegister;
})();
exports.ActivityRegister = ActivityRegister;

//@ sourceMappingURL=Workflow.js.map
