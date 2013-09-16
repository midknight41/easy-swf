/// <reference path="imports.d.ts" />

import AWS = module("aws-sdk");
import uuid = module("uuid");
import a = module("./Activity");
import e = module("./EventParser");
import simpler = module("./Workflow");

export class DecisionHost{
    private swf: AWS.SimpleWorkflow;
    private activityRegister: simpler.ActivityRegister;
    private taskList: string;
    private domain: string;
    private decisionLogic;
    private eventParser: e.EventParser;

    constructor(register: simpler.ActivityRegister, domain: string, taskList:string, swf: AWS.SimpleWorkflow, eventParser: e.EventParser) {

        this.domain = domain;
        this.activityRegister = register;
        this.taskList = taskList;
        this.swf = swf;
        this.eventParser = eventParser;
    }
    
    public listen(decisionLogic: (err, context: DecisionContext) => void ) {
        this.decisionLogic = decisionLogic;

        this.BeginDecisionPolling();

    }

    private BeginDecisionPolling() {

        var me = this;

        var request = {
            domain: me.domain,
            taskList: { name: me.taskList }
        };


        me.doDecisionPoll(me, request);

    }

    private doDecisionPoll(me: DecisionHost, request) {

        console.log("[Decider] looking for decisions");

        me.swf.client.pollForDecisionTask(request, function (error, data) {
            console.log("[Decider] polling response");

            if (error != null) console.log("ERROR", error);

            if (data != null && data.startedEventId > 0) {
            
                console.log("[Decider] a decision is required!");
                var context = new DecisionContext(me.taskList, me.activityRegister, me.eventParser, me.swf, data);

                me.decisionLogic(error, context);
            } 

            me.doDecisionPoll(me, request);
        });

    }

}

export class DecisionContext {

    public state: AWS.Swf.DecisionTask;
    private swf: AWS.SimpleWorkflow;
    private taskToken: string;
    public activities: a.Activity[] = [];
    private decisions: AWS.Swf.Decision[] = [];
    private submissionRegistered: bool = false;
    private activityRegister: simpler.ActivityRegister;

    constructor(taskList: string, register: simpler.ActivityRegister, eventParser: e.EventParser, swf: AWS.SimpleWorkflow, state: AWS.Swf.DecisionTask) {

        this.activityRegister = register;
        this.swf = swf;
        this.state = state;
        this.taskToken = this.state.taskToken;
        this.parseEventData();
}

    public lastActivity(): a.Activity {

        if (this.activities == null) return null;

        if (this.activities.length < 0) {
            return null;
        } else {
            return this.activities[this.activities.length - 1];
        }
    }

    private parseEventData() {
        var events = this.state.events;
        var activityIndex: number[] = [];

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

    }

    public failWorkflow(err: Error) {

        var attr: AWS.Swf.FailWorkflowExecutionDecisionAttributes = {
            reason:  err.message,
            details: err.message
        };

        var decision: AWS.Swf.Decision = {
            decisionType: "FailWorkflowExecution",
            failWorkflowExecutionDecisionAttributes: attr
        };

        var params: AWS.Swf.RespondDecisionTaskCompletedRequest = {
            taskToken: this.taskToken,
            decisions: [decision]

        };

        this.swf.client.respondDecisionTaskCompleted(params, function (err, data) {
            console.log("[Decider] failed Workflow");
            if (err != null) { console.log("ERROR", err); }

        });
    }

    public allDone() {
        //finish workflow execution

        var decision: AWS.Swf.Decision = {
            decisionType: "CompleteWorkflowExecution"
        };

        var params: AWS.Swf.RespondDecisionTaskCompletedRequest = {
            taskToken: this.taskToken,
            decisions: [decision]

        };

        this.swf.client.respondDecisionTaskCompleted(params, function (err, data) {
            console.log("[Decider] completed Workflow");
            if (err != null) { console.log("ERROR", err); }
        });
    }

    private getFirstActivity(activityName: string, version: string): a.Activity {
        var activity = this.activities.filter(function (item, index, array) {

            return (item.name==activityName && item.version==version) ;
        });

        if (activity.length > 0) { return (activity[0]); }
        return null;
    }

    public getMatchingActivities(reference: string): a.Activity[] {

        var activityDefn = this.activityRegister.getActivityDescriptorByRef(reference);

        var activities = this.activities.filter(function (item, index, array) {

            return (item.name == activityDefn.name && item.version == activityDefn.version);
        });

        return (activities);
    }


    //Need to add some interfaces to support swapping this object out
    public getActivityState(reference: string): a.Activity {

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

    public doActivity(activity: a.Activity, data?: string) {

        this.doActivityByName(activity.name, activity.version, activity.taskList, data);
    }

    public doNothing() {

        console.log("[Decider] take no action");

        var attr: AWS.Swf.RecordMarkerDecisionAttributes = {
            markerName: "NoActionFromThisDecision"
            
        };
                
        var decision: AWS.Swf.Decision = {
            decisionType: "RecordMarker",
            recordMarkerDecisionAttributes: attr
            
        }

        var params: AWS.Swf.RespondDecisionTaskCompletedRequest = {
            taskToken: this.taskToken,
            decisions: [decision]

        };
        
        this.swf.client.respondDecisionTaskCompleted(params, function (err, data) {
            if (err != null) { console.log("[Decider] ERROR: doNothing", err); }

        });
        
    }

    public doActivityByName(activityName: string, version:string, taskList: string,  data?: string) {
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

                var params: AWS.Swf.RespondDecisionTaskCompletedRequest = {
                    taskToken: me.taskToken,
                    decisions: me.decisions

                };

                me.swf.client.respondDecisionTaskCompleted(params, function (err, data) {
                    if (err != null) { console.log("[Decider] ERROR: respondDecisionTaskCompleted", err); }

                });

            }

        });

    }

}



