/// <reference path="imports.d.ts" />
var uuid = require("uuid");

var wrapper = require("./FunctionWrapper");
var errors = require("./CustomErrors");

var DecisionHost = (function () {
    function DecisionHost(workflowItemRegister, register, domain, taskList, swf, eventParser) {
        if (workflowItemRegister == null)
            throw new errors.NullArgumentError("workflowItemRegister cannot be null");
        if (register == null)
            throw new errors.NullArgumentError("register cannot be null");
        if (domain == null || domain == "")
            throw new errors.NullArgumentError("domain cannot be a null or empty string");
        if (taskList == null || taskList == "")
            throw new errors.NullArgumentError("taskList cannot be a null or empty string");
        if (swf == null)
            throw new errors.NullArgumentError("swf cannot be null");
        if (eventParser == null)
            throw new errors.NullArgumentError("eventParser cannot be null");

        this.domain = domain;
        this.activityRegister = register;
        this.taskList = taskList;
        this.swf = swf;
        this.eventParser = eventParser;
        this.workflowDeciders = [];
        this.workflowItemRegister = workflowItemRegister;
        this.continuePolling = false;
    }
    DecisionHost.prototype.handleWorkflow = function (workflowType, version, decisionLogic) {
        if (workflowType == null || workflowType.length == 0)
            throw new errors.NullArgumentError("workflowType cannot be a null or empty string");
        if (version == null || version.length == 0)
            throw new errors.NullArgumentError("version cannot be a null or empty string");
        if (decisionLogic == null)
            throw new errors.NullArgumentError("decisionLogic cannot be null");

        var ref = workflowType + "(" + version + ")";

        this.workflowItemRegister.addItem(ref, workflowType, version, this.taskList, decisionLogic);
        //this.decisionLogic = decisionLogic;
    };

    DecisionHost.prototype.listen = function (feedbackHandler) {
        if (feedbackHandler != null)
            this.feedbackHandler = this.createHeartbeatWrapper(feedbackHandler);
        else
            this.feedbackHandler = this.createHeartbeatWrapper(function (err, message, context) {
            });

        this.start();
    };

    DecisionHost.prototype.start = function () {
        var me = this;

        me.lastHeartbeat = Date.now();

        me.heartId = setInterval(function () {
            me.feedbackHandler(null, "[Decider] Heartbeat check", null);
        }, 200000);

        me.BeginDecisionPolling();
    };

    DecisionHost.prototype.createHeartbeatWrapper = function (feedbackHandler) {
        var me = this;

        return function (err, message, context) {
            var check = Date.now();
            var threeMinutes = 180000;

            feedbackHandler(err, message, context);

            if (check - me.lastHeartbeat > threeMinutes) {
                feedbackHandler(null, "[Decider] Heartbeat detected error! Restarting service.", context);

                throw new Error("Heartbeat failed! SWF has become unresponsive.");
            }

            this.lastHeartbeat = check;
        };
    };

    DecisionHost.prototype.stop = function (callback) {
        this.feedbackHandler(null, "[Decider] stopped polling", null);

        if (this.heartId != null) {
            clearInterval(this.heartId);
        }

        this.whenStopped = callback;
        this.continuePolling = false;
    };

    DecisionHost.prototype.BeginDecisionPolling = function () {
        var me = this;

        this.continuePolling = true;
        me.doDecisionPoll(me, me.domain, me.taskList);
    };

    DecisionHost.prototype.doDecisionPoll = function (me, domain, taskList) {
        me.feedbackHandler(null, "[Decider] looking for decisions", null);

        me.swf.pollForDecisionTask(domain, taskList, function (error, data) {
            if (error != null) {
                me.feedbackHandler(error, "[Decider] unexpected polling response error - " + error.message, null);
            }

            me.feedbackHandler(error, "[Decider] polling response", null);

            if (data != null && data.startedEventId > 0) {
                me.feedbackHandler(null, "[Decider] a decision is required!", null);

                var context = new DecisionContext(me.taskList, me.activityRegister, me.eventParser, me.swf, me.feedbackHandler, data);

                var item = me.workflowItemRegister.getItemByRef(context.workflowReference);
                item.code(error, context);
            } else {
                me.feedbackHandler(null, "[Decider] nothing to do", null);
            }

            if (me.continuePolling == true) {
                me.doDecisionPoll(me, domain, taskList);
            } else {
                if (me.whenStopped != null) {
                    me.whenStopped(null);
                }
            }
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

        this.taskList = taskList;
        this.activityRegister = register;
        this.swf = swf;
        this.state = state;
        this.taskToken = this.state.taskToken;
        this.feedbackHandler = feedbackHandler != null ? feedbackHandler : function (err, message) {
        };
        this.activities = eventParser.extractActivities(state.events);
        var data = eventParser.extractWorkflowExecutionData(state.events);

        this.workflowInput = data.input;
        this.workflowReference = data.name + "(" + data.version + ")";
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

        this.swf.respondFailWorkflowExecution(me.taskToken, err.message, err.message, function (err, data) {
            me.feedbackHandler(err, "[Decider] failed Workflow", me);
        });
    };

    DecisionContext.prototype.completeWorkflow = function () {
        //finish workflow execution
        var me = this;

        this.swf.respondCompleteWorkflowExecution(me.taskToken, function (err, data) {
            me.feedbackHandler(err, "[Decider] completed Workflow", me);
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
        var activityDefn = this.activityRegister.getActivityByRef(reference);

        var activities = this.activities.filter(function (item, index, array) {
            return (item.name == activityDefn.name && item.version == activityDefn.version);
        });

        return (activities);
    };

    DecisionContext.prototype.getActivityState = function (name, version) {
        if (name == null)
            throw new errors.NullArgumentError("name");
        if (version == null)
            throw new errors.NullArgumentError("version");

        var reference = name + "(" + version + ")";

        var activityFromConfig = this.activityRegister.getActivity(name, version);

        if (activityFromConfig == null)
            throw new errors.BadConfigError("activity with reference " + reference + " does not exist in config");

        var activity = this.getFirstActivity(name, version);

        if (activity == null) {
            var activityStub = {
                name: name,
                version: version,
                taskList: this.taskList,
                reference: name + "(" + version + ")"
            };

            activity = activityStub;
        }

        activity.reference = reference;

        return activity;
    };

    DecisionContext.prototype.getFunction = function (name, version) {
        var me = this;
        var activity = this.getActivityState(name, version);

        return new wrapper.FunctionWrapper(activity, me).getFunction();
    };

    DecisionContext.prototype.doActivity = function (activity, data) {
        var me = this;
        if (activity == null) {
            this.feedbackHandler(new errors.NullArgumentError("activity cannot be null"), "[Decider] ERROR: doActivity", me);
            return;
        }

        this.doActivityByName(activity.name, activity.version, activity.taskList, data);
    };

    DecisionContext.prototype.doNothing = function () {
        var me = this;
        me.feedbackHandler(null, "[Decider] take no action", me);

        this.swf.respondRecordMarker(this.taskToken, function (err, data) {
            if (err != null) {
                me.feedbackHandler(err, "[Decider] ERROR: doNothing", me);
            }
        });
    };

    DecisionContext.prototype.doActivityByName = function (activityName, version, taskList, data) {
        //a decision has been made to do an activity
        //inform swf what is to be done
        var me = this;
        this.feedbackHandler(null, "[Decider] scheduling activity " + activityName, me);

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

        console.log(decision);

        me.decisions.push(decision);

        process.nextTick(function () {
            if (me.submissionRegistered == false) {
                me.feedbackHandler(null, "[Decider] submitting decisions", me);

                me.submissionRegistered = true;

                me.swf.respondScheduleActivityTask(me.taskToken, me.decisions, function (err, data) {
                    if (err != null) {
                        me.feedbackHandler(err, "[Decider] ERROR: respondDecisionTaskCompleted", me);
                    }
                });
            }
        });
    };
    return DecisionContext;
})();
exports.DecisionContext = DecisionContext;
//# sourceMappingURL=Decider.js.map
