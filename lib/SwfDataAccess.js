/// <reference path="imports.d.ts" />
var AWS = require("aws-sdk");

exports.monitor = console;
exports.debug = console;

var SwfDataAccess = (function () {
    function SwfDataAccess() {
        this.swf = new AWS.SimpleWorkflow();
    }
    SwfDataAccess.prototype.respondScheduleActivityTask = function (taskToken, decisions, callback) {
        var params = {
            taskToken: taskToken,
            decisions: decisions
        };

        this.swf.respondDecisionTaskCompleted(params, function (err, data) {
            callback(err, data);
        });
    };

    SwfDataAccess.prototype.respondRecordMarker = function (taskToken, callback) {
        var attr = {
            markerName: "NoActionFromThisDecision"
        };

        var decision = {
            decisionType: "RecordMarker",
            recordMarkerDecisionAttributes: attr
        };

        var params = {
            taskToken: taskToken,
            decisions: [decision]
        };

        this.swf.client.respondDecisionTaskCompleted(params, function (err, data) {
            callback(err, data);
        });
    };
    SwfDataAccess.prototype.respondCompleteWorkflowExecution = function (taskToken, callback) {
        var decision = {
            decisionType: "CompleteWorkflowExecution"
        };

        var params = {
            taskToken: taskToken,
            decisions: [decision]
        };

        this.swf.client.respondDecisionTaskCompleted(params, function (err, data) {
            callback(err, data);
        });
    };

    SwfDataAccess.prototype.respondFailWorkflowExecution = function (taskToken, reason, detail, callback) {
        var attr = {
            reason: reason,
            details: detail
        };

        var decision = {
            decisionType: "FailWorkflowExecution",
            failWorkflowExecutionDecisionAttributes: attr
        };

        var params = {
            taskToken: taskToken,
            decisions: [decision]
        };

        this.swf.client.respondDecisionTaskCompleted(params, function (err, data) {
            callback(err, data);
        });
    };

    SwfDataAccess.prototype.respondActivityTaskCanceled = function (params, callback) {
        this.swf.client.respondActivityTaskCanceled(params, function (err, data) {
            callback(err, data);
        });
    };

    SwfDataAccess.prototype.respondActivityTaskCompleted = function (taskToken, data, callback) {
        var params = {
            taskToken: taskToken,
            result: data
        };

        this.swf.client.respondActivityTaskCompleted(params, function (err, data) {
            callback(err, data);
        });
    };

    SwfDataAccess.prototype.respondActivityTaskFailed = function (taskToken, errMessage, callback) {
        var failedParams = {
            taskToken: taskToken,
            reason: errMessage
        };

        this.swf.respondActivityTaskFailed(failedParams, function (err, data) {
            exports.debug.log("ERR:respondActivityTaskFailed ", err);
        });
    };

    SwfDataAccess.prototype.pollForDecisionTask = function (domain, taskList, callback) {
        var request = {
            domain: domain,
            taskList: { name: taskList }
        };

        this.swf.client.pollForDecisionTask(request, function (error, data) {
            callback(error, data);
        });
    };

    SwfDataAccess.prototype.pollForActivityTask = function (domain, taskList, callback) {
        var request = {
            domain: domain,
            taskList: { name: taskList }
        };

        this.swf.client.pollForActivityTask(request, function (error, data) {
            callback(error, data);
        });
    };

    SwfDataAccess.prototype.startWorkflowExecution = function (request, callback) {
        this.swf.client.startWorkflowExecution(request, function (error, data) {
            exports.monitor.log("[Workflow] starting", request.domain);

            if (error == null) {
            } else {
                exports.debug.log("startWorkflowExecution - error:", error);
                callback(error);
            }
        });
    };
    return SwfDataAccess;
})();
exports.SwfDataAccess = SwfDataAccess;
