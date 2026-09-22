---

title: "Returning Data from Office Scripts to Power Automate and Power Apps"
date: 2026-09-22
description: "Learn how to return strings, numbers and structured results from Office Scripts, use them in Power Automate, and pass the response back to a Power App with practical examples."
tags:

- Excel
- Office Scripts
- Power Automate
- Microsoft 365
- Power Apps
- Automation
- TypeScript
- Power Platform

---

Running an Office Script from Power Automate is useful on its own, but it becomes much more powerful when the script can **send information back to the flow**.

For example, an Office Script could process an Excel workbook and return:

* how many rows were processed;
* whether the operation succeeded;
* the name of a worksheet that was created;
* a calculated total;
* a warning message;
* or several pieces of information together.

Power Automate can then use that result elsewhere in the workflow.

And if the flow was started from Power Apps, the same information can also be sent back to the app.

The overall pattern looks like this:

```text
Office Script
     │
     ▼
Power Automate
     │
     ├── Continue processing
     │
     └── Return result to Power Apps
```

Let's look at both scenarios.

---

# 1. Returning a Simple Value from an Office Script

The easiest example is returning a single value.

Suppose an Office Script counts the number of rows in an Excel table.

```typescript
function main(workbook: ExcelScript.Workbook): number {

    const table = workbook.getTable("Users");

    const rowCount =
        table.getRangeBetweenHeaderAndTotal()
             .getRowCount();

    return rowCount;
}
```

The important part is:

```typescript
: number
```

after the `main()` function.

This tells Office Scripts that the function will return a number.

Then:

```typescript
return rowCount;
```

actually sends the value back.

Microsoft supports returning data from an Office Script into the **Run script** action in Power Automate. The returned value appears as dynamic content called **result**.

---

# 2. Getting the Result in Power Automate

Your flow might look like:

```text
Trigger
   ↓
Run script
   ↓
Compose
   ↓
Continue processing
```

After adding the **Run script** action, select your workbook and Office Script.

Once Power Automate recognises that the script returns a value, you should see:

```text
result
```

available in Dynamic content.

For our example, that result might be:

```text
428
```

You could then use it in an email:

```text
428 rows were processed.
```

or in a condition:

```text
Is result greater than 0?
```

or store it somewhere else.

---

# Returning Text

The same concept works with text.

For example:

```typescript
function main(workbook: ExcelScript.Workbook): string {

    const worksheet = workbook.getActiveWorksheet();

    return worksheet.getName();
}
```

If the active worksheet is:

```text
September Report
```

Power Automate receives:

```text
September Report
```

as the script result.

---

# Returning True or False

You can also return a Boolean value.

```typescript
function main(workbook: ExcelScript.Workbook): boolean {

    const worksheet = workbook.getWorksheet("Report");

    return worksheet !== undefined;
}
```

Power Automate can then use the returned result in a condition.

Conceptually:

```text
Run script
    ↓
Did script return true?
   / \
 Yes  No
```

This can be useful when the Office Script is performing validation before the rest of the flow continues.

---

# 3. Returning Multiple Values

In real automations, returning just one value often isn't enough.

Imagine a script that cleans an Excel report.

At the end you might want to know:

```text
Was it successful?
How many rows were processed?
What worksheet was used?
Was there a warning?
```

Instead of trying to return several individual values, you can return an **object**.

For example:

```typescript
interface ScriptResult {
    success: boolean;
    rowsProcessed: number;
    worksheetName: string;
    message: string;
}

function main(
    workbook: ExcelScript.Workbook
): ScriptResult {

    const worksheet =
        workbook.getWorksheet("Report");

    const usedRange =
        worksheet.getUsedRange();

    const rowsProcessed =
        usedRange.getRowCount();

    return {
        success: true,
        rowsProcessed: rowsProcessed,
        worksheetName: worksheet.getName(),
        message: "Report processed successfully"
    };
}
```

Now instead of returning:

```text
428
```

the script effectively returns something like:

```json
{
    "success": true,
    "rowsProcessed": 428,
    "worksheetName": "Report",
    "message": "Report processed successfully"
}
```

This is much more useful for larger automations.

Office Scripts supports returning objects to Power Automate, provided the return type is declared on the `main()` function.

---

# Why I Prefer Returning an Object

For anything beyond a very simple script, I normally prefer something like:

```typescript
interface ScriptResult {
    success: boolean;
    message: string;
    rowsProcessed: number;
}
```

rather than returning only:

```typescript
true
```

Why?

Because:

```text
true
```

only tells Power Automate:

> Something succeeded.

Whereas:

```json
{
    "success": true,
    "message": "Import completed successfully",
    "rowsProcessed": 754
}
```

actually gives the flow useful information.

It also makes troubleshooting much easier.

---

# A Practical Example

