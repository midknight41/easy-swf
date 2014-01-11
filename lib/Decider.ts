/// <reference path="imports.d.ts" />

import AWS = require("aws-sdk");
import DataAccess = require("./SwfDataAccess");
import uuid = require("uuid");
import a = require("./Activity");
import e = require("./EventParser");
import interfaces = require("./Interfaces");
import wrapper = require("./FunctionWrapper");

export class DecisionHost {
  private swf: DataAccess.ISwfDataAccess;
  private activityRegister: interfaces.IActivityRegister;
  public taskList: string;
  private domain: string;
  private decisionLogic;
  private eventParser: e.EventParser;

  constructor(register: interfaces.IActivityRegister, domain: string, taskList: string, swf: DataAccess.ISwfDataAccess, eventParser: e.EventParser) {

    this.domain = domain;
    this.activityRegister = register;
    this.taskList = taskList;
    this.swf = swf;
    this.eventParser = eventParser;
  }

  public listen(decisionLogic: (err, context: DecisionContext) => void) {
    this.decisionLogic = decisionLogic;

    this.BeginDecisionPolling();

  }

  private BeginDecisionPolling() {

    var me = this;


    me.doDecisionPoll(me, me.domain, me.taskList);

  }

  private doDecisionPoll(me: DecisionHost, domain: string, taskList: string) {

    console.log("[Decider] looking for decisions");

    me.swf.pollForDecisionTask(domain, taskList, function (error, data) {
      console.log("[Decider] polling response");

      if (error != null) {
        console.log("doDecisionPoll error:", error);
        return;
      }

      if (data != null && data.startedEventId > 0) {

        console.log("[Decider] a decision is required!");
        var context = new DecisionContext(me.taskList, me.activityRegister, me.eventParser, me.swf, data);

        me.decisionLogic(error, context);
      }

      me.doDecisionPoll(me, domain, taskList);
    });

  }

}

export class DecisionContext implements interfaces.IDecisionContext {

  public state: AWS.Swf.DecisionTask;
  private swf: DataAccess.ISwfDataAccess;
  private taskToken: string;
  public activities: interfaces.IActivity[] = [];
  private decisions: AWS.Swf.Decision[] = [];
  private submissionRegistered: boolean = false;
  private activityRegister: interfaces.IActivityRegister;

  constructor(taskList: string, register: interfaces.IActivityRegister, eventParser: e.EventParser, swf: DataAccess.ISwfDataAccess, state: AWS.Swf.DecisionTask) {

    this.activityRegister = register;
    this.swf = swf;
    this.state = state;
    this.taskToken = this.state.taskToken;
    this.activities = eventParser.extractActivities(state.events);
  }

  public lastActivity(): interfaces.IActivity {

    if (this.activities == null) return null;

    if (this.activities.length < 0) {
      return null;
    } else {
      return this.activities[this.activities.length - 1];
    }
  }

  public failWorkflow(err: Error) {

    this.swf.respondFailWorkflowExecution(this.taskToken, err.message, err.message, function (err, data) {
      console.log("[Decider] failed Workflow");
      if (err != null) { console.log("ERROR", err); }

    });
  }

  public allDone() {
    //finish workflow execution

    this.swf.respondCompleteWorkflowExecution(this.taskToken, function (err, data) {
      console.log("[Decider] completed Workflow");
      if (err != null) { console.log("ERROR", err); }
    });
  }


  private getFirstActivity(activityName: string, version: string): interfaces.IActivity {
    var activity = this.activities.filter(function (item, index, array) {

      return (item.name == activityName && item.version == version);
    });

    if (activity.length > 0) { return (activity[0]); }
    return null;
  }

  public getMatchingActivities(reference: string): interfaces.IActivity[] {

    var activityDefn = this.activityRegister.getActivityDescriptorByRef(reference);

    var activities = this.activities.filter(function (item, index, array) {

      return (item.name == activityDefn.name && item.version == activityDefn.version);
    });

    return (activities);
  }


  //Need to add some interfaces to support swapping this object out
  public getActivityState(reference: string): interfaces.IActivity {

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
  }

  public getFunction(activityRef: string) : any {

    var me = this;
    var activity = this.activityRegister.getActivityByRef(activityRef);
    return new wrapper.FunctionWrapper(activity, me).getFunction();
  }

  public doActivity(activity: interfaces.IActivity, data?: string) {

    this.doActivityByName(activity.name, activity.version, activity.taskList, data);
  }

  public doNothing() {

    console.log("[Decider] take no action");

    this.swf.respondRecordMarker(this.taskToken, function (err, data) {
      if (err != null) { console.log("[Decider] ERROR: doNothing", err); }

    });

  }

  public doActivityByName(activityName: string, version: string, taskList: string, data?: string) {
    //a decision has been made to do an activity
    //inform swf what is to be done

    console.log("[Decider] scheduling activity", activityName);

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

    var me = this;

    me.decisions.push(decision);

    process.nextTick(function () {


      if (me.submissionRegistered == false) {

        console.log("[Decider] submitting decisions");

        me.submissionRegistered = true;

        me.swf.respondScheduleActivityTask(me.taskToken, me.decisions, function (err, data) {
          if (err != null) { console.log("[Decider] ERROR: respondDecisionTaskCompleted", err); }

        });

      }

    });

  }

}



