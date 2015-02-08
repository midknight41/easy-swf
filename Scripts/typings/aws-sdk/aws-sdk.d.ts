/// <reference path="../node/node.d.ts" />

declare module "aws-sdk" {

  export var config;

  export function Config(json);

  export class Credentials {
    constructor(accessKeyId: string, secretAccessKey: string);
    constructor(accessKeyId: string, secretAccessKey: string, sessionToken: string);

    accessKeyId: string;
  }

  export class Endpoint {
    constructor(endpoint: string);
  }

  export interface Logger {
    write?: (chunk: any, encoding?: string, callback?: () => void) => void;
    log?: (...messages: any[]) => void;
  }

  export interface HttpOptions {
    proxy?: string;
    agent?: any;
    timeout?: number;
    xhrAsync?: boolean;
    xhrWithCredentials?: boolean;
  }

  export interface Services {
    autoscaling?: any;
    cloudformation?: any;
    cloudfront?: any;
    cloudsearch?: any;
    cloudsearchdomain?: any;
    cloudtrail?: any;
    cloudwatch?: any;
    cloudwatchlogs?: any;
    cognitoidentity?: any;
    cognitosync?: any;
    datapipeline?: any;
    directconnect?: any;
    dynamodb?: any;
    ec2?: any;
    elasticache?: any;
    elasticbeanstalk?: any;
    elastictranscoder?: any;
    elb?: any;
    emr?: any;
    glacier?: any;
    httpOptions?: HttpOptions;
    iam?: any;
    importexport?: any;
    kinesis?: any;
    opsworks?: any;
    rds?: any;
    redshift?: any;
    route53?: any;
    route53domains?: any;
    s3?: any;
    ses?: any;
    simpledb?: any;
    sns?: any;
    sqs?: any;
    storagegateway?: any;
    sts?: any;
    support?: any;
    swf?: any;
  }

  export interface ClientConfigPartial extends Services {
    credentials?: Credentials;
    region?: string;
    computeChecksums?: boolean;
    convertResponseTypes?: boolean;
    logger?: Logger;
    maxRedirects?: number;
    maxRetries?: number;
    paramValidation?: boolean;
    s3ForcePathStyle?: boolean;
    apiVersion?: any;
    apiVersions?: Services;
    signatureVersion?: string;
    sslEnabled?: boolean;
    systemClockOffset?: number;
  }

  export interface ClientConfig extends ClientConfigPartial {
    update?: (options: ClientConfigPartial, allUnknownKeys?: boolean) => void;
    getCredentials?: (callback: (err?: any) => void) => void;
    loadFromPath?: (path: string) => void;
    credentials: Credentials;
    region: string;
  }

  export class SQS {
    constructor(options?: any);
    public config: ClientConfig;
    public endpoint: Endpoint;
    public sendMessage(params: Sqs.SendMessageRequest, callback: (err: any, data: Sqs.SendMessageResult) => void);
    public sendMessageBatch(params: Sqs.SendMessageBatchRequest, callback: (err: any, data: Sqs.SendMessageBatchResult) => void);
    public receiveMessage(params: Sqs.ReceiveMessageRequest, callback: (err: any, data: Sqs.ReceiveMessageResult) => void);
    public deleteMessage(params: Sqs.DeleteMessageRequest, callback: (err: any, data: any) => void);
    public deleteMessageBatch(params: Sqs.DeleteMessageBatchRequest, callback: (err: any, data: Sqs.DeleteMessageBatchResult) => void);
    public createQueue(params: Sqs.CreateQueueRequest, callback: (err: any, data: Sqs.CreateQueueResult) => void);
    public deleteQueue(params: Sqs.DeleteQueueRequest, callback: (err: any, data: any) => void);
    public getQueueAttributes(params: Sqs.GetQueueAttributesRequest, callback: (err: any, data: Sqs.GetQueueAttributesResult) => void);
  }

  export class SES {
    constructor(options?: any);
    public config: ClientConfig;
    public endpoint: Endpoint;
    sendEmail(params: any, callback: (err: any, data: Ses.SendEmailResult) => void);
  }

  export class SNS {
    constructor(options?: any);
    public config: ClientConfig;
    public endpoint: Endpoint;
    public publicTopic(params: Sns.PublishRequest, callback: (err: any, data: Sns.PublishResult) => void);
    public createTopic(params: Sns.CreateTopicRequest, callback: (err: any, data: Sns.CreateTopicResult) => void);
    public deleteTopic(params: Sns.DeleteTopicRequest, callback: (err: any, data: any) => void);

  }

