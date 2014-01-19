#Easy SWF

Easy SWF is a module made to make using the AWS Simple Workflow Service a little easier to use.

You need to be familiar with how SWF works. This [link](http://docs.aws.amazon.com/amazonswf/latest/developerguide/swf-dg-basic.html) is useful for understanding the core concepts.

##Example config

To avoid having to put version numbers and task list names into the code (which gets messy), Easy SWF has a __reference__ attribute in the workflow definition which you use in the code. The other elements match the configuration in the AWS management console.


```
{
	"awsConfig":
		{
			"accessKeyId": "[YourAccessKeyId]",
			"secretAccessKey": "[YourSecretAccessKey]",
			"region": "[YourRegion]"
		},

	"workflow": 
		{
			"domain": "Examples",
			"reference": "ExampleWorkflow",
			"workflowType" : "ExampleWorkflow",
			"workflowTypeVersion" : "1",
			"taskList": "mainList",
			"activities":
			[{
				"reference": "Activity1",
				"name": "Activity1",
				"version": "1",
				"taskList": "mainList"
			}, {
				"reference": "Activity2", 
				"name": "Activity2",
				"version": "1",
				"taskList": "mainList"
			}]
		}
}
```

##How to create a client

```
var easy = require("easy-swf");

var nconf = require('nconf');
nconf.file('./config.json');

var workflow = nconf.get("workflow");
var awsConfig = nconf.get("awsConfig");

var client = new easy.WorkflowClient(workflow, awsConfig);

```

##How to handle activities

```
var acts = client.createActivityHost("taskList");

acts.handleActivity("taskOne", function (err, data, next) {
  next(null, "one");
});

acts.handleActivity("taskTwo", function (err, data, next) {
  next(null, data + " two");
});

acts.handleActivity("taskThree", function (err, data, next) {
  next(null, data + " three");
});

acts.listen(function (err: Error, message: string) {

   //get feedback from activity host
  console.log(message);

});

```


##How the decisions work

```

var decider = client.createDeciderHost("taskList");

decider.handleDecision(function decisionLogic(err, context) {

  var taskOne = context.getFunction("taskOne");
  var taskTwo = context.getFunction("taskTwo");
  var taskThree = context.getFunction("taskThree");

  taskOne("input", function (feedErr, feedData) {

    if (feedErr != null) { context.failWorkflow(feedErr); return; }

    taskTwo(feedData, function (summaryErr, summaryData) {

      if (summaryErr != null) { context.failWorkflow(summaryErr); return; }

      taskThree(summaryData, function (finalErr, finalData) {
        if (finalErr != null) { context.failWorkflow(finalErr); return; }

        console.log(finalData);
        context.allDone();
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

##How to start a workflow
```
client.startWorkflow("example1", function whenDone(err) {

});

```

