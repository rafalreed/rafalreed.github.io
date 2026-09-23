---

title: "SharePoint Site Types: Which One Should You Use?"
date: 2026-09-23
description: "A quick guide to SharePoint Team, Communication, Hub, Channel and Home sites, including when to use each type, their advantages and disadvantages, and practical examples."
tags:

- SharePoint
- SharePoint Online
- Best Practices
- Microsoft 365
- Site Architecture
- Governance

---

When creating a new SharePoint site, one of the first decisions is choosing the right type of site.

At a high level, modern SharePoint is built around two main site types:

* **Team sites** – for collaboration
* **Communication sites** – for publishing and sharing information

There are also several important variations and architectural concepts, such as **hub sites**, **Teams channel sites** and **home sites**.

This quick guide explains what each one is, when to use it, and the main advantages and disadvantages.

---

# Quick Comparison

| Site type          | Best for                                   | Typical audience         | Main purpose                |
| ------------------ | ------------------------------------------ | ------------------------ | --------------------------- |
| Team site          | Teams, projects and working groups         | Small/medium group       | Collaboration               |
| Communication site | Departments, portals and information sites | Large audience           | Publishing                  |
| Hub site           | Connecting related SharePoint sites        | Organisation-wide        | Navigation and organisation |
| Teams channel site | Private/shared Teams channels              | Specific channel members | Restricted collaboration    |
| Home site          | Main organisational intranet               | Whole organisation       | Central landing page        |
| Classic site       | Legacy SharePoint solutions                | Existing users           | Legacy compatibility        |

Microsoft describes **Team**, **Communication** and **Hub** sites as the main building blocks of a modern SharePoint intranet.

---

# 1. Team Site

## Best for

Use a **Team site** when a group of people need to actively work together.

Examples include:

* Project teams
* Engineering teams
* Working groups
* Operational teams
* Case management
* Shared document repositories
* Power Apps or Power Automate solutions

A Team site is primarily designed for **collaboration rather than publishing**. Members would normally create, edit and work with content rather than simply read it.

### Example

```text
Infrastructure Project
│
├── Documents
├── Project Risks
├── Actions
├── Technical Documentation
└── Project Updates
```

Everyone in the project team can work with the content.

---

## Microsoft 365 Group-Connected Team Site

When you create a normal modern Team site, it is normally connected to a **Microsoft 365 Group**.

That provides additional Microsoft 365 resources such as:

```text
Microsoft 365 Group
│
├── SharePoint Team Site
├── Shared Mailbox
├── Shared Calendar
├── Planner
└── Microsoft Teams
```

Microsoft recommends managing membership of these sites through the associated Microsoft 365 Group or Microsoft Teams team.

### Pros

* Excellent for collaboration
* Integrates naturally with Microsoft Teams
* Microsoft 365 Group manages membership
* Good for document co-authoring
* Supports SharePoint Lists
* Works well with Power Automate and Power Apps
* Easy to expand with Planner and other Microsoft 365 services

### Cons

* Creates additional Microsoft 365 resources
* Permissions can become confusing if SharePoint permissions and Teams/Group membership are managed separately
* Usually not ideal for large information portals
* Members normally have relatively high contribution permissions

---

# 2. Team Site Without a Microsoft 365 Group

There is another useful variation: a Team site that is **not connected to a Microsoft 365 Group**.

This can be useful when you need SharePoint functionality without needing:

* Teams
* Planner
* A group mailbox
* A group calendar
* Other Microsoft 365 Group services

For example:

```text
Power Platform Application Data
│
├── Configuration List
├── Contacts
├── Job Log
└── Application Documents
```

A non-group-connected site can be useful for SharePoint-backed applications and solutions where you want more direct control over SharePoint permissions. Microsoft's Microsoft 365 community guidance specifically identifies app data, lists, libraries and scenarios with differing permissions as potential uses.

### Pros

* Simpler when only SharePoint is required
* Greater flexibility over traditional SharePoint permissions
* Good location for application data
* Useful for Power Apps and Power Automate solutions
* Avoids unnecessary Microsoft 365 Group resources

### Cons

* No automatic Teams integration
* Membership must be managed separately
* No associated group mailbox or Planner
* Users may find it less obvious where the site belongs organisationally

---

# 3. Communication Site

## Best for

Use a **Communication site** when a small number of people publish information to a much larger audience.

Think:

> Few people create - many people read.

Typical examples include:

* HR portal
* IT support portal
* Department homepage
* Policies and guidance
* Internal news
* Service catalogue
* Corporate communications
* Project information portal

