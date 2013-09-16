
var uuid = require("uuid");
var a = require("./Activity");



var DecisionHost = (function () {
    function DecisionHost(register, domain, taskList, swf, eventParser) {
        this.domain = domain;
        this.activityRegister = register;
        this.taskList = taskList;
        this.swf = swf;
        this.eventParser = eventParser;
    }
    DecisionHost.prototype.listen = function (decisionLogic) {
        this.decisionLogic = decisionLogic;

        this.BeginDecisionPolling();
    };

    DecisionHost.prototype.BeginDecisionPolling = function () {
        var me = this;

        var request = {
            domain: me.domain,
            taskList: { name: me.taskList }
        };

        me.doDecisionPoll(me, request);
    };

    DecisionHost.prototype.doDecisionPoll = function (me, request) {
        console.log("[Decider] looking for decisions");

        me.swf.client.pollForDecisionTask(request, function (error, data) {
            console.log("[Decider] polling response");

            if (error != null)
                console.log("ERROR", error);

            if (data != null && data.startedEventId > 0) {
                console.log("[Decider] a decision is required!");
                var context = new DecisionContext(me.taskList, me.activityRegister, me.eventParser, me.swf, data);

                me.decisionLogic(error, context);
            }

            me.doDecisionPoll(me, request);
        });
    };
    return DecisionHost;
})();
exports.DecisionHost = DecisionHost;

var DecisionContext = (function () {
    function DecisionContext(taskList, register, eventParser, swf, state) {
        this.activities = [];
        this.decisions = [];
        this.submissionRegistered = false;
        this.activityRegister = register;
        this.swf = swf;
        this.state = state;
        this.taskToken = this.state.taskToken;
        this.parseEventData();
    }
    DecisionContext.prototype.lastActivity = function () {
        if (this.activities == null)
            return null;

        if (this.activities.length < 0) {
            return null;
        } else {
            return this.activities[this.activities.length - 1];
        }
    };

    DecisionContext.prototype.parseEventData = function () {
        var events = this.state.events;
        var activityIndex = [];

        //find all activity related events
        var me = this;

        events.forEach(function (item, index, array) {
            if (item.eventType == "ActivityTaskScheduled") {
                var activity = new a.Activity();

                activity.name = item.activityTaskScheduledEventAttributes.activityType.name;
                activity.version = item.activityTaskScheduledEventAttributes.activityType.version;
                activity.taskList = item.activityTaskScheduledEventAttributes.taskList.name;
                activity.input = item.activityTaskScheduledEventAttributes.input;
                activity.hasBeenScheduled = true;

                me.activities.push(activity);
                activityIndex.push(index + 1);
            }

            if (item.eventType == "ActivityTaskCompleted") {
                var sid = item.activityTaskCompletedEventAttributes.scheduledEventId;
                var activity = me.activities[activityIndex.indexOf(sid)];

                activity.result = item.activityTaskCompletedEventAttributes.result;
                activity.hasCompleted = true;

                me.activities[activityIndex.indexOf(sid)] = activity;
            }

            if (item.eventType == "ActivityTaskStarted") {
                var sid = item.activityTaskStartedEventAttributes.scheduledEventId;
                me.activities[activityIndex.indexOf(sid)].hasStarted = true;
            }

            if (item.eventType == "ActivityTaskFailed") {
                var sid = item.activityTaskFailedEventAttributes.scheduledEventId;
                me.activities[activityIndex.indexOf(sid)].hasFailed = true;
            }

            if (item.eventType == "ActivityTaskTimedOut") {
                var sid = item.activityTaskTimedOutEventAttributes.scheduledEventId;
                me.activities[activityIndex.indexOf(sid)].hasTimedOut = true;
            }
        });
    };

    DecisionContext.prototype.failWorkflow = function (err) {
        var attr = {
            reason: err.message,
            details: err.message
        };

        var decision = {
            decisionType: "FailWorkflowExecution",
            failWorkflowExecutionDecisionAttributes: attr
        };

        var params = {
            taskToken: this.taskToken,
            decisions: [decision]
        };

        this.swf.client.respondDecisionTaskCompleted(params, function (err, data) {
            console.log("[Decider] failed Workflow");
            if (err != null) {
                console.log("ERROR", err);
            }
        });
    };

    DecisionContext.prototype.allDone = function () {
        //finish workflow execution
        var decision = {
            decisionType: "CompleteWorkflowExecution"
        };

        var params = {
            taskToken: this.taskToken,
            decisions: [decision]
        };

        this.swf.client.respondDecisionTaskCompleted(params, function (err, data) {
            console.log("[Decider] completed Workflow");
            if (err != null) {
                console.log("ERROR", err);
            }
        });
    };

    DecisionContext.prototype.getFirstActivity = function (activityName, version) {
        var activity = this.activities.filter(function (item, index, array) {
            return (item.name == activityName && item.version == version);
        });

        if (activity.length > 0) {
            return (activity[0]);
        }
        return null;
    };

    DecisionContext.prototype.getMatchingActivities = function (reference) {
        var activityDefn = this.activityRegister.getActivityDescriptorByRef(reference);

        var activities = this.activities.filter(function (item, index, array) {
            return (item.name == activityDefn.name && item.version == activityDefn.version);
        });

        return (activities);
    };

    //Need to add some interfaces to support swapping this object out
    DecisionContext.prototype.getActivityState = function (reference) {
        var activityDesc = this.activityRegister.getActivityDescriptorByRef(reference);

        var activity = this.getFirstActivity(activityDesc.name, activityDesc.version);

        if (activity == null) {
            var adapter = new a.ActivityAdapter(activityDesc);
            activity = adapter.fill();

            //no activity has been found in the event data. Look up details in the config instead
            return activity;
        }

        activity.reference = reference;

        return activity;
    };

    DecisionContext.prototype.doActivity = function (activity, data) {
        this.doActivityByName(activity.name, activity.version, activity.taskList, data);
    };

    DecisionContext.prototype.doNothing = function () {
        console.log("[Decider] take no action");

        var attr = {
            markerName: "NoActionFromThisDecision"
        };

        var decision = {
            decisionType: "RecordMarker",
            recordMarkerDecisionAttributes: attr
        };

        var params = {
            taskToken: this.taskToken,
            decisions: [decision]
        };

        this.swf.client.respondDecisionTaskCompleted(params, function (err, data) {
            if (err != null) {
                console.log("[Decider] ERROR: doNothing", err);
            }
        });
    };

    DecisionContext.prototype.doActivityByName = function (activityName, version, taskList, data) {
        //a decision has been made to do an activity
        //inform swf what is to be done
        console.log("[Decider] scheduling activity", activityName);

        if (data == null)
            data = "";

        var decision = {
            decisionType: "ScheduleActivityTask",
            scheduleActivityTaskDecisionAttributes: {
                activityId: uuid.v4(),
                input: data,
                activityType: {
                    name: activityName,
                    version: version
                },
                taskList: { name: taskList }
            }
        };

        var me = this;

        me.decisions.push(decision);

        process.nextTick(function () {
            if (me.submissionRegistered == false) {
                console.log("[Decider] submitting decisions");

                me.submissionRegistered = true;

                var params = {
                    taskToken: me.taskToken,
                    decisions: me.decisions
                };

                me.swf.client.respondDecisionTaskCompleted(params, function (err, data) {
                    if (err != null) {
                        console.log("[Decider] ERROR: respondDecisionTaskCompleted", err);
                    }
                });
            }
        });
    };
    return DecisionContext;
})();
exports.DecisionContext = DecisionContext;

//@ sourceMappingURL=Decider.js.map
