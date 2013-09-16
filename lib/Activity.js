
var simpler = require("./Workflow");

var ActivityHost = (function () {
    function ActivityHost(register, domain, taskList, swf) {
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

    ActivityHost.prototype.listen = function (callback) {
        this.BeginActivityPolling();
    };

    ActivityHost.prototype.BeginActivityPolling = function () {
        var me = this;

        var request = {
            domain: me.domain,
            taskList: { name: me.taskList }
        };

        me.doActivityPoll(me, request);
    };

    ActivityHost.prototype.doActivityPoll = function (me, request) {
        simpler.monitor.log("[Activity] looking for activities");

        me.swf.client.pollForActivityTask(request, function (error, data) {
            simpler.monitor.log("[Activity] polling response");

            if (error != null) {
                simpler.debug.log("ERROR", error);
            }

            if (data != null && data.startedEventId > 0) {
                var token = data.taskToken;
                var activity = me.getActivityContainer(data.activityType.name, data.activityType.version);

                simpler.monitor.log("[Activity] executing", data.activityType.name);
                activity.activityCode(null, data.input, function (err, data2) {
                    me.proceedAfterActivity(token, err, data2);
                });
            }

            //this recursion is wrong I'm sure. This needs to become more event driven.
            //possibly use setImmediate?
            //process.nextTick(function () {
            me.doActivityPoll(me, request);
        });
    };

    ActivityHost.prototype.proceedAfterActivity = function (taskToken, err, data) {
        if (err == null) {
            var params = {
                taskToken: taskToken,
                result: data
            };

            this.swf.client.respondActivityTaskCompleted(params, function (err, data) {
            });
        } else {
            console.log("sending error");
            var failedParams = {
                taskToken: taskToken,
                reason: err.message
            };

            this.swf.client.respondActivityTaskFailed(failedParams, function (err, data) {
                console.log("ERR", err);
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

//@ sourceMappingURL=Activity.js.map
