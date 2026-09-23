---

title: "How to Grant Access to One SharePoint Folder Without Granting Access to the Whole Library"
date: 2026-09-23
description: "A practical guide to granting access to a single SharePoint folder without exposing the entire document library, including permission inheritance, security groups and common mistakes."
tags:

- SharePoint
- Permissions
- Best Practices
- Microsoft 365
- Security

---

Sometimes you need to give a person or team access to **one specific folder in a SharePoint document library**, without giving them access to everything else in that library.

SharePoint supports this through **unique permissions**.

The important thing is to understand permission inheritance before changing anything.

---

## How SharePoint Permissions Normally Work

By default, permissions flow down through SharePoint:

**Site → Document Library → Folder → File**

For example:

```text
SharePoint Site
└── Documents Library
    ├── General
    ├── Finance
    └── Project Alpha
```

Normally, all three folders inherit their permissions from the **Documents** library.

If we want somebody to access **Project Alpha** without giving them access to the whole library, we can give that folder its own permissions.

This is known as **breaking permission inheritance**.

---

# Option 1 - Give Someone Access Only to a Folder

This is the most common scenario.

Suppose:

* Sarah does not currently have access to the site or document library
* Sarah needs access to the **Project Alpha** folder
* Sarah should not be able to browse the rest of the library

### Step 1 - Find the Folder

Open the document library and locate the folder you want to share.

For example:

```text
Documents
└── Project Alpha
```

Select the folder and choose:

**Manage access**

Depending on the SharePoint interface, you may also see options such as:

**Share**

or:

**Manage access → Advanced**

---

## Step 2 - Grant Access to the Folder

Add the user or security group that requires access.

Choose the appropriate permission level, normally:

* **Can view** – read-only access
* **Can edit** – allows files to be added, modified and deleted

Use the lowest permission level required.

For example:

```text
SG-Project-Alpha-Members → Edit
```

rather than assigning access directly to ten individual users.

SharePoint can give the user access to the folder without granting them general access to the entire document library. SharePoint may show the user as having **Limited Access** higher in the site hierarchy; this exists so they can reach the item that was explicitly shared with them and does not mean they have normal access to the rest of the library.

---

# Option 2 - Make the Folder Private

There is an important difference between:

> Giving someone additional access to a folder

and:

> Making sure only a specific group can access the folder.

If the folder currently inherits permissions from the library, existing site members may already have access.

For example:

```text
Documents Library
    Members → Edit
    Owners → Full Control
```

If **Project Alpha** inherits these permissions, adding another user does not remove the existing permissions.

To make the folder restricted, you need to create **unique permissions**.

---

## Step 1 - Stop Inheriting Permissions

Open:

**Folder → Manage access → Advanced**

Then select:

**Stop Inheriting Permissions**

SharePoint copies the existing permissions onto the folder and then disconnects the folder from the parent library.

The folder now has its own permission scope.

---

## Step 2 - Remove Unwanted Access

After breaking inheritance, review the permissions carefully.

For example, you might initially see:

```text
Site Owners        Full Control
Site Members       Edit
Site Visitors      Read
```

If the folder is supposed to be restricted, remove the groups that should not have access.

Then add the appropriate group:

```text
SG-Project-Alpha-Members    Edit
```

The resulting permissions might look like:

```text
Project Alpha
├── SG-Project-Alpha-Members    Edit
└── Approved administrators     Full Control
```

The rest of the library can continue using its normal permissions.

---

# What Happens to Files Inside the Folder?

Files and subfolders normally inherit permissions from their parent folder.

That means a structure such as:

```text
Project Alpha
├── Requirements.docx
├── Budget.xlsx
└── Documentation
    └── Architecture.docx
```

can normally be secured with **one unique permission scope on Project Alpha**.

You do not need to configure every document individually.

This is both easier to manage and better for SharePoint performance. Microsoft recommends using folders to group content requiring the same permissions rather than assigning unique permissions to thousands of individual files.

---

# Check for Existing Unique Permissions

There is one important exception.

A file or subfolder may already have been shared separately.

For example:

