---

title: "Fixing Teams Adaptive Card Payload Limit Errors in Power Automate"
date: 2026-09-21
tags:

- Power Automate

---

Adaptive Cards are a useful way of turning Power Automate notifications into structured Microsoft Teams messages.

They work particularly well for things such as:

* application credential expiry alerts;
* service health notifications;
* approval summaries;
* licence reports;
* security alerts;
* operational dashboards.

However, there is an easy problem to encounter when a card is generated dynamically:

```text
The payload is too large.
Please make sure the size is less than 28KB.
```

or:

```text
Request Entity too large
```

The flow itself may be working correctly. The problem is simply that the message being sent to Teams has grown beyond the size supported by the connector.

This guide explains how I troubleshoot these errors and, more importantly, how I design Adaptive Card notifications so they do not become increasingly fragile as the amount of data grows.

---

# The problem

Consider a Power Automate flow that checks Azure application credentials which are approaching expiration.

The flow might:

```text
Get applications
      ↓
Check credential expiry dates
      ↓
Filter credentials expiring soon
      ↓
Build Adaptive Card rows
      ↓
Post card to Teams
```

With only a few applications, everything works correctly.

As more results are returned, however, the Adaptive Card becomes larger.

Eventually the Teams action fails with:

```text
The payload is too large.
Please make sure the size is less than 28KB.
```

Microsoft documents an approximate **28 KB message-size limit** for relevant Microsoft Teams connector posting actions.

The important word here is **payload**.

It is not simply the amount of text visible to the user.

The JSON required to construct the card contributes to the message as well.

---

# Why an Adaptive Card becomes large so quickly

A card containing ten short rows may look tiny when rendered in Teams.

The JSON behind it can be considerably larger.

For example, a single visual row might look something like this:

```json
{
  "type": "ColumnSet",
  "columns": [
    {
      "type": "Column",
      "width": "stretch",
      "items": [
        {
          "type": "TextBlock",
          "text": "Example Application",
          "wrap": true
        }
      ]
    },
    {
      "type": "Column",
      "width": "auto",
      "items": [
        {
          "type": "TextBlock",
          "text": "18 days",
          "wrap": true,
          "weight": "Bolder"
        }
      ]
    }
  ]
}
```

What the user sees is effectively:

```text
Example Application        18 days
```

But Power Automate has to send the entire JSON structure.

Now repeat that structure 20, 30 or 50 times.

This is why cards containing repeated `ColumnSet`, `Container`, `TextBlock` and formatting properties can reach the payload limit surprisingly quickly.

---

# First: confirm that size is actually the problem

Before redesigning the flow, I check the failed Teams action.

Open:

```text
Flow
  → Run history
  → Failed run
  → Post card in a chat or channel
```

Then inspect the error.

If it contains something similar to:

```text
The payload is too large
```

or:

```text
Request Entity too large
```

the issue is different from problems such as:

* malformed JSON;
* unsupported Adaptive Card schema versions;
* invalid image URLs;
* missing properties;
* authentication failures;
* Teams connector throttling.

Microsoft also recommends validating Adaptive Card JSON when troubleshooting card failures, as malformed JSON is another common source of errors.

---

# Inspect the generated card before posting it

If the Adaptive Card is generated dynamically, I usually add a **Compose** action immediately before the Teams action.

For example:

```text
Compose – Final Adaptive Card
```

Its input contains exactly what will be passed into:

```text
Post card in a chat or channel
```

This gives me a much easier way of inspecting the completed JSON.

The flow becomes:

```text
Build card
     ↓
Compose – Final Adaptive Card
     ↓
Post card in Teams
```

I can then open the flow run and inspect the output of the Compose action.

This is particularly useful when the card is assembled using several variables, Select actions or Append to array variable actions.

---

# Using `length()` as an early warning

Power Automate's `length()` expression can give a useful indication of whether the card is becoming unusually large.

For example:

```text
length(
    string(outputs('Compose_-_Final_Adaptive_Card'))
)
```

This returns the number of characters in the generated string.

It is important to understand that:

```text
characters ≠ bytes
```

Characters containing Unicode data can require more than one byte when encoded.

Therefore I would not use this expression as an exact measurement of the Teams limit.

It is still useful as a troubleshooting metric.

For example, I might temporarily add:

```text
Compose – Card Character Count
```

with:

```text
length(
    string(outputs('Compose_-_Final_Adaptive_Card'))
)
```

