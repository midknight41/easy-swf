/// <reference path="imports.d.ts" />
var utils = require("./Utils");

var ActivityHost = (function () {
    function ActivityHost(register, domain, taskList, swf) {
        //private swf: AWS.SimpleWorkflow;
        this.activities = [];
        this.domain = domain;
        this.swf = swf;
        this.activityRegister = register;
        this.taskList = taskList;
    }
    ActivityHost.prototype.handleActivity = function (reference, activityCode) {
        //add this activity to a collection for execution later
        var desc = new ActivityCallbackContainer();

        var activity = this.activityRegister.getActivityDescriptorByRef(reference);

        desc.reference = activity.reference;
        desc.activityCode = activityCode;
        desc.name = activity.name;
        desc.taskList = activity.taskList;
        desc.version = activity.version;

        this.activities.push(desc);
    };

    //it's confusing what object we are talking about here: we have two different things we refer to as an activity
    //clean this up!
    ActivityHost.prototype.getActivityContainer = function (activityName, version) {
        var activity = this.activityRegister.getActivityDescriptor(activityName, version);

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

    //should I report back anything via this callback...heartbeat perhaps?
    ActivityHost.prototype.listen = function (callback) {
        this.BeginActivityPolling();
    };

    ActivityHost.prototype.BeginActivityPolling = function () {
        var me = this;

        me.doActivityPoll(me, me.domain, me.taskList);
    };

    ActivityHost.prototype.doActivityPoll = function (me, domain, taskList) {
        utils.monitor.log("[Activity] looking for activities");

        me.swf.pollForActivityTask(domain, taskList, function (error, data) {
            utils.monitor.log("[Activity] polling response");

            if (error != null) {
                utils.debug.log("pollForActivityTask Error:", error);
                return;
                //emit error
            }

            if (data != null && data.startedEventId > 0) {
                var token = data.taskToken;
                var activity = me.getActivityContainer(data.activityType.name, data.activityType.version);

                utils.monitor.log("[Activity] executing", data.activityType.name);
                activity.activityCode(null, data.input, function (err, data2) {
                    me.proceedAfterActivity(token, err, data2);
                });
            }

            me.doActivityPoll(me, domain, taskList);
        });
    };

    ActivityHost.prototype.proceedAfterActivity = function (taskToken, err, data) {
        if (err == null) {
            this.swf.respondActivityTaskCompleted(taskToken, data, function (err, data) {
                if (err != null)
                    utils.debug.log("ERR:respondActivityTaskCompleted", err);
            });
        } else {
            utils.monitor.log("[Activity] sending error:", err.message);

            this.swf.respondActivityTaskFailed(taskToken, err.message, function (err, data) {
                if (err != null)
                    utils.debug.log("ERR:respondActivityTaskFailed", err);
            });
        }
    };
    return ActivityHost;
})();
exports.ActivityHost = ActivityHost;

var ActivityCallbackContainer = (function () {
    function ActivityCallbackContainer() {
    }
    return ActivityCallbackContainer;
})();
exports.ActivityCallbackContainer = ActivityCallbackContainer;

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

var ActivityAdapter = (function () {
    function ActivityAdapter(desc) {
        this.desc = desc;
    }
    ActivityAdapter.prototype.fill = function () {
        var activity = new Activity();

        activity.name = this.desc.name;
        activity.version = this.desc.version;
        activity.taskList = this.desc.taskList;
        activity.reference = this.desc.reference;

        return activity;
    };
    return ActivityAdapter;
})();
exports.ActivityAdapter = ActivityAdapter;