```text
Project Alpha
├── Requirements.docx
├── Budget.xlsx        ← previously shared separately
└── Documentation
```

`Budget.xlsx` may already have its own permissions.

Changing the permissions on **Project Alpha** does not necessarily remove permissions that have already been configured independently on child items.

If the folder contains sensitive information, check whether any files or subfolders already have **unique permissions**.

---

# Use Groups Instead of Individual Users

Where possible, avoid permissions such as:

```text
John Smith
Jane Smith
Alex Jones
Mary Brown
```

Instead, use a security group:

```text
SG-Project-Alpha-Members
```

Then manage membership of the group rather than repeatedly modifying SharePoint permissions.

This becomes significantly easier when people join or leave the project.

For example:

```text
SG-Project-Alpha-Members
├── John
├── Jane
├── Alex
└── Mary
```

When Alex leaves the project, remove Alex from the group instead of finding every SharePoint location where access was assigned.

---

# Avoid Unique Permissions on Individual Files

Technically, SharePoint allows unique permissions on individual documents.

That does not mean it is always a good idea.

For example, avoid structures like:

```text
Documents
├── File01.docx → unique permissions
├── File02.docx → unique permissions
├── File03.docx → unique permissions
├── File04.docx → unique permissions
└── ...
```

Permissions quickly become difficult to understand and troubleshoot.

A cleaner design is:

```text
Documents
└── Restricted Project
    ├── File01.docx
    ├── File02.docx
    ├── File03.docx
    └── File04.docx
```

and apply unique permissions once to the **Restricted Project** folder.

Microsoft supports up to **50,000 unique permission scopes** in a list or library, but recommends keeping the number below **5,000** for best performance.

---

# Be Careful with Very Large Folders

There is also an important SharePoint limit.

If a folder contains more than **100,000 items**, SharePoint cannot break or restore permission inheritance on that folder.

If you know a large folder will require unique permissions, configure the permissions early rather than waiting until the folder contains a very large number of files.

---

# Common Mistakes

### Granting access to the whole library

If somebody only needs one folder, do not add them to a site or library-level group unless they genuinely need access to everything.

---

### Breaking inheritance unnecessarily

Not every folder needs unique permissions.

Keep normal inheritance wherever possible and create unique permissions only where there is a genuine access requirement.

---

### Forgetting existing permissions

Breaking inheritance initially copies the existing permissions.

You still need to remove users or groups that should no longer have access.

---

### Managing dozens of individual users

Use Entra ID security groups or appropriate SharePoint groups where possible.

It makes access reviews and staff changes much easier.

---

### Setting unique permissions on every file

Secure the highest sensible container.

Usually:

```text
Folder
    ↓
Files inherit from folder
```

is preferable to:

```text
File → unique permissions
File → unique permissions
File → unique permissions
```

---

# Recommended Permission Structure

A simple design might look like this:

```text
Documents Library
│
├── General
│   └── Inherits library permissions
│
├── Team Documents
│   └── Inherits library permissions
│
└── Restricted Project
    │
    ├── Unique permissions
    │
    ├── SG-Restricted-Project-Members → Edit
    └── Files and subfolders inherit from this folder
```

This keeps the majority of the library using standard inheritance while creating an isolated permission boundary only where it is required.

---

# Best-Practice Checklist

Before granting folder-level access, check:

* Does the user really need access to the whole library?
* Can access be assigned to a security group instead of individual users?
* Can the files requiring the same permissions be placed in one folder?
* Are there already unique permissions on files inside the folder?
* Have inherited groups been removed if the folder needs to be private?
* Are users receiving the minimum permissions they require?
* Can normal permission inheritance be retained everywhere else?

---

## Final Recommendation

Use folder-level permissions when there is a clear business requirement, but keep the permission structure as simple as possible.

A good SharePoint design normally follows this principle:

```text
Use inheritance by default
        ↓
Create unique permissions only where required
        ↓
Assign permissions to groups
        ↓
Allow files to inherit from the secured folder
```

This provides granular access without turning the document library into a collection of hundreds or thousands of individually managed permission scopes.