If the number increases dramatically with the number of returned records, I have a strong indication of where the problem is coming from.

---

# Fix 1 - Do not put the complete report in Teams

This is usually the most important change.

An Adaptive Card should generally be treated as a **notification or summary**, not as a replacement for a reporting system.

Instead of displaying:

```text
47 applications
47 application IDs
47 expiry dates
47 owners
47 credential types
47 links
```

I might display:

```text
Application Credential Expiry Alert

3 credentials expire within 7 days
8 credentials expire within 30 days
36 additional credentials require review

Highest priority:

Application A             2 days
Application B             4 days
Application C             6 days
Application D             8 days
Application E            10 days

[View full report]
```

The complete dataset could live in:

* SharePoint;
* Dataverse;
* Power BI;
* an internal web application;
* another reporting location.

The card then becomes an entry point into the report rather than the report itself.

This pattern scales much better.

---

# Fix 2 - Limit the number of records displayed

Power Automate's `take()` expression is particularly useful here.

Suppose an array contains all applications approaching expiration:

```text
variables('varExpiringCredentials')
```

Instead of placing every result in the card:

```text
variables('varExpiringCredentials')
```

I can use:

```text
take(
    variables('varExpiringCredentials'),
    10
)
```

The card will display only the first ten results.

I can then show the total separately:

```text
length(
    variables('varExpiringCredentials')
)
```

This allows the notification to say something like:

```text
24 credentials require attention.

Showing the 10 most urgent.
```

This is considerably more useful than allowing the entire notification to fail because there were too many results.

---

# Sort before using `take()`

If I am going to limit the card to ten results, I also want to make sure they are the **most important ten**.

For an expiry notification, that normally means sorting the dataset so that credentials expiring soonest appear first.

Conceptually:

```text
All expiring credentials
        ↓
Sort by DaysRemaining
        ↓
Take first 10
        ↓
Build Adaptive Card
```

The Teams notification therefore contains the records requiring the most immediate attention.

The full dataset can still be stored elsewhere.

---

# Fix 3 - Simplify repeated card JSON

Sometimes the underlying problem is not the amount of data but the way each row is constructed.

Consider a card containing heavily formatted rows with:

```text
Container
  └─ ColumnSet
      ├─ Column
      │   └─ TextBlock
      ├─ Column
      │   └─ TextBlock
      └─ Column
          └─ TextBlock
```

If this structure is repeated 30 times, a large proportion of the payload consists of formatting instructions rather than useful data.

Where possible, I remove unnecessary properties such as repeated:

```json
"spacing": "None"
```

```json
"wrap": true
```

```json
"horizontalAlignment": "Left"
```

or unnecessary nested containers.

I do not remove properties that are required for the desired layout, but it is worth reviewing whether every generated row really needs several nested Adaptive Card objects.

---

# Fix 4 - Combine values

Another useful technique is combining related fields.

For example, instead of displaying:

```text
Application Name | Application ID | Expiry
```

as three separate columns, I could display:

```text
Application Name
Application ID
```

inside one element and keep only the expiry period as the second column.

Even better, where appropriate, the application name could link directly to the management page.

This gives users the same useful information while reducing the number of card components.

---

# Fix 5 - Remove data users do not need

An operational notification can easily become overloaded.

For example, the automation may know:

```text
Application name
Object ID
Application ID
Credential ID
Credential type
Created date
Expiry date
Days remaining
Owner
Owner UPN
Owner object ID
Environment
Status
```

That does not mean every field needs to appear in Teams.

I normally ask:

> What information does someone actually need to decide whether they need to act?

For an expiry notification that may only be:

```text
Application
Credential type
Expiry date
Days remaining
Owner
```

Everything else can remain in the underlying report.

---

# Fix 6 - Be careful with long URLs

URLs are also part of the card payload.

A card containing many long links can therefore become surprisingly large.

Instead of displaying URLs as text:

```text
https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/...
```

use a short label such as:

```text
View application
```

with the URL stored in the Adaptive Card action.

This improves both readability and card size.

It does not eliminate the URL from the payload, but it prevents the same long URL from also being presented as unnecessary visible text.

---

# Fix 7 - Split results across multiple cards

If users genuinely need every record directly in Teams, another option is to split the data into smaller batches.

For example:

```text
Results: 36

Card 1 → records 1–10
Card 2 → records 11–20
Card 3 → records 21–30
Card 4 → records 31–36
```

