var Decisions = require("./Decisions");
var wrapper = require("./FunctionWrapper");
var errors = require("./CustomErrors");
var utils = require("./Utils");
var DecisionHost = (function () {
    function DecisionHost(workflowItemRegister, register, domain, taskList, swf, eventParser) {
        if (workflowItemRegister == null)
            throw new errors.NullOrEmptyArgumentError("workflowItemRegister cannot be null");
        if (register == null)
            throw new errors.NullOrEmptyArgumentError("register cannot be null");
        if (domain == null || domain == "")
            throw new errors.NullOrEmptyArgumentError("domain cannot be a null or empty string");
        if (taskList == null || taskList == "")
            throw new errors.NullOrEmptyArgumentError("taskList cannot be a null or empty string");
        if (swf == null)
            throw new errors.NullOrEmptyArgumentError("swf cannot be null");
        if (eventParser == null)
            throw new errors.NullOrEmptyArgumentError("eventParser cannot be null");
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
            throw new errors.NullOrEmptyArgumentError("workflowType cannot be a null or empty string");
        if (version == null || version.length == 0)
            throw new errors.NullOrEmptyArgumentError("version cannot be a null or empty string");
        if (decisionLogic == null)
            throw new errors.NullOrEmptyArgumentError("decisionLogic cannot be null");
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
                var context = new DecisionContext(me.taskList, me.eventParser, me.swf, me.feedbackHandler, data);
                var item = me.workflowItemRegister.getItemByRef(context.workflowReference);
                item.code(context);
            }
            else {
                me.feedbackHandler(null, "[Decider] nothing to do", null);
            }
            if (me.continuePolling == true) {
                me.doDecisionPoll(me, domain, taskList);
            }
            else {
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
    //TODO: this signature should have the handler as last parameter
    function DecisionContext(taskList, eventParser, swf, feedbackHandler, state) {
        this.activities = [];
        this.decisions = [];
        this.submissionRegistered = false;
        if (swf == null)
            throw new errors.NullOrEmptyArgumentError("swf cannot be null");
        if (taskList == null)
            throw new errors.NullOrEmptyArgumentError("taskList cannot be null");
        if (state == null)
            throw new errors.NullOrEmptyArgumentError("state cannot be null");
        if (eventParser == null)
            throw new errors.NullOrEmptyArgumentError("eventParser cannot be null");
        this.taskList = taskList;
        this.swf = swf;
        this.state = state;
        this.taskToken = this.state.taskToken;
        this.feedbackHandler = feedbackHandler != null ? feedbackHandler : function (err, message) {
        };
        this.activities = eventParser.extractActivities(state.events);
        var data = eventParser.extractWorkflowExecutionData(state.events);
        this.workflowInput = data.input;
        this.workflowReference = utils.createReferenceString(data.name, data.version);
    }
    DecisionContext.prototype.lastActivity = function () {
        if (this.activities == null)
            return null;
        if (this.activities.length < 0) {
            return null;
        }
        else {
            return this.activities[this.activities.length - 1];
        }
    };
    //This really should allow the user to supply a reason and a detail message
    DecisionContext.prototype.failWorkflow = function (err) {
        var me = this;
        me.feedbackHandler(null, "[Decider] failed Workflow", me);
        var decision = Decisions.buildFailWorkflowExecution(err.message, err.message);
        me.registerDecision(decision);
        //this.swf.respondFailWorkflowExecution(me.taskToken, err.message, err.message, function (err, data) {
        //  me.feedbackHandler(err, "[Decider] failed Workflow", me);
        //});
    };
    DecisionContext.prototype.completeWorkflow = function () {
        //finish workflow execution
        var me = this;
        me.feedbackHandler(null, "[Decider] completed Workflow", me);
        var decision = Decisions.buildCompleteWorkflowExecution();
        me.registerDecision(decision);
        //this.swf.respondCompleteWorkflowExecution(me.taskToken, function (err, data) {
        //  me.feedbackHandler(err, "[Decider] completed Workflow", me);
        //});
    };
    DecisionContext.prototype.getFunction = function (name, version) {
        var me = this;
        if (name == null || name.length == 0) {
            me.feedbackHandler(new errors.NullOrEmptyArgumentError("name"), "[Decider] ERROR: getFunction", me);
            return null;
        }
        if (version == null || version.length == 0) {
            me.feedbackHandler(new errors.NullOrEmptyArgumentError("version"), "[Decider] ERROR: getFunction", me);
            return null;
        }
        var activity = me.getActivityState(name, version);
        return new wrapper.FunctionWrapper(activity, me).getFunction();
    };
    DecisionContext.prototype.doActivity = function (activity, data) {
        var me = this;
        if (activity == null) {
            me.feedbackHandler(new errors.NullOrEmptyArgumentError("activity cannot be null"), "[Decider] ERROR: doActivity", me);
            return;
        }
        me.doActivityByName(activity.name, activity.version, activity.taskList, data);
    };
    DecisionContext.prototype.doNothing = function () {
        var me = this;
        me.feedbackHandler(null, "[Decider] take no action", me);
        //var decision = Decisions.buildRecordMarker("NoActionFromThisDecision");
        me.registerDecision();
        //this.swf.submitDecisions(me.decisions);
        //this.swf.respondRecordMarker(this.taskToken, function (err, data) {
        //  if (err != null) { me.feedbackHandler(err, "[Decider] ERROR: doNothing", me); }
        //});
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
    DecisionContext.prototype.getActivityState = function (name, version) {
        var reference = utils.createReferenceString(name, version);
        var activity = this.getFirstActivity(name, version);
        if (activity == null) {
            var activityStub = {
                name: name,
                version: version,
                taskList: this.taskList,
                reference: reference
            };
            activity = activityStub;
        }
        activity.reference = reference;
        return activity;
    };
    DecisionContext.prototype.doActivityByName = function (activityName, version, taskList, data) {
        //a decision has been made to do an activity
        //inform swf what is to be done
        var me = this;
        this.feedbackHandler(null, "[Decider] scheduling activity " + activityName, me);
        if (data == null)
            data = "";
        //var decision: AWS.Swf.Decision = {
        //  decisionType: "ScheduleActivityTask",
        //  scheduleActivityTaskDecisionAttributes: {
        //    activityId: uuid.v4(),
        //    input: data,
        //    activityType:
        //    {
        //      name: activityName,
        //      version: version
        //    },
        //    taskList: { name: taskList }
        //  }
        //};
        var decision = Decisions.buildScheduleActivityTask(data, activityName, version, taskList);
        me.registerDecision(decision);
    };
    DecisionContext.prototype.registerDecision = function (decision) {
        var me = this;
        if (decision)
            me.decisions.push(decision);
        if (me.submissionRegistered == false) {
            me.submissionRegistered = true;
            process.nextTick(function () {
                me.feedbackHandler(null, "[Decider] submitting decisions", me);
                if (me.decisions == null)
                    me.decisions = [];
                me.swf.respondScheduleActivityTask(me.taskToken, me.decisions, function (err, data) {
                    if (err != null) {
                        me.feedbackHandler(err, "[Decider] ERROR: respondDecisionTaskCompleted", me);
                    }
                });
            });
        }
    };
    return DecisionContext;
})();
exports.DecisionContext = DecisionContext;
//# sourceMappingURL=Decider.js.map