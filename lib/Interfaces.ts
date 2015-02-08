export interface IWorkflowItem {
  name: string;
  version: string;
  taskList: string;
  reference: string;
  code?: any;
}

export interface IActivityState extends IWorkflowItem {
  workflowId?: string;
  input?: string;
}

export interface IActivity extends IWorkflowItem {
  workflowId?: string;
  result?: string;
  input?: string;
  hasStarted?: boolean;
  hasCompleted?: boolean;
  hasBeenScheduled?: boolean;
  hasFailed?: boolean;
  hasTimedOut?: boolean;
}

export interface IActivityRegister {
  getActivityByRef(reference: string): IActivity;
  getActivity(name: string, version: string): IActivity;
  registerActivity(name: string, version: string, taskList: string): IActivity
}

export interface IWorkflowItemRegister {
  addItem(reference: string, name: string, version: string, taskList: string, callback: (context: IDecisionContext) => void);
  getItem(name: string, version: string): IWorkflowItem;
  getItemByRef(reference: string): IWorkflowItem;
}

export interface IWorkflowExecutionData {
  name: string;
  version: string;
  input: string;
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

export interface IDecisionContext {

  doActivity(activity: IActivity, data?: string);
  getFunction(name: string, version: string): Function;
  completeWorkflow();
  failWorkflow(err: Error);
  doNothing();
  lastActivity(): IActivity;
  //doActivityByName(activityName: string, version: string, taskList: string, data?: string);
  //getMatchingActivities(reference: string): IActivity[];
  //getActivityState(name: string, version: string): IActivity;

}