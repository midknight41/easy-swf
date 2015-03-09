
# easy-swf

easy-swf is a module made to make using the AWS Simple Workflow Service a little easier to use.

You need to be familiar with how SWF works. This [link](http://docs.aws.amazon.com/amazonswf/latest/developerguide/swf-dg-basic.html) is useful for understanding the core concepts.

## Installation

```
$ npm install easy-swf
```

## Getting Started
To manage a SWF Workflow Execution, we require a ActivityHost to handle the activities and a DeciderHost to handle the decisions. An ActivityHost and a DeciderHost do not need to run in the same process.

First, we configure our client:

```js
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
The ```awsConfig``` parameter is optional. If the argument is not provided it will default to the AWS settings in your environment. Even if you want to have your application pass in some AWS settings (like proxy settings) you can omit the Credentials as long as they are available in your environment.

#### Handling activities
The ActivityHost, unsurprisingly, handles activities. Tasks scheduled by the Decider will be routed here. The ```data``` parameter of the callback will contain whatever value is passed from the decider.

Here's an example:
```js
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
  console.log(message);
});

```
Any errors raised by easy-swf will be return via the ```listen()``` callback and you can keep track of what SWF is doing via the ```message``` in the callback if you like.

### Handling decisions

A DeciderHost is created to handle all decisions. A decision handler is created for each workflow. Any framework errors will returned via the ```listen()``` method just like the ActivityHost.

Here is an example decider:
```js
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
And here's the equivalent using promises:
```js
var Q = require("q");
var decider = client.createDeciderHost("taskList");

decider.handleWorkflow("example", "1", function(context) {

  var taskOne = context.getPromise("taskOne", "1");
  var taskTwo = context.getPromise("taskTwo", "1");
  var taskThree = context.getPromise("taskThree", "1");

  Q.fcall(taskOne, context.input)
    .then(taskTwo)
    .then(taskThree)
    .then(result => {
	  console.log(result);
	  context.completeWorkflow(result);
    })
    .catch(err => {
      context.failWorkflow(err);
    })
    .done();

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

### The ```context``` object

The ```context``` object represents the current state of the WorkflowExecution and is used to interact with SWF. The state of the ```context``` object is rebuilt from the WorkflowExecutionHistory on every decision.

The ```context``` object has the following methods:

##### .getFunction(name: string, version: string): Function
This returns different functions based on the  current WorkflowExecutionHistory. These functions will schedule tasks, return data from activities, or raise errors depending on what is appropriate given the WorkflowExecutionHistory.

This allows you to write simpler logic in your decider using a traditional callback structure.
##### .getPromise(name: string, version: string): Promise
This wraps the ```getFunction``` method and returns a Promise instead.
##### .completeWorkflow()
Tells SimpleWorkflow to complete the WorkflowExecution.
##### .failWorkflow(err: Error)
Tells SimpleWorkflow to fails the WorkflowExecution and stores err.message in the WorkflowExecution.
##### .doNothing()
You **must always** return a response to SWF even if you don't want to make any decisions. This method tells SWF that you don't want to make a decision just yet.

This is to support the execution of actvities in parallel.

### Finally, start a workflow
```js
client.startWorkflow("example", "1", function (err) {

});

```
## Breaking Changes from 0.6.0

- The callback for ActivityHost.handleActivity() no longer includes an error. Errors are returned via ActivityHost.listen()
- The callback for DeciderHost.handleWorkflow() no longer includes an error. Errors are returned via DeciderHost.listen()
- DeciderContext.getFunction now requires a version parameter. This removed the need for explicit tast configuration.
