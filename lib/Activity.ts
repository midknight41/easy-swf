/// <reference path="imports.d.ts" />

import AWS = module("aws-sdk");
import simpler = module("./Workflow");

export class ActivityHost {

    public activityRegister: simpler.ActivityRegister;
    public taskList: string;
    private domain: string;
    private swf: AWS.SimpleWorkflow;
    private activities = [];

    constructor(register: simpler.ActivityRegister, domain:string, taskList: string, swf: AWS.SimpleWorkflow) {

        this.domain = domain;
        this.swf = swf;
        this.activityRegister = register;
        this.taskList = taskList;
    }

    public handleActivity(reference: string, activityCode?: any) {
        //add this activity to a collection for execution later
        
        var desc: ActivityCallbackContainer = new ActivityCallbackContainer();

        var activity = this.activityRegister.getActivityDescriptorByRef(reference);

        desc.reference = activity.reference;
        desc.activityCode = activityCode;
        desc.name = activity.name;
        desc.taskList = activity.taskList;
        desc.version = activity.version;

        this.activities.push(desc);
    }

    //it's confusing what object we are talking about here: we have two different things we refer to as an activity
    //clean this up!
    private getActivityContainer(activityName: string, version: string): ActivityCallbackContainer {

        var activity = this.activityRegister.getActivityDescriptor(activityName, version);

        var containers = this.activities.filter(function (item, index, array) {
            if (item.reference == activity.reference) return item;
        });

        if (containers.length > 0) {
            return containers[0];
        } else {
            return null;
        }


    }
    
    public listen(callback?: (err, data) => void ) {
        this.BeginActivityPolling();
    }

    private BeginActivityPolling() {

        var me = this;

        var request = {
            domain: me.domain,
            taskList: { name: me.taskList }
        };

        me.doActivityPoll(me, request);

    }
    
    private doActivityPoll(me: ActivityHost, request) {

        simpler.monitor.log("[Activity] looking for activities");

        me.swf.client.pollForActivityTask(request, function (error, data) {
            simpler.monitor.log("[Activity] polling response");

            if (error != null) {
                simpler.debug.log("ERROR", error);
                //emit error
            }

            if (data != null && data.startedEventId > 0) {
                var token = data.taskToken;
                var activity = me.getActivityContainer(data.activityType.name, data.activityType.version);
                
                simpler.monitor.log("[Activity] executing", data.activityType.name);
                activity.activityCode(null, data.input, function (err?, data2?) {
                    me.proceedAfterActivity(token, err, data2);
                });

            }

            //this recursion is wrong I'm sure. This needs to become more event driven.
            //possibly use setImmediate?
            //process.nextTick(function () {
                me.doActivityPoll(me, request);
            //});
            
        });

    }

    private proceedAfterActivity(taskToken: string, err?: Error, data?) {
        if (err == null) {

            var params: AWS.Swf.RespondActivityTaskCompletedRequest = {
                taskToken: taskToken,
                result: data
            }
            
            this.swf.client.respondActivityTaskCompleted(params, function (err, data) {
            });
        } else {

            console.log("sending error");
            var failedParams: AWS.Swf.RespondActivityTaskFailedRequest = {
                taskToken: taskToken,
                reason: err.message
            }
            
            this.swf.client.respondActivityTaskFailed(failedParams, function (err, data) {
                console.log("ERR", err);

            });
        }
    }

}

export interface IActivityDescriptor {

    name: string;
    version: string;
    taskList: string;
    reference: string;

}

export class ActivityCallbackContainer implements IActivityDescriptor {

    public name: string;
    public version: string;
    public taskList: string;
    public reference: string;
    public activityCode: (err: any, input: string, callback: (err: Error, data: any) => void) => void;
}

export class Activity implements IActivityDescriptor {
    public reference: string;
    public name: string;
    public version: string;
    public taskList: string;
    public result: string;
    public input: string;
    public hasStarted: bool = false;
    public hasCompleted: bool = false;
    public hasBeenScheduled: bool = false;
    public hasFailed: bool = false;
    public hasTimedOut: bool = false;

}

export class ActivityAdapter {
    constructor(desc: IActivityDescriptor) {
        this.desc = desc;
    }

    private desc: IActivityDescriptor;

    public fill(): Activity {
        var activity = new Activity();

        activity.name = this.desc.name;
        activity.version = this.desc.version;
        activity.taskList = this.desc.taskList;
        activity.reference = this.desc.reference;

        return activity;

    }
}
