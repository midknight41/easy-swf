/// <reference path="imports.d.ts" />
var uuid = require("uuid");
var a = require("./Activity");

var wrapper = require("./FunctionWrapper");
var errors = require("./CustomErrors");

var DecisionHost = (function () {
    function DecisionHost(register, domain, taskList, swf, eventParser) {
        this.domain = domain;
        this.activityRegister = register;
        this.taskList = taskList;
        this.swf = swf;
        this.eventParser = eventParser;
    }
    DecisionHost.prototype.handleDecision = function (decisionLogic) {
        this.decisionLogic = decisionLogic;
    };

    DecisionHost.prototype.listen = function (feedbackHandler) {
        if (feedbackHandler != null)
            this.feedbackHandler = feedbackHandler;
        else
            this.feedbackHandler = function (err, message) {
            };

        this.BeginDecisionPolling();
    };

    DecisionHost.prototype.BeginDecisionPolling = function () {
        var me = this;

        me.doDecisionPoll(me, me.domain, me.taskList);
    };

    DecisionHost.prototype.doDecisionPoll = function (me, domain, taskList) {
        var me = this;

        me.feedbackHandler(null, "[Decider] looking for decisions");

        me.swf.pollForDecisionTask(domain, taskList, function (error, data) {
            me.feedbackHandler(error, "[Decider] polling response");

            if (data != null && data.startedEventId > 0) {
                me.feedbackHandler(null, "[Decider] a decision is required!");
                var context = new DecisionContext(me.taskList, me.activityRegister, me.eventParser, me.swf, me.feedbackHandler, data);

                me.decisionLogic(error, context);
            }

            me.doDecisionPoll(me, domain, taskList);
        });
    };
    return DecisionHost;
})();
exports.DecisionHost = DecisionHost;

var DecisionContext = (function () {
    function DecisionContext(taskList, register, eventParser, swf, feedbackHandler, state) {
        this.activities = [];
        this.decisions = [];
        this.submissionRegistered = false;
        if (register == null)
            throw new errors.NullArgumentError("register cannot be null");
        if (swf == null)
            throw new errors.NullArgumentError("swf cannot be null");
        if (taskList == null)
            throw new errors.NullArgumentError("taskList cannot be null");
        if (state == null)
            throw new errors.NullArgumentError("state cannot be null");
        if (eventParser == null)
            throw new errors.NullArgumentError("eventParser cannot be null");

        this.activityRegister = register;
        this.swf = swf;
        this.state = state;
        this.taskToken = this.state.taskToken;
        this.feedbackHandler = feedbackHandler != null ? feedbackHandler : function (err, message) {
        };
        this.activities = eventParser.extractActivities(state.events);
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

    //This really should allow the user to supply a reason and a detail message
    DecisionContext.prototype.failWorkflow = function (err) {
        var me = this;

        this.swf.respondFailWorkflowExecution(this.taskToken, err.message, err.message, function (err, data) {
            me.feedbackHandler(err, "[Decider] failed Workflow");
        });
    };

    DecisionContext.prototype.allDone = function () {
        //finish workflow execution
        var me = this;

        this.swf.respondCompleteWorkflowExecution(this.taskToken, function (err, data) {
            me.feedbackHandler(err, "[Decider] completed Workflow");
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

    DecisionContext.prototype.getFunction = function (activityRef) {
        var me = this;
        var activity = this.activityRegister.getActivityByRef(activityRef);
        return new wrapper.FunctionWrapper(activity, me).getFunction();
    };

    DecisionContext.prototype.doActivity = function (activity, data) {
        if (activity == null) {
            this.feedbackHandler(new errors.NullArgumentError("activity cannot be null"), "[Decider] ERROR: doActivity");
            return;
        }

        this.doActivityByName(activity.name, activity.version, activity.taskList, data);
    };

    DecisionContext.prototype.doNothing = function () {
        var me = this;
        me.feedbackHandler(null, "[Decider] take no action");

        this.swf.respondRecordMarker(this.taskToken, function (err, data) {
            if (err != null) {
                me.feedbackHandler(err, "[Decider] ERROR: doNothing");
            }
        });
    };

    DecisionContext.prototype.doActivityByName = function (activityName, version, taskList, data) {
        //a decision has been made to do an activity
        //inform swf what is to be done
        this.feedbackHandler(null, "[Decider] scheduling activity " + activityName);

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
                me.feedbackHandler(null, "[Decider] submitting decisions");

                me.submissionRegistered = true;

                me.swf.respondScheduleActivityTask(me.taskToken, me.decisions, function (err, data) {
                    if (err != null) {
                        me.feedbackHandler(err, "[Decider] ERROR: respondDecisionTaskCompleted");
                    }
                });
            }
        });
    };
    return DecisionContext;
})();
exports.DecisionContext = DecisionContext;
