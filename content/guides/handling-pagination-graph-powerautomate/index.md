---

title: "Handling Pagination When Calling Microsoft Graph from Power Automate"
date: 2026-09-21
tags:

- Microsoft Graph
- Power Automate

---

When working with Microsoft Graph in Power Automate, one of the easiest mistakes to make is assuming that a successful API call has returned **all available records**.

In many cases, it has not.

Microsoft Graph frequently returns data in pages. If there are more records available than can be returned in a single response, Graph provides an `@odata.nextLink` property containing the URL for the next page.

If that link is ignored, a flow may process only the first set of results without producing an obvious error.

This guide shows how I handle Microsoft Graph pagination in Power Automate so that a flow continues retrieving records until every page has been processed.

---

## The problem

Consider a request such as:

```http
GET https://graph.microsoft.com/v1.0/users
```

A simplified response may look like this:

```json
{
  "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#users",
  "value": [
    {
      "id": "12345",
      "displayName": "Example User"
    }
  ],
  "@odata.nextLink": "https://graph.microsoft.com/v1.0/users?$skiptoken=..."
}
```

The important property is:

```text
@odata.nextLink
```

Its presence means:

> There are more records available.

The URL already contains the information Graph needs to retrieve the next page, normally including a paging token.

The flow should therefore:

1. Make the initial Graph request.
2. Process or store the returned `value` array.
3. Check for `@odata.nextLink`.
4. If it exists, call the URL provided by Graph.
5. Repeat until no next link is returned.

---

# Why this matters

Pagination can easily go unnoticed during development.

For example, a flow might be tested in a development tenant containing only a few dozen accounts. The same flow could later run against a production tenant containing thousands of users.

Without pagination, the flow may still:

* complete successfully;
* return HTTP `200`;
* process valid users;
* update SharePoint or Dataverse;
* send notifications.

The problem is that it may have processed only part of the dataset.

This makes pagination particularly important for administrative automation such as:

* user lifecycle management;
* inactive account reporting;
* licence reporting;
* application and service principal inventories;
* device inventories;
* group membership processing;
* SharePoint reporting;
* security and governance automation.

---

# The pattern I use

For Power Automate, I normally use a **Do until loop** controlled by a variable containing the URL for the next Graph request.

The basic structure looks like this:

```text
Initialise variables
        ↓
Set Graph URL
        ↓
Do until Graph URL is empty
        ↓
Call Microsoft Graph
        ↓
Process response.value
        ↓
Set Graph URL = @odata.nextLink
        ↓
Repeat
```

Once Graph stops returning `@odata.nextLink`, the URL variable becomes empty and the loop ends.

---

# Step 1 - Initialise the variables

Create a string variable:

```text
Name: varGraphUrl
Type: String
```

Set its initial value to the Graph endpoint you want to query.

For example:

```text
https://graph.microsoft.com/v1.0/users
```

I also commonly create an array variable:

```text
Name: varResults
Type: Array
Value: []
```

This is useful when I need to collect all records before processing them later.

Whether an array variable is necessary depends on the flow.

For large datasets, processing each page immediately can be more efficient than building one very large array in memory.

---

# Step 2 - Create the Do until loop

Add a **Do until** action.

The loop should continue until `varGraphUrl` is empty.

One way of expressing the condition is:

```text
empty(variables('varGraphUrl'))
```

The loop therefore finishes once this expression evaluates to:

```text
true
```

At the beginning of the process `varGraphUrl` contains the initial Graph endpoint, so the loop starts normally.

---

# Step 3 - Call Microsoft Graph

Inside the loop, make the HTTP request using the URL stored in the variable.

Conceptually:

```http
GET @{variables('varGraphUrl')}
```

The exact HTTP action depends on how the flow authenticates to Microsoft Graph.

For example, the request might be made through:

* HTTP with Microsoft Entra ID;
* an authenticated custom connector;
* another authorised Graph integration.

The important part of the pagination design is that the request URI comes from `varGraphUrl`.

For the first iteration this will contain the original endpoint.

For later iterations it will contain the URL returned in `@odata.nextLink`.

---

# Step 4 - Read the records from `value`

Microsoft Graph normally returns collections inside the `value` property.

For example:

