
#Easy SWF

Easy SWF is a module made to make using the AWS Simple Workflow Service a little easier to use.

You need to be familiar with how SWF works. This [link](http://docs.aws.amazon.com/amazonswf/latest/developerguide/swf-dg-basic.html) is useful for understanding the core concepts.

##How to create a client

```
var easy = require("easy-swf");

var workflow = {
	"domain": "ExampleDomain",
	"taskList": "taskList"
};

var awsConfig = {
	"accessKeyId": "[YourAccessKeyId]",
	"secretAccessKey": "[YourSecretAccessKey]",
	"region": "[YourRegion]"
};

var client = new easy.WorkflowClient(workflow, awsConfig);

```
awsConfig is optional. If the argument is not provided it will default to the AWS settings in process.env.


##How to handle activities

```
var acts = client.createActivityHost("taskList");

acts.handleActivity("taskOne", "1", function (data, next) {
  next(null, "one");
});

acts.handleActivity("taskTwo", "1", function (data, next) {
  next(null, data + " two");
});

acts.handleActivity("taskThree", "1", function (data, next) {
  next(null, data + " three");
});

acts.listen(function (err, message) {

   //get feedback from activity host
  console.log(message);

});

```

##How the decisions work

A DeciderHost is created to handle all decisions. A decision handler is created for each workflow. Any errors will returned via the DeciderHost.listen callback.

Here is an example decider:
```
var decider = client.createDeciderHost("taskList");

decider.handleWorkflow("example", "1", function(context) {

  var taskOne = context.getFunction("taskOne", "1");
  var taskTwo = context.getFunction("taskTwo", "1");
  var taskThree = context.getFunction("taskThree", "1");

  taskOne("input", function (feedErr, feedData) {

    if (feedErr != null) { context.failWorkflow(feedErr); return; }

    taskTwo(feedData, function (summaryErr, summaryData) {

      if (summaryErr != null) { context.failWorkflow(summaryErr); return; }

      taskThree(summaryData, function (finalErr, finalData) {
        if (finalErr != null) { context.failWorkflow(finalErr); return; }

        console.log(finalData);
        context.completeWorkflow();
      });

    });

  });

});

decider.listen(function (err, message, context) {

  if (err != null) {
    console.log("[Framework Error]", err);

    if (context != null) {
      context.failWorkflow(err);
      return;
    }
  }

  console.log(message);

});

```
The context object has the following methods:

####getFunction(name: string, version: string): Function
This returns different functions based on the  current WorkflowExecution history. These functions will schedule tasks, return data from activities, or raise errors depending on what is returned from the activity handler.

This allows you to write simpler logic in your decider using a traditional callback structure.

####completeWorkflow()
Tells SimpleWorkflow to complete the WorkflowExecution.
####failWorkflow(err: Error)
Tells SimpleWorkflow to fails the WorkflowExecution and stores err.message in the WorkflowExecution
####doNothing()
You must always return a response to SWF even if you don't want to make any decisions. This method tells SWF that you don't want to make a decision.



##How to start a workflow
```
client.startWorkflow("example", "1", function (err) {

});

```
##Breaking Changes from Previous Version

- The callback for ActivityHost.handleActivity() no longer includes an error. Errors are returned via ActivityHost.listen()
- The callback for DeciderHost.handleWorkflow() no longer includes an error. Errors are returned via DeciderHost.listen()
- DeciderContext.getFunction now requires a version parameter. This removed the need for explicit tast configuration.