  export class SimpleWorkflow {
    constructor(options?: any);
    public config: ClientConfig;
    public endpoint: Endpoint;
    public countClosedWorkflowExecutions(params: any, callback: (err: any, data: any) => void);
    public countOpenWorkflowExecutions(params: any, callback: (err: any, data: any) => void);
    public countPendingActivityTasks(params: any, callback: (err: any, data: any) => void);
    public countPendingDecisionTasks(params: any, callback: (err: any, data: any) => void);
    public deprecateActivityType(params: any, callback: (err: any, data: any) => void);
    public deprecateDomain(params: any, callback: (err: any, data: any) => void);
    public deprecateWorkflowType(params: any, callback: (err: any, data: any) => void);
    public describeActivityType(params: any, callback: (err: any, data: any) => void);
    public describeDomain(params: any, callback: (err: any, data: any) => void);
    public describeWorkflowExecution(params: any, callback: (err: any, data: any) => void);
    public describeWorkflowType(params: any, callback: (err: any, data: any) => void);
    public getWorkflowExecutionHistory(params: any, callback: (err: any, data: any) => void);
    public listActivityTypes(params: any, callback: (err: any, data: any) => void);
    public listClosedWorkflowExecutions(params: any, callback: (err: any, data: any) => void);
    public listDomains(params: any, callback: (err: any, data: any) => void);
    public listOpenWorkflowExecutions(params: any, callback: (err: any, data: any) => void);
    public listWorkflowTypes(params: any, callback: (err: any, data: any) => void);
    public pollForActivityTask(params: any, callback: (err: any, data: Swf.ActivityTask) => void);
    public pollForDecisionTask(params: any, callback: (err: any, data: Swf.DecisionTask) => void);
    public recordActivityTaskHeartbeat(params: any, callback: (err: any, data: any) => void);
    public registerActivityType(params: any, callback: (err: any, data: any) => void);
    public registerDomain(params: any, callback: (err: any, data: any) => void);
    public registerWorkflowType(params: any, callback: (err: any, data: any) => void);
    public requestCancelWorkflowExecution(params: any, callback: (err: any, data: any) => void);
    public respondActivityTaskCanceled(params: Swf.RespondActivityTaskCanceledRequest, callback: (err: any, data: any) => void);
    public respondActivityTaskCompleted(params: Swf.RespondActivityTaskCompletedRequest, callback: (err: any, data: any) => void);
    public respondActivityTaskFailed(params: Swf.RespondActivityTaskFailedRequest, callback: (err: any, data: any) => void);
    public respondDecisionTaskCompleted(params: Swf.RespondDecisionTaskCompletedRequest, callback: (err: any, data: any) => void);
    public signalWorkflowExecution(params: any, callback: (err: any, data: any) => void);
    public startWorkflowExecution(params: any, callback: (err: any, data: Swf.StartWorkflowExecutionResult) => void);
    public terminateWorkflowExecution(params: any, callback: (err: any, data: any) => void);
  }

  export class S3 {
    constructor(options?: any);
    public putObject(params: s3.PutObjectRequest, callback: (err: any, data: any) => void);
    public getObject(params: s3.GetObjectRequest, callback: (err: any, data: any) => void);

  }

  export class DynamoDB {
    constructor(options?: any);
    public config: ClientConfig;
    public endpoint: Endpoint;
    public getItem(params: any, callback: (err: any, data: any) => void);
  }

  module Sqs {

    export interface Client {
      config: ClientConfig;
      endpoint: Endpoint;
      sendMessage(params: SendMessageRequest, callback: (err: any, data: SendMessageResult) => void);
      sendMessageBatch(params: SendMessageBatchRequest, callback: (err: any, data: SendMessageBatchResult) => void);
      receiveMessage(params: ReceiveMessageRequest, callback: (err: any, data: ReceiveMessageResult) => void);
      deleteMessage(params: DeleteMessageRequest, callback: (err: any, data: any) => void);
      deleteMessageBatch(params: DeleteMessageBatchRequest, callback: (err: any, data: DeleteMessageBatchResult) => void);
      createQueue(params: CreateQueueRequest, callback: (err: any, data: CreateQueueResult) => void);
      deleteQueue(params: DeleteQueueRequest, callback: (err: any, data: any) => void);
      getQueueAttributes(params: GetQueueAttributesRequest, callback: (err: any, data: GetQueueAttributesResult) => void);
    }

    export interface SendMessageRequest {
      QueueUrl?: string;
      MessageBody?: string;
      DelaySeconds?: number;
    }

    export interface ReceiveMessageRequest {
      QueueUrl?: string;
      MaxNumberOfMessages?: number;
      VisibilityTimeout?: number;
      AttributeNames?: string[];
    }

