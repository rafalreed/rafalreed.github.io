---

title: "Understanding Entra Sign-In Dates"
date: 2026-09-22
description: "A practical guide to Microsoft Entra ID sign-in timestamps, including interactive, non-interactive and successful sign-ins, and how to choose the correct value when identifying inactive accounts."
tags:

- Microsoft Entra ID
- Microsoft Graph
- Identity
- Power Automate
- Microsoft 365

---

When investigating inactive accounts in Microsoft Entra ID, one of the first questions is usually:

**When did this user last sign in?**

Unfortunately, the answer is not always as simple as looking at a single date.

Microsoft Entra records several different types of sign-in activity, and they represent different things. It is therefore possible to see a user with a **Last interactive sign-in** from February while Microsoft Graph reports their **Last successful sign-in** as November.

Both values can be correct.

Understanding the difference is particularly important when building automated processes that identify inactive users, remove licences, disable accounts or trigger account deletion.

## The main sign-in timestamps

Microsoft Graph exposes sign-in information through the user's `signInActivity` property.

The three most useful timestamps are:

| Property                           | What it represents                                                | Includes failures? |
| ---------------------------------- | ----------------------------------------------------------------- | ------------------ |
| `lastSignInDateTime`               | Most recent **interactive sign-in attempt**                       | Yes                |
| `lastNonInteractiveSignInDateTime` | Most recent **non-interactive sign-in attempt**                   | Yes                |
| `lastSuccessfulSignInDateTime`     | Most recent **successful interactive or non-interactive sign-in** | No                 |

Microsoft specifically recommends `lastSuccessfulSignInDateTime` when you need to determine when an account was actually accessed.

That distinction is very important.

---

## 1. Last interactive sign-in

The Graph property is:

```text
lastSignInDateTime
```

An interactive sign-in is one where the user actively participates in authentication.

Examples include signing in with:

* a username and password
* MFA
* Microsoft Authenticator
* biometric authentication
* another interactive authentication method

However, `lastSignInDateTime` does **not** mean the authentication succeeded.

Microsoft documents this value as the most recent interactive **attempt**, whether successful or unsuccessful.

For example:

```text
Last successful sign-in: 24 November
Last interactive sign-in: 2 February
```

At first glance this looks wrong.

But the February event could simply have been:

```text
2 February
User attempts to sign in
        ↓
Password incorrect / Conditional Access blocks access / account disabled
        ↓
Interactive sign-in timestamp is updated
        ↓
Successful sign-in timestamp remains 24 November
```

This is why `lastSignInDateTime` should not be treated as proof that the user actually accessed the environment.

---

## 2. Last non-interactive sign-in

The Graph property is:

```text
lastNonInteractiveSignInDateTime
```

Non-interactive authentication happens without the user being directly prompted to authenticate again.

This commonly occurs when an application obtains another access token on behalf of an already authenticated user.

Examples include:

* Outlook refreshing authentication
* Teams requesting another access token
* an Office application using an existing session
* Single Sign-On
* refresh-token activity

A user could therefore generate non-interactive activity without manually entering their credentials.

Non-interactive events can occur frequently. Entra may group similar events together in the sign-in logs to make them easier to review.

Just like `lastSignInDateTime`, this property records an **attempt**, so it may represent either a successful or unsuccessful authentication attempt.

---

## 3. Last successful sign-in

The most useful property for many inactive-account scenarios is:

```text
lastSuccessfulSignInDateTime
```

Unlike the previous two properties, this value only moves forward when authentication actually succeeds.

It includes both:

```text
Successful interactive authentication
                 OR
Successful non-interactive authentication
```

Microsoft describes this property as the most recent successful interactive **or non-interactive** sign-in and specifically recommends it for determining when an account was genuinely accessed.

For an inactive-account lifecycle process, this is normally the strongest starting point.

For example:

```text
Current date:                 1 March
Last interactive attempt:    20 February
Last successful sign-in:     15 November
```

If you used `lastSignInDateTime`, the account might appear to have been active only nine days ago.

But that February authentication could have failed.