Power Automate provides useful expressions for this:

```text
take()
```

and:

```text
skip()
```

For example:

```text
take(
    skip(
        variables('varResults'),
        variables('varOffset')
    ),
    variables('varBatchSize')
)
```

With:

```text
varOffset = 0
varBatchSize = 10
```

the first iteration returns:

```text
0–9
```

After increasing the offset to:

```text
10
```

the next iteration returns:

```text
10–19
```

and so on.

---

# But splitting cards should not be the first solution

Technically, sending six cards instead of one may solve the payload-size problem.

From a user experience perspective, however, this:

```text
Alert
Alert
Alert
Alert
Alert
Alert
```

may not be particularly useful.

It also increases the number of calls being made to the Teams connector and can introduce additional considerations around throttling.

I therefore prefer:

```text
One concise Teams notification
              +
      Full external report
```

unless there is a genuine requirement for all records to be displayed directly in Teams.

---

# Fix 8 - Add a maximum number of displayed records

I like to build this protection directly into flows rather than waiting for a payload error.

For example:

```text
varMaxCardItems = 10
```

Then:

```text
take(
    variables('varResults'),
    variables('varMaxCardItems')
)
```

This means the size of the card remains predictable even if the underlying dataset grows from:

```text
5 records
```

to:

```text
500 records
```

The notification does not become progressively larger.

---

# Show how many results were hidden

If I limit the results, I also make that clear to the user.

For example:

```text
length(variables('varResults'))
```

could provide the total count.

I could then add a message such as:

```text
24 credentials require attention. The 10 most urgent are shown below.
```

Or calculate the number not displayed:

```text
sub(
    length(variables('varResults')),
    variables('varMaxCardItems')
)
```

Producing:

```text
14 additional credentials are included in the full report.
```

This makes it clear that the card represents a summary rather than the complete result set.

---

# A better architecture

Instead of:

```text
Retrieve results
      ↓
Create enormous Adaptive Card
      ↓
Post everything to Teams
```

I prefer:

```text
Retrieve results
        ↓
Process and classify
        ↓
Store complete results
        ↓
Sort by priority
        ↓
Take highest-priority records
        ↓
Generate summary
        ↓
Post small Adaptive Card
        ↓
Link to complete results
```

This design has several advantages.

The Teams card remains:

* readable;
* predictable;
* fast;
* less likely to exceed connector limits;
* useful even if the dataset grows significantly.

---

# Example card design

Instead of trying to display every expiring credential, I might design the card like this:

```text
APPLICATION CREDENTIAL EXPIRY

27 credentials require attention.

CRITICAL
3 expire within 7 days

WARNING
8 expire within 30 days

NEXT TO EXPIRE

Finance Reporting API            2 days
HR Integration                   4 days
Service Management App           5 days
Document Processing              9 days
Automation Service              12 days

Showing the 5 most urgent of 27.

[View Full Report]
```

This provides the important information immediately without attempting to reproduce an entire reporting table inside Teams.

---

# Add severity summaries instead of more rows

Aggregated values often communicate more useful information than dozens of records.

For example:

```text
≤ 7 days       3
8–30 days      8
31–60 days    11
61–90 days     5
```

This gives someone an immediate indication of risk.

The detailed records can then be shown only for the highest-priority category.

---

# Why reducing the date range may not solve it

A common troubleshooting step is changing something such as:

```text
Credentials expiring within 90 days
```

to:

```text
Credentials expiring within 30 days
```

This may help, but it does not address the underlying design issue.

If the dataset grows again, the flow can fail again.

The same problem occurs if the fix is simply:

```text
Remove a few rows
```

The flow may work today and fail next month.

I therefore prefer putting an explicit maximum size on the **number of records presented**, rather than relying on the dataset naturally remaining small.

---

# Don't confuse payload limits with throttling

There are two different problems that can look similar during troubleshooting.

## Payload problem

```text
One message is too large.
```

Typical error:

```text
Request Entity too large
```

The solution is usually:

```text
Make each message smaller.
```

## Throttling problem

```text
Too many requests are being made in a short period.
```

The solution normally involves things such as:

* reducing request frequency;
* controlling concurrency;
* introducing delays where appropriate;
* reviewing connector limits.

Splitting one oversized card into 20 smaller cards may fix the first problem while increasing the chances of encountering the second.

That is another reason why I prefer concise summary cards where possible.

