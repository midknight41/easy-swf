/// <reference path="imports.d.ts" />
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
        var container = new ActivityCallbackContainer();

        var activity = this.activityRegister.getActivityDescriptorByRef(reference);

        if (activity == null) {
            throw new Error("A handler cannot be set up for activity '" + reference + "' as it is not in the workflow configuration.");
        }

        container.reference = activity.reference;
        container.activityCode = activityCode;
        container.name = activity.name;
        container.taskList = activity.taskList;
        container.version = activity.version;

        this.activities.push(container);
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

    ActivityHost.prototype.listen = function (feedbackHandler) {
        if (feedbackHandler != null)
            this.feedbackHandler = feedbackHandler;
        else
            this.feedbackHandler = function (err, message) {
            };

        this.BeginActivityPolling();
    };

    ActivityHost.prototype.stop = function () {
        this.feedbackHandler(null, "[Activity] stopped polling");
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
            me.feedbackHandler(null, "[Activity] polling response");

            if (error != null) {
                me.feedbackHandler(error, "pollForActivityTask Error:");
                return;
                //emit error
            }

            if (data != null && data.startedEventId > 0) {
                var token = data.taskToken;
                var activity = me.getActivityContainer(data.activityType.name, data.activityType.version);

                if (activity == null) {
                    me.feedbackHandler(new Error("There is no activity handler associated with this activity."), "[Activity] executing " + data.activityType.name);
                } else {
                    me.feedbackHandler(null, "[Activity] executing " + data.activityType.name);
                    activity.activityCode(null, data.input, function (err, data2) {
                        me.proceedAfterActivity(token, err, data2);
                    });
                }
            }
            if (me.continuePolling == true) {
                me.doActivityPoll(me, domain, taskList);
            }
        });
    };

    ActivityHost.prototype.proceedAfterActivity = function (taskToken, err, data) {
        var me = this;

        if (err == null) {
            me.swf.respondActivityTaskCompleted(taskToken, data, function (err, data) {
                if (err != null)
                    me.feedbackHandler(err, "ERR:respondActivityTaskCompleted");
            });
        } else {
            me.feedbackHandler(err, "[Activity] sending error");

            me.swf.respondActivityTaskFailed(taskToken, err.message, function (err, data) {
                if (err != null)
                    me.feedbackHandler(err, "ERR:respondActivityTaskFailed");
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