    export interface DeleteMessageBatchRequest {
      QueueUrl?: string;
      Entries?: DeleteMessageBatchRequestEntry[];
    }

    export interface DeleteMessageBatchRequestEntry {
      Id: string;
      ReceiptHandle: string;
    }

    export interface DeleteMessageRequest {
      QueueUrl?: string;
      ReceiptHandle?: string;
    }

    export class Attribute {
      Name: string;
      Value: string;
    }

    export interface SendMessageBatchRequest {
      QueueUrl?: string;
      Entries?: SendMessageBatchRequestEntry[];
    }

    export class SendMessageBatchRequestEntry {
      Id: string;
      MessageBody: string;
      DelaySeconds: number;
    }

    export interface CreateQueueRequest {
      QueueName?: string;
      DefaultVisibilityTimeout?: number;
      DelaySeconds?: number;
      Attributes?: {
        DelaySeconds?: number; //0
        MaximumMessageSize?: number; //262144
        MessageRetentionPeriod?: number; //345600
        ReceiveMessageWaitTimeSeconds?: number; //0
        VisibilityTimeout?: number; //30
      }
    }

    export interface DeleteQueueRequest {
      QueueUrl?: string;
    }

    export class SendMessageResult {
      MessageId: string;
      MD5OfMessageBody: string;
    }

    export class ReceiveMessageResult {
      Messages: Message[];
    }

    export class Message {
      MessageId: string;
      ReceiptHandle: string;
      MD5OfBody: string;
      Body: string;
      Attributes: Attribute[];
    }

    export class DeleteMessageBatchResult {
      Successful: DeleteMessageBatchResultEntry[];
      Failed: BatchResultErrorEntry[];
    }

    export class DeleteMessageBatchResultEntry {
      Id: string;
    }

    export class BatchResultErrorEntry {
      Id: string;
      Code: string;
      Message: string;
      SenderFault: string;
    }

    export class SendMessageBatchResult {
      Successful: SendMessageBatchResultEntry[];
      Failed: BatchResultErrorEntry[];
    }

    export class SendMessageBatchResultEntry {
      Id: string;
      MessageId: string;
      MD5OfMessageBody: string;
    }

    export class CreateQueueResult {
      QueueUrl: string;
    }

    export interface GetQueueAttributesRequest {
      QueueUrl: string;
      AttributeNames?: string[];
    }
    export class GetQueueAttributesResult {
      Attributes: any;
    }

  }

  module Ses {

    export interface Client {
      config: ClientConfig;

      sendEmail(params: any, callback: (err: any, data: SendEmailResult) => void);
    }

    export interface SendEmailRequest {
      Source: string;
      Destination: Destination;
      Message: Message;
      ReplyToAddresses: string[];
      ReturnPath: string;
    }

    export class Destination {
      ToAddresses: string[];
      CcAddresses: string[];
      BccAddresses: string[];
    }

    export class Message {
      Subject: Content;
      Body: Body;
    }

    export class Content {
      Data: string;
      Charset: string;
    }

    export class Body {
      Text: Content;
      Html: Content;
    }

    export class SendEmailResult {
      MessageId: string;
    }

  }

  module Swf {

    export class Client {
      //constructor(options?: any);
      public config: ClientConfig;
      countClosedWorkflowExecutions(params: any, callback: (err: any, data: any) => void);
      countOpenWorkflowExecutions(params: any, callback: (err: any, data: any) => void);
      countPendingActivityTasks(params: any, callback: (err: any, data: any) => void);
      countPendingDecisionTasks(params: any, callback: (err: any, data: any) => void);
      deprecateActivityType(params: any, callback: (err: any, data: any) => void);
      deprecateDomain(params: any, callback: (err: any, data: any) => void);
      deprecateWorkflowType(params: any, callback: (err: any, data: any) => void);
      describeActivityType(params: any, callback: (err: any, data: any) => void);
      describeDomain(params: any, callback: (err: any, data: any) => void);
      describeWorkflowExecution(params: any, callback: (err: any, data: any) => void);
      describeWorkflowType(params: any, callback: (err: any, data: any) => void);
      getWorkflowExecutionHistory(params: any, callback: (err: any, data: any) => void);
      listActivityTypes(params: any, callback: (err: any, data: any) => void);
      listClosedWorkflowExecutions(params: any, callback: (err: any, data: any) => void);
      listDomains(params: any, callback: (err: any, data: any) => void);
      listOpenWorkflowExecutions(params: any, callback: (err: any, data: any) => void);
      listWorkflowTypes(params: any, callback: (err: any, data: any) => void);
      pollForActivityTask(params: any, callback: (err: any, data: ActivityTask) => void);
      pollForDecisionTask(params: any, callback: (err: any, data: DecisionTask) => void);
      recordActivityTaskHeartbeat(params: any, callback: (err: any, data: any) => void);
      registerActivityType(params: any, callback: (err: any, data: any) => void);
      registerDomain(params: any, callback: (err: any, data: any) => void);
      registerWorkflowType(params: any, callback: (err: any, data: any) => void);
      requestCancelWorkflowExecution(params: any, callback: (err: any, data: any) => void);
      respondActivityTaskCanceled(params: RespondActivityTaskCanceledRequest, callback: (err: any, data: any) => void);
      respondActivityTaskCompleted(params: RespondActivityTaskCompletedRequest, callback: (err: any, data: any) => void);
      respondActivityTaskFailed(params: RespondActivityTaskFailedRequest, callback: (err: any, data: any) => void);
      respondDecisionTaskCompleted(params: RespondDecisionTaskCompletedRequest, callback: (err: any, data: any) => void);
      signalWorkflowExecution(params: any, callback: (err: any, data: any) => void);
      startWorkflowExecution(params: any, callback: (err: any, data: StartWorkflowExecutionResult) => void);
      terminateWorkflowExecution(params: any, callback: (err: any, data: any) => void);
    }

