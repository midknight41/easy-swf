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
        var me = this;
        this.swf.respondDecisionTaskCompleted(params, function (err, data) {
            retryOnNetworkError(err, data, function retry() {
                me.respondScheduleActivityTask(taskToken, decisions, callback);
            }, function proceed(err2, data2) {
                callback(err2, data2);
            });
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
        var me = this;
        this.swf.respondDecisionTaskCompleted(params, function (err, data) {
            retryOnNetworkError(err, data, function retry() {
                me.respondRecordMarker(taskToken, callback);
            }, function proceed(err2, data2) {
                callback(err2, data2);
            });
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
        var me = this;
        this.swf.respondDecisionTaskCompleted(params, function (err, data) {
            retryOnNetworkError(err, data, function retry() {
                me.respondCompleteWorkflowExecution(taskToken, callback);
            }, function proceed(err2, data2) {
                callback(err2, data2);
            });
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
        var me = this;
        this.swf.respondDecisionTaskCompleted(params, function (err, data) {
            retryOnNetworkError(err, data, function retry() {
                me.respondFailWorkflowExecution(taskToken, reason, detail, callback);
            }, function proceed(err2, data2) {
                callback(err2, data2);
            });
        });
    };
    SwfDataAccess.prototype.respondActivityTaskCanceled = function (params, callback) {
        this.swf.respondActivityTaskCanceled(params, function (err, data) {
            callback(err, data);
        });
    };
    SwfDataAccess.prototype.respondActivityTaskCompleted = function (taskToken, result, callback) {
        var params = {
            taskToken: taskToken,
            result: result
        };
        var me = this;
        this.swf.respondActivityTaskCompleted(params, function (err, data) {
            retryOnNetworkError(err, data, function retry() {
                me.respondActivityTaskCompleted(taskToken, result, callback);
            }, function proceed(err2, data2) {
                callback(err2, data2);
            });
        });
    };
    SwfDataAccess.prototype.respondActivityTaskFailed = function (taskToken, errMessage, callback) {
        var failedParams = {
            taskToken: taskToken,
            reason: errMessage
        };
        var me = this;
        this.swf.respondActivityTaskFailed(failedParams, function (error, data) {
            retryOnNetworkError(error, data, function retry() {
                me.respondActivityTaskFailed(taskToken, errMessage, callback);
            }, function proceed(err2, data2) {
                callback(err2, data2);
            });
        });
    };
    SwfDataAccess.prototype.pollForDecisionTask = function (domain, taskList, callback) {
        var request = {
            domain: domain,
            taskList: { name: taskList }
        };
        var me = this;
        this.swf.pollForDecisionTask(request, function (error, data) {
            retryOnNetworkError(error, data, function retry() {
                me.pollForDecisionTask(domain, taskList, callback);
            }, function proceed(err2, data2) {
                callback(err2, data2);
            });
        });
    };
    SwfDataAccess.prototype.pollForActivityTask = function (domain, taskList, callback) {
        var request = {
            domain: domain,
            taskList: { name: taskList }
        };
        var me = this;
        this.swf.pollForActivityTask(request, function (error, data) {
            retryOnNetworkError(error, data, function retry() {
                me.pollForActivityTask(domain, taskList, callback);
            }, function proceed(err2, data2) {
                callback(err2, data2);
            });
        });
    };
    SwfDataAccess.prototype.startWorkflowExecution = function (request, callback) {
        var me = this;
        this.swf.startWorkflowExecution(request, function (error, data) {
            retryOnNetworkError(error, data, function retry() {
                me.startWorkflowExecution(request, callback);
            }, function proceed(err2, data2) {
                callback(err2);
            });
        });
    };
    return SwfDataAccess;
})();
exports.SwfDataAccess = SwfDataAccess;
function retryOnNetworkError(error, data, retry, proceed) {
    if (error != null) {
        if (error.name == "NetworkingError") {
            console.log("[easy-swf] networking error. Will retry in 30 seconds...");
            setTimeout(function () {
                retry();
            }, 30000);
            return;
        }
    }
    proceed(error, data);
}
//# sourceMappingURL=SwfDataAccess.js.map