```json
{
  "value": [
    {
      "id": "1",
      "displayName": "User One"
    },
    {
      "id": "2",
      "displayName": "User Two"
    }
  ]
}
```

The array can normally be referenced with an expression similar to:

```text
body('HTTP')?['value']
```

You can then either:

### Process each page immediately

Use an **Apply to each** against:

```text
body('HTTP')?['value']
```

and perform whatever work is required for each object.

This is often my preferred approach when the records do not need to be combined into one large dataset.

### Or collect the results

If the complete dataset is required later in the flow, the records can be added to an array.

The exact implementation depends on what will be done with the results afterwards.

---

# Step 5 - Capture `@odata.nextLink`

After processing the current page, update `varGraphUrl`.

Use:

```text
body('HTTP')?['@odata.nextLink']
```

However, I prefer to handle the possibility that the property does not exist.

A safer expression is:

```text
coalesce(
    body('HTTP')?['@odata.nextLink'],
    ''
)
```

This does two things.

If another page exists:

```text
varGraphUrl = https://graph.microsoft.com/...
```

If there are no more pages:

```text
varGraphUrl = ''
```

The **Do until** condition then detects the empty string and finishes.

---

# Complete flow logic

The completed pattern can be represented as:

```text
Initialise varGraphUrl
    |
    |-- https://graph.microsoft.com/v1.0/users
    |
Initialise varResults
    |
    |-- []
    |
Do until: empty(varGraphUrl)
    |
    +-- HTTP GET
    |      URI = varGraphUrl
    |
    +-- Process body('HTTP')?['value']
    |
    +-- Set varGraphUrl
           |
           +-- coalesce(
                   body('HTTP')?['@odata.nextLink'],
                   ''
               )
```

Graph controls the pagination and Power Automate simply follows the links until no more remain.

---

# Do not construct the next URL manually

One important rule is:

**Use the URL returned by `@odata.nextLink`.**

Do not try to extract the paging token and reconstruct the URL yourself unless there is a specific technical reason to do so.

For example, Graph may return something similar to:

```text
https://graph.microsoft.com/v1.0/users?$skiptoken=RFNwdAIAAQAA...
```

The safest approach is simply:

```text
GET <the entire @odata.nextLink value>
```

The paging information should generally be treated as opaque.

---

# Using `$select`

If I only need a few properties, I reduce the response size with `$select`.

Instead of:

```http
GET https://graph.microsoft.com/v1.0/users
```

I might use:

```http
GET https://graph.microsoft.com/v1.0/users?$select=id,displayName,userPrincipalName,accountEnabled
```

This can significantly reduce unnecessary data being transferred and processed by the flow.

It also makes the returned JSON easier to work with.

Pagination works in exactly the same way.

Graph includes the appropriate query information in the next link it returns.

---

# Using `$top`

Some Microsoft Graph APIs allow the requested page size to be influenced using `$top`.

For example:

```http
GET https://graph.microsoft.com/v1.0/users?$top=500
```

It is important not to confuse `$top` with pagination.

Requesting a larger page does **not** mean:

> Return every record in the tenant.

It means:

> Request up to this number of records for this page, where supported.

Graph may still return an `@odata.nextLink`.

The flow should therefore continue checking for pagination regardless of the requested page size.

---

# A reusable expression

One of the most useful expressions in this pattern is:

```text
coalesce(
    body('HTTP')?['@odata.nextLink'],
    ''
)
```

Using the safe-navigation operator:

```text
?['@odata.nextLink']
```

means the flow does not fail simply because the property is absent.

`coalesce()` then converts the missing value into an empty string which can be used by the loop condition.

---

# Processing records page-by-page vs storing everything

There are two common approaches.

## Option 1 - Process each page immediately

```text
Graph page
   ↓
Apply to each
   ↓
Perform actions
   ↓
Get next page
```

I generally prefer this approach for large datasets.

Advantages include:

* less data held in flow variables;
* simpler memory usage;
* processing starts immediately;
* easier handling of large collections.

For example, a user lifecycle flow could retrieve one page of accounts, evaluate those users, then continue to the next page.

---

## Option 2 - Build one complete array

```text
Graph page 1 ─┐
Graph page 2 ─┤
Graph page 3 ─┼── Complete array
Graph page 4 ─┘
```

This can be useful when later steps require the entire dataset.