    export interface PollForActivityTaskRequest {
      domain?: string;
      taskList?: TaskList;
      identity?: string;
    }

    export interface TaskList {
      name?: string;
    }

    export interface PollForDecisionTaskRequest {
      domain?: string;
      taskList?: TaskList;
      identity?: string;
      nextPageToken?: string;
      maximumPageSize?: number;
      reverseOrder?: Boolean;
    }


    export interface StartWorkflowExecutionRequest {
      domain?: string;
      workflowId?: string;
      workflowType?: WorkflowType;
      taskList?: TaskList;
      input?: string;
      executionStartToCloseTimeout?: string;
      tagList?: string[];
      taskStartToCloseTimeout?: string;
      childPolicy?: string;
    }

    export interface WorkflowType {
      name?: string;
      version?: string;
    }


    export interface RespondDecisionTaskCompletedRequest {
      taskToken?: string;
      decisions?: Decision[];
      executionContext?: string;
    }

    export interface Decision {
      decisionType?: string;
      scheduleActivityTaskDecisionAttributes?: ScheduleActivityTaskDecisionAttributes;
      requestCancelActivityTaskDecisionAttributes?: RequestCancelActivityTaskDecisionAttributes;
      completeWorkflowExecutionDecisionAttributes?: CompleteWorkflowExecutionDecisionAttributes;
      failWorkflowExecutionDecisionAttributes?: FailWorkflowExecutionDecisionAttributes;
      cancelWorkflowExecutionDecisionAttributes?: CancelWorkflowExecutionDecisionAttributes;
      continueAsNewWorkflowExecutionDecisionAttributes?: ContinueAsNewWorkflowExecutionDecisionAttributes;
      recordMarkerDecisionAttributes?: RecordMarkerDecisionAttributes;
      startTimerDecisionAttributes?: StartTimerDecisionAttributes;
      cancelTimerDecisionAttributes?: CancelTimerDecisionAttributes;
      signalExternalWorkflowExecutionDecisionAttributes?: SignalExternalWorkflowExecutionDecisionAttributes;
      requestCancelExternalWorkflowExecutionDecisionAttributes?: RequestCancelExternalWorkflowExecutionDecisionAttributes;
      startChildWorkflowExecutionDecisionAttributes?: StartChildWorkflowExecutionDecisionAttributes;
    }

    export interface ScheduleActivityTaskDecisionAttributes {
      activityType?: ActivityType;
      activityId?: string;
      control?: string;
      input?: string;
      scheduleToCloseTimeout?: string;
      taskList?: TaskList;
      scheduleToStartTimeout?: string;
      startToCloseTimeout?: string;
      heartbeatTimeout?: string;
    }

    export interface ActivityType {
      name?: string;
      version?: string;
    }

    export interface RequestCancelActivityTaskDecisionAttributes {
      activityId?: string;
    }

    export interface CompleteWorkflowExecutionDecisionAttributes {
      result?: string;
    }

    export interface FailWorkflowExecutionDecisionAttributes {
      reason?: string;
      details?: string;
    }

    export interface CancelWorkflowExecutionDecisionAttributes {
      details?: string;
    }

    export interface ContinueAsNewWorkflowExecutionDecisionAttributes {
      input?: string;
      executionStartToCloseTimeout?: string;
      taskList?: TaskList;
      taskStartToCloseTimeout?: string;
      childPolicy?: string;
      tagList?: string[];
      workflowTypeVersion?: string;
    }