Microsoft describes Communication sites as being designed for broad communication, where relatively few contributors create content for many readers.

### Example

```text
Technology Department
│
├── Latest News
├── Services
├── Policies
├── Support
├── Projects
└── Useful Links
```

Most employees would have **Read** access while a smaller group maintains the site.

---

## Pros

* Excellent for publishing information
* Designed for visually rich pages
* Good for large audiences
* Strong use of News, Hero and Quick Links web parts
* Straightforward Owners / Members / Visitors permission model
* Excellent foundation for an intranet
* Does not automatically create a Microsoft 365 Group

## Cons

* Not designed primarily for day-to-day team collaboration
* Doesn't automatically provide Teams, Planner or a shared mailbox
* Requires proper content ownership to prevent information becoming outdated
* May require additional planning around navigation and publishing

---

# Team Site vs Communication Site

A very simple rule is:

```text
Are people WORKING together?

        YES
         ↓
     Team Site
```

versus:

```text
Are a few people PUBLISHING information
for many people to consume?

        YES
         ↓
Communication Site
```

For example:

**Finance employees collaboratively preparing the annual budget**

→ Team site

**Finance publishing expenses guidance for all employees**

→ Communication site

That distinction solves most SharePoint site-selection decisions.

---

# 4. Hub Site

A **Hub site isn't really a completely separate site template**.

Instead, an existing Team or Communication site can be registered as a **Hub** by a SharePoint administrator.

Hub sites are used to connect related SharePoint sites.

For example:

```text
Technology Hub
│
├── Infrastructure Team
├── Power Platform Team
├── Service Desk
├── Cyber Security
└── Architecture
```

Each team can maintain its own SharePoint site while the Hub provides a shared structure.

---

## What a Hub Provides

Hub sites can provide:

* Shared navigation
* Consistent branding
* Aggregated news
* Aggregated content
* Search across related sites
* Logical organisation of sites

Microsoft describes hubs as the **connective tissue** used to organise families of Team and Communication sites.

Importantly, joining a site to a Hub **does not automatically change the permissions of either site**.

---

## Pros

* Excellent for organising large SharePoint environments
* Sites remain independent
* Provides consistent navigation
* Helps users discover related sites
* Can aggregate news and information
* Avoids creating complicated subsite structures

## Cons

* Requires governance and planning
* Normally requires SharePoint Administrator involvement
* Does not automatically standardise permissions
* Poorly designed hubs can create confusing navigation
* Not every site necessarily needs to belong to a Hub

---

# Avoid Building Everything with Subsites

Older SharePoint environments often looked like this:

```text
Corporate
│
└── Technology
    │
    └── Infrastructure
        │
        └── Cloud
```

Modern SharePoint architecture generally favours separate site collections connected using **Hub sites** instead.

Microsoft recommends hubs rather than subsites for organising modern SharePoint environments.

A modern structure might therefore look like:

```text
Technology Hub
│
├── Infrastructure Site
├── Cloud Site
├── Development Site
└── Service Desk Site
```

This makes sites easier to restructure later.

---

# 5. Microsoft Teams Channel Site

Microsoft Teams and SharePoint are closely connected.

Every Microsoft Team has a SharePoint Team site behind it.

For normal **Standard channels**, documents are normally stored within folders in the Team's main SharePoint site.

However:

**Private channels** and **Shared channels** create separate SharePoint sites.

For example:

```text
Microsoft Team: Technology Project

Main SharePoint Site
├── General
├── Planning
└── Documentation

Private Channel: Project Leadership
        ↓
Separate SharePoint Site
```

---

## Best for

These sites are automatically created when Teams requires isolated membership.

Typical examples:

* Leadership channels
* Confidential project groups
* Cross-organisation Shared channels
* Restricted working groups

---

## Pros

* Membership follows the Teams channel
* Provides isolation from the parent Team
* Automatically created and managed
* Useful for restricted collaboration

## Cons

* Can significantly increase the number of SharePoint sites
* Users may not realise that another SharePoint site exists
* Permissions should generally be managed through Teams rather than directly in SharePoint
* Can make governance and administration more complicated

### Best Practice

Avoid manually changing the permissions of Teams channel sites unless you understand the implications.

Manage membership primarily through **Microsoft Teams**.

---

# 6. SharePoint Home Site

A **Home site** is a Communication site that has been designated as a central organisational landing page.

It can act as the front door to an organisation's SharePoint intranet.

For example:

```text
Organisation Home
│
├── Corporate News
├── HR
├── Technology
├── Finance
├── Policies
├── Applications
└── Useful Links
```

Users can then navigate into different Communication, Team and Hub sites.