Imagine a flow that receives a new Excel report every morning.

The automation could be:

```text
New report arrives
       ↓
Save report to SharePoint
       ↓
Run Office Script
       ↓
Script cleans workbook
       ↓
Script returns result
       ↓
Power Automate checks result
       ↓
Send notification
```

The Office Script might return:

```json
{
    "success": true,
    "rowsProcessed": 1257,
    "message": "Daily report processed successfully"
}
```

Power Automate could then send:

```text
Daily report processed successfully.

Rows processed: 1,257
```

This is much cleaner than making Power Automate rediscover information the script already knows.

---

# A Useful Pattern: Return a Status Object

For scripts I expect to use in Power Automate, I like using a consistent response structure.

For example:

```typescript
interface ScriptResult {
    success: boolean;
    message: string;
    rowsProcessed: number;
}
```

Then the script returns something similar to:

```typescript
return {
    success: true,
    message: "Processing completed successfully.",
    rowsProcessed: 428
};
```

Your Power Automate flow can then make decisions based on the returned information.

Conceptually:

```text
Run Office Script
       ↓
Check success
    /       \
 true       false
  ↓           ↓
Continue    Handle failure
```

---

# Important: Changing the Script Return Type

There is one slightly unintuitive behaviour worth knowing.

Power Automate reads the parameters and return type of your Office Script when you add the **Run script** action.

If you later change:

```typescript
function main(workbook: ExcelScript.Workbook)
```

to:

```typescript
function main(
    workbook: ExcelScript.Workbook
): ScriptResult
```

Power Automate might not immediately recognise the new output.

Microsoft recommends removing and recreating the **Run script** action if the script's parameters or return type have changed.

So if your new `result` mysteriously doesn't appear in Dynamic content, this is one of the first things to check.

---

# 4. Returning the Result to Power Apps

Things become particularly interesting when Power Apps starts the flow.

The architecture becomes:

```text
Power Apps
    │
    │ .Run()
    ▼
Power Automate
    │
    ▼
Run Office Script
    │
    ▼
Office Script returns result
    │
    ▼
Power Automate
    │
    ▼
Respond to a Power App or flow
    │
    ▼
Power Apps receives result
```

For a canvas app, Power Automate provides a convenient bridge between the app and the Office Script.

Power Apps can trigger a cloud flow using the flow's `.Run()` function.

---

# Example Scenario

Imagine a Power App where the user selects:

```text
Process Report
```

The app calls a Power Automate flow.

The flow runs an Office Script against an Excel workbook.

The Office Script processes the workbook and returns:

```json
{
    "success": true,
    "rowsProcessed": 428,
    "message": "Report processed successfully."
}
```

The flow then sends those values back to Power Apps.

---

# Step 1 - Power Apps Calls the Flow

A button's **OnSelect** property could contain something like:

```powerfx
Set(
    varResult,
    ProcessExcelReport.Run()
)
```

The important part is:

```powerfx
ProcessExcelReport.Run()
```

which starts the Power Automate flow.

Wrapping it inside:

```powerfx
Set(...)
```

allows us to keep the response returned by the flow.

---

# Step 2 - Power Automate Runs the Office Script

Inside the flow:

```text
Power Apps (V2)
      ↓
Run script
      ↓
Respond to a Power App or flow
```

The Office Script returns our object.

For example:

```json
{
    "success": true,
    "rowsProcessed": 428,
    "message": "Report processed successfully."
}
```

---

# Step 3 - Add "Respond to a Power App or flow"

At the end of the flow, add:

**Respond to a Power App or flow**

This action allows the flow to send values back to the calling app. Microsoft also documents this response action as the mechanism for defining outputs returned to a caller.

You could create outputs such as:

```text
Success
Message
RowsProcessed
```

Then map them to the values returned by the Office Script.

For example:

```text
Success
→ script result success

Message
→ script result message

RowsProcessed
→ script result rowsProcessed
```

---

# Step 4 - Use the Result in Power Apps

Back in Power Apps:

```powerfx
Set(
    varResult,
    ProcessExcelReport.Run()
)
```

`varResult` now represents the response from the flow.

You could display:

```powerfx
varResult.message
```

in a label.

Or:

```powerfx
varResult.rowsprocessed
```

to display how many rows were processed.

---

# Showing a Notification

You could also display the returned message directly to the user.

For example:

```powerfx
Set(
    varResult,
    ProcessExcelReport.Run()
);

Notify(
    varResult.message,
    NotificationType.Success
)
```

The experience becomes:

```text
User presses button

        ↓

Power App calls Flow

        ↓

Flow runs Office Script

        ↓

Script processes workbook

        ↓

Script returns result

        ↓

Flow returns result to app

        ↓

"Report processed successfully."
```

That can make the application feel much more interactive.

---

# Return More Than Just "Success"