    export interface RecordMarkerDecisionAttributes {
      markerName?: string;
      details?: string;
    }

    export interface StartTimerDecisionAttributes {
      timerId?: string;
      control?: string;
      startToFireTimeout?: string;
    }

    export interface CancelTimerDecisionAttributes {
      timerId?: string;
    }

    export interface SignalExternalWorkflowExecutionDecisionAttributes {
      workflowId?: string;
      runId?: string;
      signalName?: string;
      input?: string;
      control?: string;
    }

    export interface RequestCancelExternalWorkflowExecutionDecisionAttributes {
      workflowId?: string;
      runId?: string;
      control?: string;
    }

    export interface StartChildWorkflowExecutionDecisionAttributes {
      workflowType?: WorkflowType;
      workflowId?: string;
      control?: string;
      input?: string;
      executionStartToCloseTimeout?: string;
      taskList?: TaskList;
      taskStartToCloseTimeout?: string;
      childPolicy?: string;
      tagList?: string[];
    }

    export interface RespondActivityTaskCompletedRequest {
      taskToken?: string;
      result?: string;
    }

    export interface RespondActivityTaskFailedRequest {
      taskToken?: string;
      reason?: string;
      details?: string;
    }

    export interface RespondActivityTaskCanceledRequest {
      taskToken?: string;
      details?: string;
    }

    export interface DecisionTask {
      taskToken?: string;
      startedEventId?: number;
      workflowExecution?: WorkflowExecution;
      workflowType?: WorkflowType;
      events?: HistoryEvent[];
      nextPageToken?: string;
      previousStartedEventId?: number;
    }

    export interface WorkflowExecution {
      workflowId?: string;
      runId?: string;
    }

    export interface HistoryEvent {
      eventTimestamp?: any;
      eventType?: string;
      eventId?: number;
      workflowExecutionStartedEventAttributes?: WorkflowExecutionStartedEventAttributes;
      workflowExecutionCompletedEventAttributes?: WorkflowExecutionCompletedEventAttributes;
      completeWorkflowExecutionFailedEventAttributes?: CompleteWorkflowExecutionFailedEventAttributes;
      workflowExecutionFailedEventAttributes?: WorkflowExecutionFailedEventAttributes;
      failWorkflowExecutionFailedEventAttributes?: FailWorkflowExecutionFailedEventAttributes;
      workflowExecutionTimedOutEventAttributes?: WorkflowExecutionTimedOutEventAttributes;
      workflowExecutionCanceledEventAttributes?: WorkflowExecutionCanceledEventAttributes;
      cancelWorkflowExecutionFailedEventAttributes?: CancelWorkflowExecutionFailedEventAttributes;
      workflowExecutionContinuedAsNewEventAttributes?: WorkflowExecutionContinuedAsNewEventAttributes;
      continueAsNewWorkflowExecutionFailedEventAttributes?: ContinueAsNewWorkflowExecutionFailedEventAttributes;
      workflowExecutionTerminatedEventAttributes?: WorkflowExecutionTerminatedEventAttributes;
      workflowExecutionCancelRequestedEventAttributes?: WorkflowExecutionCancelRequestedEventAttributes;
      decisionTaskScheduledEventAttributes?: DecisionTaskScheduledEventAttributes;
      decisionTaskStartedEventAttributes?: DecisionTaskStartedEventAttributes;
      decisionTaskCompletedEventAttributes?: DecisionTaskCompletedEventAttributes;
      decisionTaskTimedOutEventAttributes?: DecisionTaskTimedOutEventAttributes;
      activityTaskScheduledEventAttributes?: ActivityTaskScheduledEventAttributes;
      activityTaskStartedEventAttributes?: ActivityTaskStartedEventAttributes;
      activityTaskCompletedEventAttributes?: ActivityTaskCompletedEventAttributes;
      activityTaskFailedEventAttributes?: ActivityTaskFailedEventAttributes;
      activityTaskTimedOutEventAttributes?: ActivityTaskTimedOutEventAttributes;
      activityTaskCanceledEventAttributes?: ActivityTaskCanceledEventAttributes;
      activityTaskCancelRequestedEventAttributes?: ActivityTaskCancelRequestedEventAttributes;
      workflowExecutionSignaledEventAttributes?: WorkflowExecutionSignaledEventAttributes;
      markerRecordedEventAttributes?: MarkerRecordedEventAttributes;
      timerStartedEventAttributes?: TimerStartedEventAttributes;
      timerFiredEventAttributes?: TimerFiredEventAttributes;
      timerCanceledEventAttributes?: TimerCanceledEventAttributes;
      startChildWorkflowExecutionInitiatedEventAttributes?: StartChildWorkflowExecutionInitiatedEventAttributes;
      childWorkflowExecutionStartedEventAttributes?: ChildWorkflowExecutionStartedEventAttributes;
      childWorkflowExecutionCompletedEventAttributes?: ChildWorkflowExecutionCompletedEventAttributes;
      childWorkflowExecutionFailedEventAttributes?: ChildWorkflowExecutionFailedEventAttributes;
      childWorkflowExecutionTimedOutEventAttributes?: ChildWorkflowExecutionTimedOutEventAttributes;
      childWorkflowExecutionCanceledEventAttributes?: ChildWorkflowExecutionCanceledEventAttributes;
      childWorkflowExecutionTerminatedEventAttributes?: ChildWorkflowExecutionTerminatedEventAttributes;
      signalExternalWorkflowExecutionInitiatedEventAttributes?: SignalExternalWorkflowExecutionInitiatedEventAttributes;
      externalWorkflowExecutionSignaledEventAttributes?: ExternalWorkflowExecutionSignaledEventAttributes;
      signalExternalWorkflowExecutionFailedEventAttributes?: SignalExternalWorkflowExecutionFailedEventAttributes;
      externalWorkflowExecutionCancelRequestedEventAttributes?: ExternalWorkflowExecutionCancelRequestedEventAttributes;
      requestCancelExternalWorkflowExecutionInitiatedEventAttributes?: RequestCancelExternalWorkflowExecutionInitiatedEventAttributes;
      requestCancelExternalWorkflowExecutionFailedEventAttributes?: RequestCancelExternalWorkflowExecutionFailedEventAttributes;
      scheduleActivityTaskFailedEventAttributes?: ScheduleActivityTaskFailedEventAttributes;
      requestCancelActivityTaskFailedEventAttributes?: RequestCancelActivityTaskFailedEventAttributes;
      startTimerFailedEventAttributes?: StartTimerFailedEventAttributes;
      cancelTimerFailedEventAttributes?: CancelTimerFailedEventAttributes;
      startChildWorkflowExecutionFailedEventAttributes?: StartChildWorkflowExecutionFailedEventAttributes;
    }

