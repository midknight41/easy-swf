import AWS = require("aws-sdk");
import a = require("./Activity");
import d = require("./Decider");
import e = require("./EventParser");
import dal = require("./SwfDataAccess");
import r = require("./ActivityRegister");
import w = require("./WorkflowItemRegister");
import interfaces = require("./Interfaces");
import uuid = require("uuid");
import errors = require("./CustomErrors");

export class WorkflowClient {

  private config;
  private workflow: interfaces.IOptions;
  private swf: dal.ISwfDataAccess;

  constructor(workflow: interfaces.IOptions, awsConfig: any, swf?: dal.ISwfDataAccess) {

    this.validateOptions(workflow);
    this.validateConfig(awsConfig);

    this.config = awsConfig;

    AWS.config.update(this.config);

    this.workflow = workflow;

    if (swf == null)
      this.swf = new dal.SwfDataAccess();
    else
      this.swf = swf;

  }

  private validateOptions(workflow: interfaces.IOptions) {
    if (workflow == null) throw new errors.NullOrEmptyArgumentError("workflow");
    if (workflow.domain == null) throw new errors.InvalidArgumentError("domain is mandatory");
    if (workflow.taskList == null) throw new errors.InvalidArgumentError("taskList is mandatory");
  }

  private validateConfig(awsConfig: any) {

    if (awsConfig == null) throw new errors.NullOrEmptyArgumentError("awsConfig");
    if (awsConfig.accessKeyId == null) throw new errors.InvalidArgumentError("accessKeyId is mandatory");
    if (awsConfig.secretAccessKey == null) throw new errors.InvalidArgumentError("secretAccessKey is mandatory");
    if (awsConfig.region == null) throw new errors.InvalidArgumentError("region is mandatory");

    //if (!process.env.AWS_ACCESS_KEY_ID && awsConfig !=null && awsConfig.accessKeyId == null) throw new errors.InvalidArgumentError("accessKeyId is mandatory");
    //if (!process.env.AWS_SECRET_ACCESS_KEY && awsConfig.secretAccessKey == null) throw new errors.InvalidArgumentError("secretAccessKey is mandatory");
    //if (!process.env.AWS_REGION && awsConfig.region == null) throw new errors.InvalidArgumentError("region is mandatory");

  }

  public createActivityHost(taskList: string): a.ActivityHost {

    if (taskList == null || taskList == "") throw new errors.NullOrEmptyArgumentError("taskList cannot be null or empty");

    var reg = new r.ActivityRegister(this.workflow);
    var host = new a.ActivityHost(reg, this.workflow.domain, taskList, this.swf);

    return host;
  }

  public createDeciderHost(taskList: string): d.DecisionHost {

    if (taskList == null || taskList == "") throw new errors.NullOrEmptyArgumentError("taskList cannot be null of empty");

    var eventParser = new e.EventParser();
    var reg = new r.ActivityRegister(this.workflow);
    var wiRegister = new w.WorkflowItemRegister();

    var host = new d.DecisionHost(wiRegister, reg, this.workflow.domain, taskList, this.swf, eventParser);

    return host;

  }

  public startWorkflow(name: string, version: string, input: string, callback: (err) => void) {

    if (name == null || name == "") throw new errors.NullOrEmptyArgumentError("name is mandatory");
    if (version == null || version == "") throw new errors.NullOrEmptyArgumentError("version is mandatory");

    input = input == null ? input = "" : input;

    var request: AWS.Swf.StartWorkflowExecutionRequest = {
      domain: this.workflow.domain,
      workflowId: uuid.v4(),
      input: input,

      workflowType: {
        name: name,
        version: version
      },

      taskList: { name: this.workflow.taskList }

    };

    var me = this;

    this.swf.startWorkflowExecution(request, callback);

  }
}

