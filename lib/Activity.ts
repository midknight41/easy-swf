/// <reference path="imports.d.ts" />

import AWS = require("aws-sdk");
import dal = require("./SwfDataAccess");
import interfaces = require("./Interfaces");
import utils = require("./Utils");

export class ActivityHost {

    public activityRegister: interfaces.IActivityRegister;
    public taskList: string;
    private domain: string;
    //private swf: AWS.SimpleWorkflow;
    private activities = [];
    private swf: dal.ISwfDataAccess;

    constructor(register: interfaces.IActivityRegister, domain: string, taskList: string, swf: dal.ISwfDataAccess) {

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
    
    //should I report back anything via this callback...heartbeat perhaps?
    public listen(callback?: (err, data) => void ) {
        this.BeginActivityPolling();
    }

    private BeginActivityPolling() {

        var me = this;

        me.doActivityPoll(me, me.domain, me.taskList);

    }
    
    private doActivityPoll(me: ActivityHost, domain: string, taskList: string) {

        utils.monitor.log("[Activity] looking for activities");
        
        me.swf.pollForActivityTask(domain, taskList, function (error, data) {
            utils.monitor.log("[Activity] polling response");

            if (error != null) {
                utils.debug.log("pollForActivityTask Error:", error);
                return;
                //emit error
            }

            if (data != null && data.startedEventId > 0) {
                var token = data.taskToken;
                var activity = me.getActivityContainer(data.activityType.name, data.activityType.version);
                
                utils.monitor.log("[Activity] executing", data.activityType.name);
                activity.activityCode(null, data.input, function (err?, data2?) {
                    me.proceedAfterActivity(token, err, data2);
                });

            }

            me.doActivityPoll(me, domain, taskList);
            
        });

    }

    private proceedAfterActivity(taskToken: string, err?: Error, data?) {
        if (err == null) {

            this.swf.respondActivityTaskCompleted(taskToken, data, function (err, data) {
              if (err != null) utils.debug.log("ERR:respondActivityTaskCompleted", err);
            });

        } else {

            utils.monitor.log("[Activity] sending error:", err.message);
            
            this.swf.respondActivityTaskFailed(taskToken, err.message, function (err, data) {
                if (err != null) utils.debug.log("ERR:respondActivityTaskFailed", err);

            });
        }
    }

}


export class ActivityCallbackContainer implements interfaces.IActivityDescriptor {

    public name: string;
    public version: string;
    public taskList: string;
    public reference: string;
    public activityCode: (err: any, input: string, callback: (err: Error, data: any) => void) => void;
}

export class Activity implements interfaces.IActivity {
    public reference: string;
    public name: string;
    public version: string;
    public taskList: string;
    public result: string;
    public input: string;
    public hasStarted: boolean = false;
    public hasCompleted: boolean = false;
    public hasBeenScheduled: boolean = false;
    public hasFailed: boolean = false;
    public hasTimedOut: boolean = false;

}

export class ActivityAdapter {
    constructor(desc: interfaces.IActivityDescriptor) {
        this.desc = desc;
    }

    private desc: interfaces.IActivityDescriptor;

    public fill(): Activity {
        var activity = new Activity();

        activity.name = this.desc.name;
        activity.version = this.desc.version;
        activity.taskList = this.desc.taskList;
        activity.reference = this.desc.reference;

        return activity;

    }
}