Examples might include:

* generating a single report;
* comparing records across the complete collection;
* passing all results to another service;
* producing a consolidated output.

The trade-off is that very large arrays can make Power Automate flows more resource-intensive and harder to troubleshoot.

---

# Handling throttling

Pagination can result in many Graph requests, particularly in large environments.

Microsoft Graph may throttle requests and return:

```http
429 Too Many Requests
```

Where appropriate, production flows should account for this.

The response may include a `Retry-After` header indicating how long the caller should wait before retrying.

Other useful design considerations include:

* avoiding unnecessary Graph calls;
* retrieving only required properties with `$select`;
* avoiding excessive nested HTTP requests;
* using sensible Power Automate retry policies;
* limiting concurrency where appropriate.

Pagination solves the problem of retrieving all records, but the wider flow still needs to be designed with Graph service limits in mind.

---

# Check the Do until limits

A Power Automate **Do until** action has execution limits.

If a Graph query could require a large number of pages, I check the loop configuration rather than relying blindly on the defaults.

This is particularly important when using small Graph page sizes against large directories.

A flow can otherwise stop because the Power Automate loop limit has been reached rather than because Graph has finished returning data.

---

# Common mistakes

## Only reading the first `value` array

This is probably the easiest pagination issue to introduce.

```text
HTTP → Parse JSON → Apply to each
```

may look completely correct while processing only the first page.

Always check the Graph response for:

```text
@odata.nextLink
```

---

## Assuming `$top` disables pagination

It does not.

Even when `$top` is specified, continue checking for `@odata.nextLink`.

---

## Creating paging tokens manually

Avoid trying to manipulate `$skiptoken` values.

Use the complete URL Graph provides.

---

## Collecting thousands of records unnecessarily

If each user can be processed independently, processing page-by-page is usually cleaner than building a massive array first.

---

## Forgetting about throttling

A flow that works against 50 test accounts may behave very differently against several thousand production accounts.

Pagination, API request volume and retry behaviour should be considered together.

---

# Example: retrieving all enabled users

As an example, the initial query could be:

```http
https://graph.microsoft.com/v1.0/users?$select=id,displayName,userPrincipalName,accountEnabled
```

The flow starts with:

```text
varGraphUrl =
https://graph.microsoft.com/v1.0/users?$select=id,displayName,userPrincipalName,accountEnabled
```

Inside the loop:

```text
HTTP GET → variables('varGraphUrl')
```

Process:

```text
body('HTTP')?['value']
```

Then update the URL:

```text
coalesce(
    body('HTTP')?['@odata.nextLink'],
    ''
)
```

The cycle continues:

```text
Request page 1
       ↓
Process records
       ↓
@odata.nextLink exists
       ↓
Request page 2
       ↓
Process records
       ↓
@odata.nextLink exists
       ↓
Request page 3
       ↓
Process records
       ↓
No @odata.nextLink
       ↓
Flow continues
```

This pattern can be reused for many Microsoft Graph collection endpoints.

---

# A useful troubleshooting technique

When building the flow, I normally inspect the raw response from the HTTP action before adding the full pagination logic.

I look specifically for:

```json
"value": [...]
```

and:

```json
"@odata.nextLink": "..."
```

If `@odata.nextLink` is present, I know immediately that the current response is not the complete dataset.

This is also useful when troubleshooting an existing automation which appears to be missing records.

---

# Final design

The core pagination logic is surprisingly small:

```text
1. Store the initial Graph URL.

2. Call Graph.

3. Process:
   body('HTTP')?['value']

4. Store:
   coalesce(
       body('HTTP')?['@odata.nextLink'],
       ''
   )

5. Repeat until the URL is empty.
```

The important part is not the complexity of the solution, but recognising that pagination needs to be handled in the first place.

For small test datasets, ignoring pagination may appear to work perfectly. In larger Microsoft 365 environments, however, correctly following `@odata.nextLink` is essential if an automation needs to reliably process the complete dataset.

---

## Key takeaway

Whenever I build a Power Automate flow that retrieves a collection from Microsoft Graph, one of the first things I check is:

```text
Does this response contain @odata.nextLink?
```

If it does, I treat pagination as part of the API integration rather than an optional enhancement.

That small design decision prevents an automation from silently processing only part of the environment.
