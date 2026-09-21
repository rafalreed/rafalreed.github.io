---

title: "SharePoint Usage Analytics & Power BI"
date: 2026-09-21
description: "A reporting pipeline that captures historical SharePoint usage data and transforms it into management analytics in Power BI."
summary: "Building a historical SharePoint analytics platform using Microsoft Graph reporting, Power Automate, Dataverse and Power BI."
tags:

- SharePoint
- Microsoft Graph
- Power Automate
- Dataverse
- Power BI
- Office Scripts

---

## The challenge

Microsoft 365 provides useful SharePoint usage reports, but the available reporting experience is not always suited to longer-term analysis or organisation-specific reporting requirements.

The requirement was to create a dataset that could preserve daily SharePoint usage snapshots and support management reporting across different time periods.

This included identifying popular sites, analysing changes in usage and understanding longer-term activity trends.

## The solution

I designed a scheduled data pipeline that retrieves SharePoint site usage information from Microsoft Graph and stores historical daily snapshots in Dataverse.

Because the Graph reporting endpoint returns report data as CSV rather than conventional JSON, the process includes an Office Script transformation stage before the information is processed by Power Automate.

The resulting structured dataset is consumed by Power BI for historical and comparative reporting.

## Architecture

The high-level pipeline is:

Microsoft Graph Reports
→ CSV usage report
→ Office Script transformation
→ Power Automate
→ Dataverse
→ Power BI

The data model separates relatively static site information from daily usage measurements.

This provides a structure similar to:

**Site**

* Site identifier
* Site name
* Site URL
* Site type
* resolution status

**Site Usage**

* Site identifier
* usage date
* last activity date
* page views
* pages visited
* file count
* active file count
* storage consumption

This avoids unnecessarily duplicating site metadata for every reporting snapshot.

## Site resolution

Usage reports primarily identify sites using their site identifier.

A separate resolution process enriches those records with readable information such as the SharePoint site name and URL.

Keeping this process separate from the daily usage ingestion means reporting can continue even when a particular site's metadata cannot immediately be resolved.

## Analytics

Once historical snapshots are available, Power BI can calculate measures that are difficult to obtain from a single Microsoft 365 usage export.

Examples include:

* usage over selectable reporting periods
* most frequently visited sites
* page-view trends
* recent average activity
* site rankings
* largest increases in usage
* largest decreases in usage
* comparison of current and historical activity

Users can analyse activity across different reporting windows without needing separate exports for each period.

## Data pipeline design

The reporting process is designed to run without manual intervention.

Each scheduled execution retrieves the required reporting snapshot, transforms the source data and adds the corresponding usage records to the historical dataset.

Separating ingestion, site metadata and analytics also makes the solution easier to troubleshoot and extend.

Additional SharePoint metrics can be introduced without requiring the entire reporting architecture to be redesigned.

## Outcome

The solution converts a point-in-time Microsoft 365 usage report into a persistent analytics platform.

Historical data can be used to identify usage patterns, monitor adoption and provide management with a clearer view of how SharePoint sites are being used over time.

The design also creates a reusable pattern for capturing Microsoft 365 reporting data that would otherwise only be available through periodically generated reports.

## Technologies

**SharePoint Online · Microsoft Graph · Power Automate · Office Scripts · Dataverse · Power BI**