    export interface WorkflowExecutionStartedEventAttributes {
      input?: string;
      executionStartToCloseTimeout?: string;
      taskStartToCloseTimeout?: string;
      childPolicy?: string;
      taskList?: TaskList;
      workflowType?: WorkflowType;
      tagList?: string[];
      continuedExecutionRunId?: string;
      parentWorkflowExecution?: WorkflowExecution;
      parentInitiatedEventId?: number;
    }

    export interface WorkflowExecutionCompletedEventAttributes {
      result?: string;
      decisionTaskCompletedEventId?: number;
    }

    export interface CompleteWorkflowExecutionFailedEventAttributes {
      cause?: string;
      decisionTaskCompletedEventId?: number;
    }

    export interface WorkflowExecutionFailedEventAttributes {
      reason?: string;
      details?: string;
      decisionTaskCompletedEventId?: number;
    }

    export interface FailWorkflowExecutionFailedEventAttributes {
      cause?: string;
      decisionTaskCompletedEventId?: number;
    }

    export interface WorkflowExecutionTimedOutEventAttributes {
      timeoutType?: string;
      childPolicy?: string;
    }

    export interface WorkflowExecutionCanceledEventAttributes {
      details?: string;
      decisionTaskCompletedEventId?: number;
    }

    export interface CancelWorkflowExecutionFailedEventAttributes {
      cause?: string;
      decisionTaskCompletedEventId?: number;
    }

    export interface WorkflowExecutionContinuedAsNewEventAttributes {
      input?: string;
      decisionTaskCompletedEventId?: number;
      newExecutionRunId?: string;
      executionStartToCloseTimeout?: string;
      taskList?: TaskList;
      taskStartToCloseTimeout?: string;
      childPolicy?: string;
      tagList?: string[];
      workflowType?: WorkflowType;
    }

    export interface ContinueAsNewWorkflowExecutionFailedEventAttributes {
      cause?: string;
      decisionTaskCompletedEventId?: number;
    }

    export interface WorkflowExecutionTerminatedEventAttributes {
      reason?: string;
      details?: string;
      childPolicy?: string;
      cause?: string;
    }

    export interface WorkflowExecutionCancelRequestedEventAttributes {
      externalWorkflowExecution?: WorkflowExecution;
      externalInitiatedEventId?: number;
      cause?: string;
    }

    export interface DecisionTaskScheduledEventAttributes {
      taskList?: TaskList;
      startToCloseTimeout?: string;
    }

