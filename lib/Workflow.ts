/// <reference path="imports.d.ts" />

export var monitor = console;
export var debug = console;

import uuid = module("uuid");
import AWS = module("aws-sdk");
import a = module("./Activity");
import d = module("./Decider");
import e = module("./EventParser");

export interface IDomainConfig {
    domain: string;
    taskList: string;
}

export interface IOptions extends IDomainConfig {
    reference: string;
    workflowType: string;
    workflowTypeVersion: string;
    taskList: string;
    activities: a.IActivityDescriptor[];
}

export class WorkflowClient {

    private config;
    private swf: AWS.SimpleWorkflow;
    private workflow: IOptions;

    constructor(workflow: IOptions, awsConfig: any) {

        this.config = awsConfig;

        AWS.config.update(this.config);

        this.workflow = workflow;

        //validate options before preceding

        this.swf  = new AWS.SimpleWorkflow();
    }

    createActivityHost(taskList: string): a.ActivityHost {

        var reg = new ActivityRegister(this.workflow);
        var host = new a.ActivityHost(reg, this.workflow.domain, taskList, this.swf);
        
        return host;
    }
    createDeciderHost(taskList: string): d.DecisionHost {

        var eventParser = new e.EventParser();
        var reg = new ActivityRegister(this.workflow);
        var host = new d.DecisionHost(reg, this.workflow.domain, taskList, this.swf, eventParser);

        return host;

    }

    //startWorkflow(name: string, version: string, taskList: string, callback: (err) => void ) {
    startWorkflow(reference: string, callback: (err) => void ) {
                
        var request: AWS.Swf.StartWorkflowExecutionRequest = {
            domain: this.workflow.domain,
            workflowId: uuid.v4(),

            workflowType: {
                name: this.workflow.workflowType,
                version: this.workflow.workflowTypeVersion
            },

            taskList: { name: this.workflow.taskList }

        };

        var me = this;

        me.swf.client.startWorkflowExecution(request, function (error, data) {
            monitor.log("[Workflow] starting", me.workflow.domain);

            if (error == null) {

            } else {
                debug.log("ERROR", error);
                callback(error);
            }
        });


    }
}


export class ActivityRegister {
    private workflow: IOptions;

    constructor(workflow: IOptions) {
        this.workflow = workflow;
    }

    public getActivityDescriptor(name: string, version: string): a.IActivityDescriptor{

        var configEntries = this.workflow.activities.filter(function (item, index, array) {
            if (item.name == name && item.version == version) return true;
        });

        if (configEntries.length > 0) {
            return configEntries[0];

        } else {
            throw new Error("Cannot find activity " + name + ":" + version + " in config");
        }
        
    }

    public getActivityDescriptorByRef(reference: string): a.IActivityDescriptor {

        var configEntries = this.workflow.activities.filter(function (item, index, array) {
            if (item.reference == reference) return true;
        });

        if (configEntries.length > 0) {
            return configEntries[0]
        } else {
            throw new Error("Cannot find activity " + reference + " in config");
        }


    }

}