---

## Best for

* Corporate intranets
* Organisation-wide navigation
* Corporate news
* Important organisational resources
* Viva Connections experiences

---

## Pros

* Provides a recognisable central entry point
* Good for organisation-wide news
* Supports global navigation scenarios
* Integrates with broader intranet architecture
* Can reinforce organisational branding

## Cons

* Requires considerable content planning
* Usually needs central ownership
* Poor navigation design can make the intranet difficult to use
* Not intended as a replacement for individual Team or Communication sites

Think of a Home site as:

> **The front door to your intranet**

rather than the place where every piece of content should live.

---

# 7. Classic SharePoint Sites

You may also encounter **Classic SharePoint sites**.

These are mainly associated with older SharePoint architectures and solutions.

They may contain things such as:

* Classic web parts
* Older publishing functionality
* Subsites
* Custom master pages
* Older SharePoint customisations

Microsoft still supports classic functionality in various scenarios, but modern Team and Communication sites are the preferred foundation for new SharePoint Online solutions. Microsoft specifically recommends using Hub sites instead of building new architectures around subsites.

---

## Pros

* Supports existing legacy solutions
* May be required for older SharePoint customisations
* Organisations may already have significant content built on them

## Cons

* Older user experience
* More difficult to integrate with modern Microsoft 365 experiences
* Often relies heavily on subsites
* Can be more difficult to maintain
* Generally not the best starting point for a new SharePoint Online solution

### Best Practice

For a new solution, start with modern SharePoint unless there is a specific technical requirement for classic functionality.

---

# Which Site Should I Choose?

Use this simplified decision tree:

```text
What are you trying to build?
        │
        ├── A team or project workspace
        │        ↓
        │     Team Site
        │
        ├── Information portal / department site
        │        ↓
        │  Communication Site
        │
        ├── Collection of related sites
        │        ↓
        │      Hub Site
        │
        ├── Organisation-wide intranet landing page
        │        ↓
        │      Home Site
        │
        ├── Restricted Teams channel
        │        ↓
        │   Teams creates a Channel Site
        │
        └── SharePoint storage for an app/automation
                 ↓
        Consider a Team Site without
        a Microsoft 365 Group
```

---

# Some Practical Examples

### Scenario 1

> Ten engineers need somewhere to collaborate on documentation and project files.

**Use:** Team site

---

### Scenario 2

> HR needs somewhere to publish policies and employee guidance to 5,000 employees.

**Use:** Communication site

---

### Scenario 3

> HR has separate sites for Recruitment, Learning, Payroll and Policies but wants common navigation.

**Use:** Hub site

```text
HR Hub
├── Recruitment
├── Learning
├── Payroll
└── Policies
```

---

### Scenario 4

> A Power App needs several SharePoint lists for configuration, logging and reference data.

**Consider:** Team site without a Microsoft 365 Group

This avoids creating Teams, Planner and other collaboration resources that the application does not require.

---

### Scenario 5

> A Teams project has a private channel that only senior managers should access.

**Use:** Private Teams channel

Teams automatically provisions the associated SharePoint channel site.

---

### Scenario 6

> The organisation needs one main place where employees can find news, services and departmental portals.

**Use:** SharePoint Home site, typically supported by Hub and Communication sites underneath it.

---

# Recommended Modern SharePoint Architecture

A larger organisation might eventually look something like this:

```text
                     Organisation Home
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
       HR Hub         Technology Hub     Finance Hub
          │                 │                 │
     ┌────┼────┐       ┌────┼────┐       ┌────┼────┐
     │    │    │       │    │    │       │    │    │
   HR   HR   HR      IT   IT   IT       FIN  FIN  FIN
 Sites Sites Sites  Sites Sites Sites    Sites Sites Sites
```

Individual project and collaboration Team sites can then sit alongside this structure where required.

The principle is:

```text
Collaborate → Team Site

Communicate → Communication Site

Organise → Hub Site

Organisation Landing Page → Home Site
```

---

# Best-Practice Checklist

Before creating a SharePoint site, ask:

* Who is the audience?
* Are users mainly reading or editing content?
* Does the site need Microsoft Teams?
* Does it need a Microsoft 365 Group?
* Is this an independent project or part of a wider department?
* Should it be associated with an existing Hub?
* Who will own the site?
* Who will maintain its content?
* What should happen to the site when the project finishes?
* Is another existing site already suitable?

Creating a site is easy.

Maintaining hundreds or thousands of unnecessary SharePoint sites is considerably harder.

Good SharePoint architecture starts by creating **the right site for the right purpose**.