    export interface DecisionTaskStartedEventAttributes {
      identity?: string;
      scheduledEventId?: number;
    }

    export interface DecisionTaskCompletedEventAttributes {
      executionContext?: string;
      scheduledEventId?: number;
      startedEventId?: number;
    }

    export interface DecisionTaskTimedOutEventAttributes {
      timeoutType?: string;
      scheduledEventId?: number;
      startedEventId?: number;
    }

    export interface ActivityTaskScheduledEventAttributes {
      activityType?: ActivityType;
      activityId?: string;
      input?: string;
      control?: string;
      scheduleToStartTimeout?: string;
      scheduleToCloseTimeout?: string;
      startToCloseTimeout?: string;
      taskList?: TaskList;
      decisionTaskCompletedEventId?: number;
      heartbeatTimeout?: string;
    }

    export interface ActivityTaskStartedEventAttributes {
      identity?: string;
      scheduledEventId?: number;
    }

    export interface ActivityTaskCompletedEventAttributes {
      result?: string;
      scheduledEventId?: number;
      startedEventId?: number;
    }

    export interface ActivityTaskFailedEventAttributes {
      reason?: string;
      details?: string;
      scheduledEventId?: number;
      startedEventId?: number;
    }

    export interface ActivityTaskTimedOutEventAttributes {
      timeoutType?: string;
      scheduledEventId?: number;
      startedEventId?: number;
      details?: string;
    }

    export interface ActivityTaskCanceledEventAttributes {
      details?: string;
      scheduledEventId?: number;
      startedEventId?: number;
      latestCancelRequestedEventId?: number;
    }

    export interface ActivityTaskCancelRequestedEventAttributes {
      decisionTaskCompletedEventId?: number;
      activityId?: string;
    }

    export interface WorkflowExecutionSignaledEventAttributes {
      signalName?: string;
      input?: string;
      externalWorkflowExecution?: WorkflowExecution;
      externalInitiatedEventId?: number;
    }

    export interface MarkerRecordedEventAttributes {
      markerName?: string;
      details?: string;
      decisionTaskCompletedEventId?: number;
    }

    export interface TimerStartedEventAttributes {
      timerId?: string;
      control?: string;
      startToFireTimeout?: string;
      decisionTaskCompletedEventId?: number;
    }

    export interface TimerFiredEventAttributes {
      timerId?: string;
      startedEventId?: number;
    }

    export interface TimerCanceledEventAttributes {
      timerId?: string;
      startedEventId?: number;
      decisionTaskCompletedEventId?: number;
    }

    export interface StartChildWorkflowExecutionInitiatedEventAttributes {
      workflowId?: string;
      workflowType?: WorkflowType;
      control?: string;
      input?: string;
      executionStartToCloseTimeout?: string;
      taskList?: TaskList;
      decisionTaskCompletedEventId?: number;
      childPolicy?: string;
      taskStartToCloseTimeout?: string;
      tagList?: string[];
    }

    export interface ChildWorkflowExecutionStartedEventAttributes {
      workflowExecution?: WorkflowExecution;
      workflowType?: WorkflowType;
      initiatedEventId?: number;
    }

    export interface ChildWorkflowExecutionCompletedEventAttributes {
      workflowExecution?: WorkflowExecution;
      workflowType?: WorkflowType;
      result?: string;
      initiatedEventId?: number;
      startedEventId?: number;
    }

    export interface ChildWorkflowExecutionFailedEventAttributes {
      workflowExecution?: WorkflowExecution;
      workflowType?: WorkflowType;
      reason?: string;
      details?: string;
      initiatedEventId?: number;
      startedEventId?: number;
    }

    export interface ChildWorkflowExecutionTimedOutEventAttributes {
      workflowExecution?: WorkflowExecution;
      workflowType?: WorkflowType;
      timeoutType?: string;
      initiatedEventId?: number;
      startedEventId?: number;
    }

    export interface ChildWorkflowExecutionCanceledEventAttributes {
      workflowExecution?: WorkflowExecution;
      workflowType?: WorkflowType;
      details?: string;
      initiatedEventId?: number;
      startedEventId?: number;
    }

    export interface ChildWorkflowExecutionTerminatedEventAttributes {
      workflowExecution?: WorkflowExecution;
      workflowType?: WorkflowType;
      initiatedEventId?: number;
      startedEventId?: number;
    }

    export interface SignalExternalWorkflowExecutionInitiatedEventAttributes {
      workflowId?: string;
      runId?: string;
      signalName?: string;
      input?: string;
      decisionTaskCompletedEventId?: number;
      control?: string;
    }

    export interface ExternalWorkflowExecutionSignaledEventAttributes {
      workflowExecution?: WorkflowExecution;
      initiatedEventId?: number;
    }