Using `lastSuccessfulSignInDateTime` shows that the account has not successfully authenticated since November.

That is a very different result.

---

# Why the Entra portal and an export may show different dates

This difference can cause confusion when someone compares an automated report against the Entra admin centre.

Imagine an automated report contains:

```text
User: Alex Smith

Last successful sign-in:
24 November 2025
```

Someone opens the user's Entra profile and sees:

```text
Last interactive sign-in:
2 February 2026
```

It is tempting to assume the export is outdated.

It may not be.

The values are measuring two different things:

```text
24 November
Successful authentication
        ↓
lastSuccessfulSignInDateTime = 24 November


2 February
Interactive authentication attempt
        ↓
Authentication fails
        ↓
lastSignInDateTime = 2 February
        ↓
lastSuccessfulSignInDateTime remains 24 November
```

The next step would be to examine the user's detailed sign-in logs around 2 February and check the **Status** of the event.

---

# Which date should I use for inactive accounts?

For most inactive-account reporting, I would use:

```text
lastSuccessfulSignInDateTime
```

as the primary activity date.

The logic becomes:

```text
Has the account successfully authenticated recently?
                    ↓
                  YES
                    ↓
              Account active

                    OR

Has the account successfully authenticated recently?
                    ↓
                   NO
                    ↓
          Potentially inactive
                    ↓
       Apply additional checks
```

Those additional checks are important.

A sign-in timestamp alone should normally not be enough to automatically delete an identity.

Depending on the environment, you may also need to consider things such as:

* account creation date
* whether the account is enabled
* account type
* service accounts
* shared or resource accounts
* meeting-room accounts
* guest users
* approved exemptions
* administrative accounts
* assigned licences
* business ownership

The inactivity date identifies candidates. Your organisation's lifecycle rules determine what happens next.

---

# An important limitation: 1 December 2023

There is an important caveat when using:

```text
lastSuccessfulSignInDateTime
```

Microsoft made this property available from **1 December 2023**, and historical successful sign-ins were **not backfilled**.

This means a value such as:

```json
"lastSuccessfulSignInDateTime": null
```

does not always mean:

> This user has never signed in.

For an old account, it could instead mean there has been no successful sign-in recorded for this property since it became available.

Therefore, avoid treating `null` as automatic evidence that an account is unused.

For older accounts, you may need additional evidence such as the account creation date, available sign-in information and your organisation's lifecycle policy.

---

# Retrieving sign-in activity with Microsoft Graph

A simple Graph request can retrieve the relevant properties:

```http
GET https://graph.microsoft.com/v1.0/users?$select=id,displayName,userPrincipalName,accountEnabled,createdDateTime,signInActivity
```

A returned user might look similar to this:

```json
{
    "id": "00000000-0000-0000-0000-000000000000",
    "displayName": "Alex Smith",
    "userPrincipalName": "alex.smith@contoso.com",
    "accountEnabled": true,
    "createdDateTime": "2024-01-08T09:22:14Z",
    "signInActivity": {
        "lastSignInDateTime": "2026-02-02T10:12:31Z",
        "lastNonInteractiveSignInDateTime": "2026-01-14T08:43:11Z",
        "lastSuccessfulSignInDateTime": "2025-11-24T14:06:52Z"
    }
}
```

From this result we can determine:

```text
Latest interactive attempt:
2 February 2026

Latest non-interactive attempt:
14 January 2026

Latest successful authentication:
24 November 2025
```

For an inactivity calculation, I would normally base the calculation on:

```text
24 November 2025
```

rather than the February interactive attempt.

---

# Using the data in Power Automate

The same Graph request can be called from Power Automate.

For example, the successful timestamp for the current user could be referenced with an expression similar to:

```text
items('Apply_to_each')?['signInActivity']?['lastSuccessfulSignInDateTime']
```

Before performing date calculations, check whether the value exists:

```text
empty(
    items('Apply_to_each')?['signInActivity']?['lastSuccessfulSignInDateTime']
)
```

This allows the flow to handle users with no available successful sign-in timestamp separately rather than treating a null value as a valid date.