A common mistake is returning only:

```text
Success
```

or:

```text
Failed
```

I prefer returning enough information for the app to understand what happened.

For example:

```text
Success: true
RowsProcessed: 428
Message: Report processed successfully
```

Then the Power App can decide how it wants to display the result.

For example:

```powerfx
If(
    varResult.success,
    
    Notify(
        varResult.message,
        NotificationType.Success
    ),
    
    Notify(
        varResult.message,
        NotificationType.Error
    )
)
```

This keeps the responsibilities nicely separated.

The Office Script understands Excel.

Power Automate understands the workflow.

Power Apps understands the user experience.

---

# Passing Data Both Ways

You can also send information **into** the Office Script and then receive something back.

For example:

```text
Power Apps
   │
   │ Report name
   ▼
Power Automate
   │
   ▼
Office Script
   │
   │ Processing result
   ▼
Power Automate
   │
   ▼
Power Apps
```

Suppose the user enters a department:

```text
Finance
```

Power Apps sends:

```text
Finance
```

to Power Automate.

Power Automate passes it to the Office Script:

```typescript
function main(
    workbook: ExcelScript.Workbook,
    department: string
): string {

    // Process workbook...

    return `Report processed for ${department}`;
}
```

The result returned to Power Automate becomes:

```text
Report processed for Finance
```

and that can then be passed back to Power Apps.

Office Script parameters are exposed as inputs on the Power Automate **Run script** action, while script return values appear as its result.

---

# A Realistic Architecture

A larger solution might look like this:

```text
┌─────────────────┐
│   Power Apps    │
│                 │
│ Select report   │
│ Press Process   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Power Automate  │
│                 │
│ Validate input  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Office Script  │
│                 │
│ Read workbook   │
│ Process rows    │
│ Update Excel    │
│ Calculate result│
└────────┬────────┘
         │
         │
         │ Result
         ▼
┌─────────────────┐
│ Power Automate  │
│                 │
│ Check result    │
│ Log operation   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Power Apps    │
│                 │
│ Show result     │
└─────────────────┘
```

This gives each technology a clear job.

---

# Don't Make Power Apps Wait for Long Processes

There is one important consideration when a Power App is waiting for a response.

Flows that need to respond to a calling app operate within an inbound request response window. Microsoft currently documents a **120-second limit** for these synchronous request/response scenarios.

So this pattern is ideal for operations such as:

```text
Validate workbook
Calculate value
Process a reasonable dataset
Return a status
```

It is less suitable for:

```text
Process a huge workbook
Wait for an approval
Wait several minutes
Perform a very long-running batch operation
```

For longer operations, it is usually better to start the job and let the app check its status separately rather than keeping the user waiting for a response.

---

# Troubleshooting: My Result Isn't Appearing

If Power Automate doesn't show the script's returned value, check these first.

### 1. Does `main()` declare a return type?

Instead of:

```typescript
function main(workbook: ExcelScript.Workbook)
```

you may need:

```typescript
function main(
    workbook: ExcelScript.Workbook
): string
```

or:

```typescript
function main(
    workbook: ExcelScript.Workbook
): ScriptResult
```

---

### 2. Does the script actually return something?

For example:

```typescript
return result;
```

---

### 3. Did you change the script after adding "Run script"?

If you changed the function parameters or return type, remove the existing **Run script** action and add it again.

Power Automate stores the script signature when the action is created, so an old action may not recognise your new outputs.

---

### 4. Check the Flow Run History

Open the completed flow run and inspect:

```text
Run script
   ↓
Outputs
```

This is often the quickest way to see exactly what the script returned.

---

# Which Pattern Should I Use?

For a simple Power Automate flow:

```text
Office Script
      ↓
return number/string
      ↓
Power Automate
```

For a more complex flow:

```text
Office Script
      ↓
return object
      ↓
Power Automate
      ↓
Use properties from result
```

For Power Apps:

```text
Power Apps
      ↓
Power Automate
      ↓
Office Script
      ↓
return object
      ↓
Power Automate
      ↓
Respond to a Power App or flow
      ↓
Power Apps
```

---

# Final Takeaway

The most important concept is that an Office Script doesn't have to simply modify a workbook and finish.

It can also tell the rest of your solution **what happened**.

Instead of:

```text
Run script
    ↓
Hope everything worked
```

you can build:

```text
Run script
    ↓
Return:
- success
- message
- rows processed
- calculated values
    ↓
Power Automate makes a decision
    ↓
Power Apps shows the result
```

For small scripts, returning a single value may be enough.

For larger automations, returning a structured result object gives Power Automate much more useful information and provides a clean way of passing those results all the way back to Power Apps.

A useful rule to remember is:

> **Office Scripts process the workbook, Power Automate handles the workflow, and Power Apps presents the result to the user.**
