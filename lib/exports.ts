
declare module "easy-swf" {

  import AWS = require("aws-sdk");
  
  export class WorkflowClient {
    
    constructor(workflow: IOptions, awsConfig: any, swf?: ISwfDataAccess);

    public createActivityHost(taskList: string): ActivityHost;
    public createDeciderHost(taskList: string): DecisionHost;
    public startWorkflow(name: string, version: string, input: string, callback: (err) => void);
  }

  export interface IDomainConfig {
    domain: string;
    taskList: string;
  }

  export interface IOptions extends IDomainConfig {
    reference?: string;
    workflowType?: string;
    workflowTypeVersion?: string;
    activities?: IActivity[];
  }

  export interface ISwfDataAccess {
    startWorkflowExecution(request: AWS.Swf.StartWorkflowExecutionRequest, callback: (err: Error) => void);
    pollForActivityTask(domain: string, taskList: string, callback: (err: any, data: AWS.Swf.ActivityTask) => void);
    respondActivityTaskCanceled(params: AWS.Swf.RespondActivityTaskCanceledRequest, callback: (err: any, data: any) => void);
    respondActivityTaskCompleted(taskToken: string, data: string, callback: (err: any, data: any) => void);
    respondActivityTaskFailed(taskToken: string, errMessage: string, callback: (err: any, data: any) => void);
    pollForDecisionTask(domain: string, taskList: string, callback: (err: any, data: AWS.Swf.DecisionTask) => void);

    //decision task responses
    respondFailWorkflowExecution(taskToken: string, reason: string, detail: string, callback: (err: any, data: any) => void);
    respondCompleteWorkflowExecution(taskToken: string, callback: (err: any, data: any) => void);
    respondRecordMarker(taskToken: string, callback: (err: any, data: any) => void);
    respondScheduleActivityTask(taskToken: string, decisions: AWS.Swf.Decision[], callback: (err: any, data: any) => void);

  }

  export class EventParser {

    public extractWorkflowInput(events: AWS.Swf.HistoryEvent[]): string;
    public extractWorkflowExecutionData(events: AWS.Swf.HistoryEvent[]): IWorkflowExecutionData;
    public extractActivities(events: AWS.Swf.HistoryEvent[]): IActivity[];
  }

  export interface IWorkflowExecutionData {
    name: string;
    version: string;
    input: string;
  }
  
  export class DecisionHost {
    public taskList: string;

    constructor(workflowItemRegister: IWorkflowItemRegister, register: IActivityRegister, domain: string, taskList: string, swf: ISwfDataAccess, eventParser: EventParser);
    public handleWorkflow(workflowType: string, version: string, decisionLogic: (err, context: DecisionContext) => void);
    public listen(feedbackHandler?: (err: Error, message: string, context: DecisionContext) => void);
    public stop();
  }

  export class DecisionContext implements IDecisionContext {

    public state: AWS.Swf.DecisionTask;
    public activities: IActivity[];
    public workflowInput: string;
    public workflowReference: string;
    
    constructor(taskList: string, register: IActivityRegister, eventParser: EventParser, swf: ISwfDataAccess, feedbackHandler: (err: Error, message: string, context: DecisionContext) => void, state: AWS.Swf.DecisionTask);
    public lastActivity(): IActivity;
    public failWorkflow(err: Error);
    public allDone();
    public getMatchingActivities(reference: string): IActivity[];
    public getActivityState(reference: string): IActivity;
    public getFunction(activityRef: string): any;

    public doNothing();
  }

  export class ActivityHost {

    public taskList: string;

    constructor(register: IActivityRegister, domain: string, taskList: string, swf: ISwfDataAccess);

    public handleActivity(name: string, version: string, activityCode?: any);
    public listen(feedbackHandler?: (err: Error, message: string) => void);
    public stop();

  }

  export interface IDecisionContext {

    lastActivity(): IActivity;
    getMatchingActivities(reference: string): IActivity[];
    getFunction(activityRef: string): any;
    getActivityState(reference: string): IActivity;
    failWorkflow(err: Error);
    allDone();

  }
 
  export interface IActivityRegister {
    getActivityByRef(reference: string): IActivity;
    getActivity(name: string, version: string): IActivity;
  }

  export interface IWorkflowItemRegister {
    addItem(reference: string, name: string, version: string, taskList: string, callback: any);
    getItem(name: string, version: string): IWorkflowItem;
    getItemByRef(reference: string): IWorkflowItem;
  }
 
  export interface IWorkflowItem {
    name: string;
    version: string;
    taskList: string;
    reference: string;
    code?: any;
  }

  export interface IActivity extends IWorkflowItem {
    result?: string;
    input?: string;
    hasStarted?: boolean;
    hasCompleted?: boolean;
    hasBeenScheduled?: boolean;
    hasFailed?: boolean;
    hasTimedOut?: boolean;
  }


}