A simplified lifecycle might look like:

```text
Get users from Microsoft Graph
        ↓
Exclude account types outside the process
        ↓
Read lastSuccessfulSignInDateTime
        ↓
Is a value available?
   ↓                ↓
  YES               NO
   ↓                 ↓
Calculate        Apply separate
inactivity       fallback logic
   ↓
Compare against
inactivity threshold
   ↓
Warning / review / remediation
```

---

# Do not forget Graph pagination

There is another important consideration when retrieving users at scale.

When `signInActivity` is included in a users query, Microsoft Graph limits the maximum page size to **500 users**.

For a tenant containing thousands of accounts, one request will therefore not return everybody.

Your automation needs to follow:

```text
@odata.nextLink
```

until no next link is returned.

Otherwise, an inactive-account report might silently analyse only the first page of users.

---

# Permissions and licensing

Microsoft currently documents `signInActivity` as requiring Microsoft Entra ID P1 or P2 and the `AuditLog.Read.All` permission.

When building an application-based automation that retrieves users and their activity, commonly required Microsoft Graph application permissions include:

```text
User.Read.All
AuditLog.Read.All
```

As with any Graph integration, grant only the permissions required by the solution.

---

# Sign-in activity is not real-time

Another source of apparent discrepancies is replication delay.

The summary `signInActivity` properties are not designed as real-time authentication telemetry and Microsoft notes that they can take up to **24 hours** to update.

Therefore, if somebody has just signed in and you need to confirm it immediately, use the detailed Entra sign-in logs instead.

Think of the two sources differently:

| Source           | Best used for                                                                 |
| ---------------- | ----------------------------------------------------------------------------- |
| `signInActivity` | Reporting, lifecycle automation and identifying potentially inactive accounts |
| Sign-in logs     | Detailed investigation and recent authentication events                       |

---

# Investigating a discrepancy

If an automated report and Entra appear to disagree, I normally investigate the individual account before assuming either value is wrong.

Start in:

```text
Microsoft Entra admin centre
→ Entra ID
→ Monitoring & health
→ Sign-in logs
```

Filter the results to the affected user and examine events around the date in question.

Check:

```text
Date and time
Status
Application
Resource
Interactive / non-interactive
Conditional Access
Failure reason
```

If the newer interactive event shows a failure, the difference is explained:

```text
Last interactive sign-in
≠
Last successful sign-in
```

For programmatic investigations, individual sign-in events can also be queried through:

```http
GET https://graph.microsoft.com/v1.0/auditLogs/signIns
```

Unlike `signInActivity`, this endpoint returns individual authentication events and can therefore be used to investigate exactly what happened during a particular sign-in.

---

# A useful rule of thumb

I find the easiest way to remember the difference is:

```text
lastSignInDateTime
= When did the user last TRY to interactively authenticate?

lastNonInteractiveSignInDateTime
= When did something last TRY to authenticate on behalf of the user?

lastSuccessfulSignInDateTime
= When was the account last ACTUALLY authenticated successfully?
```

For security investigations, all three can be useful.

For determining genuine account usage, the successful timestamp is usually the most meaningful.

---

# Final thoughts

Sign-in dates look simple until they become part of an automated lifecycle process.

The key lesson is that **a sign-in attempt is not the same as a successful sign-in**.

Using `lastSignInDateTime` alone can make an inactive account appear active because even an unsuccessful login attempt can update the value.

For inactive-account reporting, `lastSuccessfulSignInDateTime` generally gives a much better indication of genuine account usage, provided that its December 2023 historical limitation and possible reporting latency are handled correctly.

Once those differences are understood, Entra sign-in data becomes much easier to interpret — and much safer to use as the basis for automated identity lifecycle decisions.

## Microsoft documentation used

* Microsoft Graph — `signInActivity` resource type
* Microsoft Graph — List users and retrieve `signInActivity`
* Microsoft Entra — Sign-in log activity details
* Microsoft Entra — Log latency and last sign-in information
* Microsoft Graph — List sign-in events