    export interface SignalExternalWorkflowExecutionFailedEventAttributes {
      workflowId?: string;
      runId?: string;
      cause?: string;
      initiatedEventId?: number;
      decisionTaskCompletedEventId?: number;
      control?: string;
    }

    export interface ExternalWorkflowExecutionCancelRequestedEventAttributes {
      workflowExecution?: WorkflowExecution;
      initiatedEventId?: number;
    }

    export interface RequestCancelExternalWorkflowExecutionInitiatedEventAttributes {
      workflowId?: string;
      runId?: string;
      decisionTaskCompletedEventId?: number;
      control?: string;
    }

    export interface RequestCancelExternalWorkflowExecutionFailedEventAttributes {
      workflowId?: string;
      runId?: string;
      cause?: string;
      initiatedEventId?: number;
      decisionTaskCompletedEventId?: number;
      control?: string;
    }

    export interface ScheduleActivityTaskFailedEventAttributes {
      activityType?: ActivityType;
      activityId?: string;
      cause?: string;
      decisionTaskCompletedEventId?: number;
    }

    export interface RequestCancelActivityTaskFailedEventAttributes {
      activityId?: string;
      cause?: string;
      decisionTaskCompletedEventId?: number;
    }

    export interface StartTimerFailedEventAttributes {
      timerId?: string;
      cause?: string;
      decisionTaskCompletedEventId?: number;
    }

    export interface CancelTimerFailedEventAttributes {
      timerId?: string;
      cause?: string;
      decisionTaskCompletedEventId?: number;
    }

    export interface StartChildWorkflowExecutionFailedEventAttributes {
      workflowType?: WorkflowType;
      cause?: string;
      workflowId?: string;
      initiatedEventId?: number;
      decisionTaskCompletedEventId?: number;
      control?: string;
    }

    export interface ActivityTask {
      taskToken?: string;
      activityId?: string;
      startedEventId?: number;
      workflowExecution?: WorkflowExecution;
      activityType?: ActivityType;
      input?: string;
    }

    export interface PollForActivityTaskResult {
      activityTask?: ActivityTask;
    }

    export interface PollForDecisionTaskResult {
      decisionTask?: DecisionTask;
    }

    export interface StartWorkflowExecutionResult {
      run?: Run;
    }

    export interface Run {
      runId?: string;
    }



  }

  module Sns {

    export interface Client {
      config: ClientConfig;

      publicTopic(params: PublishRequest, callback: (err: any, data: PublishResult) => void);
      createTopic(params: CreateTopicRequest, callback: (err: any, data: CreateTopicResult) => void);
      deleteTopic(params: DeleteTopicRequest, callback: (err: any, data: any) => void);
    }

    export interface PublishRequest {
      TopicArn?: string;
      Message?: string;
      MessageStructure?: string;
      Subject?: string;
    }

    export interface PublishResult {
      MessageId?: string;
    }

    export interface CreateTopicRequest {
      Name?: string;
    }

    export interface CreateTopicResult {
      TopicArn?: string;
    }

    export interface DeleteTopicRequest {
      TopicArn?: string;
    }

  }

  module s3 {

    export interface Client {
      config: ClientConfig;

      putObject(params: PutObjectRequest, callback: (err: any, data: any) => void);
      getObject(params: GetObjectRequest, callback: (err: any, data: any) => void);
    }

    export interface PutObjectRequest {
      ACL?: string;
      Body?: any;
      Bucket: string;
      CacheControl?: string;
      ContentDisposition?: string;
      ContentEncoding?: string;
      ContentLanguage?: string;
      ContentLength?: string;
      ContentMD5?: string;
      ContentType?: string;
      Expires?: any;
      GrantFullControl?: string;
      GrantRead?: string;
      GrantReadACP?: string;
      GrantWriteACP?: string;
      Key: string;
      Metadata?: string[];
      ServerSideEncryption?: string;
      StorageClass?: string;
      WebsiteRedirectLocation?: string;
    }

    export interface GetObjectRequest {
      Bucket: string;
      IfMatch?: string;
      IfModifiedSince?: any;
      IfNoneMatch?: string;
      IfUnmodifiedSince?: any;
      Key: string;
      Range?: string;
      ResponseCacheControl?: string;
      ResponseContentDisposition?: string;
      ResponseContentEncoding?: string;
      ResponseContentLanguage?: string;
      ResponseContentType?: string;
      ResponseExpires?: any;
      VersionId?: string;
    }

  }

  module dynamoDb {

    export interface Client {
      config: ClientConfig;

      getItem(params: any, callback: (err: any, data: any) => void);
    }

  }
}