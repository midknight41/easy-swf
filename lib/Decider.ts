import AWS = require("aws-sdk");
import DataAccess = require("./SwfDataAccess");
import uuid = require("uuid");
import a = require("./Activity");
import e = require("./EventParser");
import interfaces = require("./Interfaces");
import wrapper = require("./FunctionWrapper");
import errors = require("./CustomErrors");
import utils = require("./Utils");

export class DecisionHost {
  private swf: DataAccess.ISwfDataAccess;
  private activityRegister: interfaces.IActivityRegister;
  public taskList: string;
  private domain: string;
  //private decisionLogic;
  private workflowDeciders: any[];
  private eventParser: e.EventParser;
  private feedbackHandler: (err: Error, message: string, context: DecisionContext) => void;
  private workflowItemRegister: interfaces.IWorkflowItemRegister;
  private continuePolling: boolean;
  private lastHeartbeat: number;
  private heartId: NodeTimer;
  private whenStopped: (err: Error) => void;

  constructor(workflowItemRegister: interfaces.IWorkflowItemRegister, register: interfaces.IActivityRegister, domain: string, taskList: string, swf: DataAccess.ISwfDataAccess, eventParser: e.EventParser) {

    if (workflowItemRegister == null) throw new errors.NullOrEmptyArgumentError("workflowItemRegister cannot be null");
    if (register == null) throw new errors.NullOrEmptyArgumentError("register cannot be null");
    if (domain == null || domain == "") throw new errors.NullOrEmptyArgumentError("domain cannot be a null or empty string");
    if (taskList == null || taskList == "") throw new errors.NullOrEmptyArgumentError("taskList cannot be a null or empty string");
    if (swf == null) throw new errors.NullOrEmptyArgumentError("swf cannot be null");
    if (eventParser == null) throw new errors.NullOrEmptyArgumentError("eventParser cannot be null");

    this.domain = domain;
    this.activityRegister = register;
    this.taskList = taskList;
    this.swf = swf;
    this.eventParser = eventParser;
    this.workflowDeciders = [];
    this.workflowItemRegister = workflowItemRegister;
    this.continuePolling = false;
  }

  public handleWorkflow(workflowType: string, version: string, decisionLogic: (err, context: DecisionContext) => void) {

    if (workflowType == null || workflowType.length == 0) throw new errors.NullOrEmptyArgumentError("workflowType cannot be a null or empty string");
    if (version == null || version.length == 0) throw new errors.NullOrEmptyArgumentError("version cannot be a null or empty string");
    if (decisionLogic == null) throw new errors.NullOrEmptyArgumentError("decisionLogic cannot be null");


    var ref = workflowType + "(" + version + ")";

    this.workflowItemRegister.addItem(ref, workflowType, version, this.taskList, decisionLogic);
    //this.decisionLogic = decisionLogic;
  }


  public listen(feedbackHandler?: (err: Error, message: string, context: DecisionContext) => void) {

    if (feedbackHandler != null)
      this.feedbackHandler = this.createHeartbeatWrapper(feedbackHandler);
    else
      this.feedbackHandler = this.createHeartbeatWrapper(function (err: Error, message: string, context: DecisionContext) { });

    this.start();
  }

  private start() {

    var me = this;

    me.lastHeartbeat = Date.now();

    me.heartId = setInterval(function () {

      me.feedbackHandler(null, "[Decider] Heartbeat check", null);
    }, 200000);


    me.BeginDecisionPolling();
  }

  private createHeartbeatWrapper(feedbackHandler: (err: Error, message: string, context: DecisionContext) => void): any {

    var me = this;

    return function (err: Error, message: string, context: DecisionContext) {

      var check: number = Date.now();
      var threeMinutes = 180000;

      feedbackHandler(err, message, context);

      if (check - me.lastHeartbeat > threeMinutes) {

        feedbackHandler(null, "[Decider] Heartbeat detected error! Restarting service.", context);

        //me.stop();
        //me.start();

        //Fatal error! Crash and let forever clean up...
        throw new Error("Heartbeat failed! SWF has become unresponsive.");

      }

      this.lastHeartbeat = check;
    };

  }

  public stop(callback?: (err: Error) => void) {
    this.feedbackHandler(null, "[Decider] stopped polling", null);

    if (this.heartId != null) {
      clearInterval(this.heartId);
    }

    this.whenStopped = callback;
    this.continuePolling = false;
  }

  private BeginDecisionPolling() {

    var me = this;

    this.continuePolling = true;
    me.doDecisionPoll(me, me.domain, me.taskList);

  }