---

# Validate the finished Adaptive Card

Payload size is not the only reason an Adaptive Card can fail.

Before assuming every error is related to size, I also check:

* JSON syntax;
* quotation marks;
* commas and braces;
* supported schema properties;
* dynamic values;
* image URLs;
* Adaptive Card version compatibility.

Microsoft recommends validating generated card JSON when troubleshooting Adaptive Cards used with Power Automate.

This is especially useful when card JSON has been dynamically assembled rather than written as one static object.

---

# Add defensive logic

For important production automation, I prefer the flow to protect itself.

For example:

```text
Retrieve results
      ↓
Count results
      ↓
Are there more than 10?
      ↓
   Yes       No
    ↓         ↓
Top 10       All
    └────┬────┘
         ↓
 Build Adaptive Card
         ↓
     Post to Teams
```

The flow therefore controls card growth deliberately.

Another option is always using:

```text
take(array, 10)
```

regardless of the number of results.

If fewer than ten records exist, `take()` simply returns those available.

---

# What I would avoid

## Increasing the card until it barely fits

If a card currently sits just below the connector limit, it has very little tolerance for future growth.

I would rather redesign it than optimise it to sit immediately below the maximum.

---

## Hard-coding assumptions about data volume

For example:

```text
There will never be more than 20 applications.
```

Systems change.

A good notification design should remain reliable even when the amount of underlying data increases substantially.

---

## Treating Teams as the database

Teams is an excellent place to tell someone:

```text
Something requires your attention.
```

It is not necessarily the best place to present hundreds of rows of operational data.

---

## Sending dozens of cards by default

Chunking is useful when there is a genuine requirement for detailed information inside Teams.

It should not normally be the first solution to a reporting problem.

---

# Recommended pattern

For most operational alerts, my preferred pattern is:

```text
                 FULL DATASET
                      │
                      ▼
             SharePoint / Dataverse
                      │
                      │
              ┌───────┴────────┐
              │                │
              ▼                ▼
         Power BI         Power Automate
                               │
                               ▼
                         Sort by urgency
                               │
                               ▼
                           Take top N
                               │
                               ▼
                       Create summary
                               │
                               ▼
                      Teams Adaptive Card
                               │
                               ▼
                       View Full Report
```

Teams provides the notification.

The underlying system provides the detail.

---

# Troubleshooting checklist

When I encounter an Adaptive Card payload error, I normally work through the following checks:

1. **Confirm the actual Teams action error.**

2. **Inspect the completed Adaptive Card JSON.**

3. **Check how many dynamic records are being inserted.**

4. **Look for deeply repeated `Container`, `ColumnSet` and `TextBlock` structures.**

5. **Remove unnecessary fields and formatting.**

6. **Sort the results by importance.**

7. **Use `take()` to cap the number shown.**

8. **Display the total number of results separately.**

9. **Move the complete dataset to a proper reporting location.**

10. **Add a link from Teams to the complete report.**

11. **Consider chunking only where users genuinely need every record in Teams.**

12. **Test the flow with a deliberately large dataset rather than only the normal development dataset.**

---

# Testing for scale

One lesson I find particularly important is testing the automation with more data than I expect it to encounter normally.

A card that works with:

```text
3 records
```

does not prove that it will work with:

```text
30 records
```

When developing a dynamic Adaptive Card, I therefore try to test:

```text
Small dataset
     ↓
Normal dataset
     ↓
Large dataset
     ↓
Worst reasonable case
```

This helps identify payload-size problems before they occur in production.

---

# Final design principle

The most important lesson is that an Adaptive Card should not grow indefinitely with the underlying dataset.

Instead of thinking:

```text
How can I squeeze all these records into the card?
```

I prefer to ask:

```text
What does the person receiving this notification actually need to know?
```

Usually the answer is:

```text
What happened?
How serious is it?
What requires attention first?
How many items are affected?
Where can I see the details?
```

A card designed around those questions will usually be smaller, easier to understand and considerably more resilient.

---

## Key takeaway

If a Power Automate Teams action fails because an Adaptive Card exceeds the payload limit, reducing a few rows may get the flow running again, but it does not solve the underlying scalability problem.

A stronger pattern is:

```text
Summarise
   +
Prioritise
   +
Limit
   +
Link to the detail
```

That turns the Adaptive Card from an oversized report into what it is particularly good at being:

**a concise, actionable notification.**
