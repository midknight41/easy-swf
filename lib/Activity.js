/// <reference path="imports.d.ts" />
var ActivityHost = (function () {
    function ActivityHost(register, domain, taskList, swf) {
        this.activities = [];
        this.domain = domain;
        this.swf = swf;
        this.activityRegister = register;
        this.taskList = taskList;
    }
    ActivityHost.prototype.handleActivity = function (name, version, activityCode) {
        var container = new WorkflowCallbackContainer();

        var activity = this.activityRegister.getActivity(name, version);

        if (activity == null) {
            throw new Error("A handler cannot be set up for activity '" + name + "' as it is not in the workflow configuration.");
        }

        container.reference = activity.reference;
        container.code = activityCode;
        container.name = activity.name;
        container.taskList = activity.taskList;
        container.version = activity.version;

        this.activities.push(container);
    };

    ActivityHost.prototype.getActivityContainer = function (activityName, version) {
        var activity = this.activityRegister.getActivity(activityName, version);

        var containers = this.activities.filter(function (item, index, array) {
            if (item.reference == activity.reference)
                return item;
        });

        if (containers.length > 0) {
            return containers[0];
        } else {
            return null;
        }
    };

    ActivityHost.prototype.createHeartbeatWrapper = function (feedbackHandler) {
        var me = this;

        return function (err, message) {
            var check = Date.now();
            var threeMinutes = 180000;

            feedbackHandler(err, message);

            if (check - me.lastHeartbeat > threeMinutes) {
                feedbackHandler(null, "[Activity] Heartbeat detected error! Restarting service.");

                throw new Error("Heartbeat failed! SWF has become unresponsive.");
            }

            this.lastHeartbeat = check;
        };
    };

    ActivityHost.prototype.listen = function (feedbackHandler) {
        if (feedbackHandler != null)
            this.feedbackHandler = this.createHeartbeatWrapper(feedbackHandler);
        else
            this.feedbackHandler = this.createHeartbeatWrapper(function (err, message) {
            });

        this.start();
    };

    ActivityHost.prototype.start = function () {
        var me = this;

        me.lastHeartbeat = Date.now();

        me.heartId = setInterval(function () {
            me.feedbackHandler(null, "[Activity] Heartbeat check");
        }, 200000);

        me.BeginActivityPolling();
    };

    ActivityHost.prototype.stop = function (callback) {
        this.feedbackHandler(null, "[Activity] stopped polling");

        if (this.heartId != null) {
            clearInterval(this.heartId);
        }

        this.whenStopped = callback;
        this.continuePolling = false;
    };

    ActivityHost.prototype.BeginActivityPolling = function () {
        var me = this;
        me.continuePolling = true;
        me.doActivityPoll(me, me.domain, me.taskList);
    };

    ActivityHost.prototype.doActivityPoll = function (me, domain, taskList) {
        me.feedbackHandler(null, "[Activity] looking for activities");

        me.swf.pollForActivityTask(domain, taskList, function (error, data) {
            if (error != null) {
                me.feedbackHandler(error, "[Activity] unexpected polling response error - " + error.message);
            }

            me.feedbackHandler(null, "[Activity] polling response");

            if (data != null && data.startedEventId > 0) {
                var token = data.taskToken;
                var container = me.getActivityContainer(data.activityType.name, data.activityType.version);

                if (container == null) {
                    me.feedbackHandler(new Error("There is no activity handler associated with this activity."), "[Activity] executing " + data.activityType.name);
                } else {
                    me.feedbackHandler(null, "[Activity] executing " + data.activityType.name + " for " + data.workflowExecution.workflowId);

                    var activityState = {
                        workflowId: data.workflowExecution.workflowId,
                        input: data.input,
                        name: container.name,
                        reference: container.reference,
                        version: container.version,
                        taskList: container.taskList
                    };

                    container.code(activityState, data.input, function next(err, result) {
                        me.proceedAfterActivity(data.activityType.name, data.activityType.version, token, err, result);
                    });
                }
            } else {
                me.feedbackHandler(null, "[Activity] nothing to do");
            }

            if (me.continuePolling == true) {
                me.doActivityPoll(me, domain, taskList);
            } else {
                if (me.whenStopped != null) {
                    me.whenStopped(null);
                }
            }
        });
    };

    ActivityHost.prototype.proceedAfterActivity = function (activityName, activityVersion, taskToken, err, data) {
        var me = this;

        data = data == null ? "" : data;

        if (err == null) {
            me.swf.respondActivityTaskCompleted(taskToken, data, function (err1, data1) {
                if (err1 != null) {
                    me.feedbackHandler(err1, "[Activity] error occurred when marking " + activityName + " as complete");
                } else {
                    me.feedbackHandler(null, "[Activity] completed " + activityName);
                }
            });
        } else {
            me.feedbackHandler(err, "[Activity] sending failure");

            me.swf.respondActivityTaskFailed(taskToken, err.message, function (err2, data2) {
                if (err2 != null)
                    me.feedbackHandler(err2, "ERR:respondActivityTaskFailed");
            });
        }
    };
    return ActivityHost;
})();
exports.ActivityHost = ActivityHost;

var WorkflowCallbackContainer = (function () {
    function WorkflowCallbackContainer() {
    }
    return WorkflowCallbackContainer;
})();
exports.WorkflowCallbackContainer = WorkflowCallbackContainer;

var Activity = (function () {
    function Activity() {
        this.hasStarted = false;
        this.hasCompleted = false;
        this.hasBeenScheduled = false;
        this.hasFailed = false;
        this.hasTimedOut = false;
    }
    return Activity;
})();
exports.Activity = Activity;
//# sourceMappingURL=Activity.js.map