  private doDecisionPoll(me: DecisionHost, domain: string, taskList: string) {

    me.feedbackHandler(null, "[Decider] looking for decisions", null);

    me.swf.pollForDecisionTask(domain, taskList, function (error: Error, data) {

      if (error != null) {
        me.feedbackHandler(error, "[Decider] unexpected polling response error - " + error.message, null);
      }

      me.feedbackHandler(error, "[Decider] polling response", null);

      if (data != null && data.startedEventId > 0) {

        me.feedbackHandler(null, "[Decider] a decision is required!", null);

        var context = new DecisionContext(me.taskList, me.eventParser, me.swf, me.feedbackHandler, data);

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

  }

}

export class DecisionContext implements interfaces.IDecisionContext {

  public state: AWS.Swf.DecisionTask;
  private swf: DataAccess.ISwfDataAccess;
  private taskToken: string;
  private taskList: string;
  public activities: interfaces.IActivity[] = [];
  public workflowInput: string;
  public workflowReference: string;
  private decisions: AWS.Swf.Decision[] = [];
  private submissionRegistered: boolean = false;

  //Do we need to pass in the context here? Will bind() suffice?
  private feedbackHandler: (err: Error, message: string, context: DecisionContext) => void;

  //TODO: this signature should have the handler as last parameter
  constructor(taskList: string, eventParser: e.EventParser, swf: DataAccess.ISwfDataAccess, feedbackHandler: (err: Error, message: string, context: DecisionContext) => void, state: AWS.Swf.DecisionTask) {

    if (swf == null) throw new errors.NullOrEmptyArgumentError("swf cannot be null");
    if (taskList == null) throw new errors.NullOrEmptyArgumentError("taskList cannot be null");
    if (state == null) throw new errors.NullOrEmptyArgumentError("state cannot be null");
    if (eventParser == null) throw new errors.NullOrEmptyArgumentError("eventParser cannot be null");

    this.taskList = taskList;
    this.swf = swf;
    this.state = state;
    this.taskToken = this.state.taskToken;
    this.feedbackHandler = feedbackHandler != null ? feedbackHandler : function (err: Error, message: string) { };
    this.activities = eventParser.extractActivities(state.events);
    var data = eventParser.extractWorkflowExecutionData(state.events);


    this.workflowInput = data.input;
    this.workflowReference = utils.createReferenceString(data.name, data.version);
  }

  public lastActivity(): interfaces.IActivity {

    if (this.activities == null) return null;

    if (this.activities.length < 0) {
      return null;
    } else {
      return this.activities[this.activities.length - 1];
    }
  }

  //This really should allow the user to supply a reason and a detail message
  public failWorkflow(err: Error) {
    var me = this;

    this.swf.respondFailWorkflowExecution(me.taskToken, err.message, err.message, function (err, data) {

      me.feedbackHandler(err, "[Decider] failed Workflow", me);

    });
  }

  public completeWorkflow() {
    //finish workflow execution
    var me = this;

    this.swf.respondCompleteWorkflowExecution(me.taskToken, function (err, data) {

      me.feedbackHandler(err, "[Decider] completed Workflow", me);

    });
  }

  public getFunction(name: string, version: string): any {

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

  }

  public doActivity(activity: interfaces.IActivity, data?: string) {

    var me = this;

    if (activity == null) {
      me.feedbackHandler(new errors.NullOrEmptyArgumentError("activity cannot be null"), "[Decider] ERROR: doActivity", me);
      return;
    }

    me.doActivityByName(activity.name, activity.version, activity.taskList, data);
  }

  public doNothing() {

    var me = this;
    me.feedbackHandler(null, "[Decider] take no action", me);

    this.swf.respondRecordMarker(this.taskToken, function (err, data) {
      if (err != null) { me.feedbackHandler(err, "[Decider] ERROR: doNothing", me); }

    });

  }
  
  private getFirstActivity(activityName: string, version: string): interfaces.IActivity {
    var activity = this.activities.filter(function (item, index, array) {

      return (item.name == activityName && item.version == version);
    });

    if (activity.length > 0) { return (activity[0]); }
    return null;
  }

  private getActivityState(name: string, version: string): interfaces.IActivity {

    var reference = utils.createReferenceString(name, version);

    var activity = this.getFirstActivity(name, version);

    if (activity == null) {
      var activityStub: interfaces.IActivity = {
        name: name,
        version: version,
        taskList: this.taskList,
        reference: reference
      };

      activity = activityStub;
    }

    activity.reference = reference;

    return activity;
  }

  private doActivityByName(activityName: string, version: string, taskList: string, data?: string) {
    //a decision has been made to do an activity
    //inform swf what is to be done
    var me = this;
    this.feedbackHandler(null, "[Decider] scheduling activity " + activityName, me);

    if (data == null) data = "";

    var decision: AWS.Swf.Decision = {
      decisionType: "ScheduleActivityTask",
      scheduleActivityTaskDecisionAttributes: {
        activityId: uuid.v4(),
        input: data,
        activityType:
        {
          name: activityName,
          version: version
        },
        taskList: { name: taskList }
      }
    };

    me.decisions.push(decision);

    process.nextTick(function () {


      if (me.submissionRegistered == false) {

        me.feedbackHandler(null, "[Decider] submitting decisions", me);

        me.submissionRegistered = true;

        me.swf.respondScheduleActivityTask(me.taskToken, me.decisions, function (err, data) {
          if (err != null) { me.feedbackHandler(err, "[Decider] ERROR: respondDecisionTaskCompleted", me); }

        });

      }

    });

  }

}



