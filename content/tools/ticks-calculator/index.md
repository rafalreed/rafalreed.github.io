---
title: "Power Automate Ticks Calculator"
date: 2026-09-23
description: "Convert seconds, minutes, hours, days and weeks into .NET tick values for Power Automate, or convert ticks back into readable time."
summary: "Convert practical time values to .NET ticks, reverse ticks back into readable time, and copy ready-to-use Power Automate expressions."
tags:
  - Power Automate
  - Power Platform
  - Developer Tools
  - Date and Time
showDate: false
showReadingTime: false
showWordCount: false
showAuthor: false
showPagination: false
---

Power Automate occasionally requires time values to be expressed as **ticks** rather than familiar units such as hours or days.

This small calculator makes those conversions easier and also shows the calculation behind the result.

{{< ticks-calculator >}}

## What is a tick?

A tick is a unit of time used by .NET and several Microsoft technologies.

```text
1 tick = 100 nanoseconds
10,000,000 ticks = 1 second
```

That means:

| Duration | Ticks |
| --- | ---: |
| 1 second | 10,000,000 |
| 1 minute | 600,000,000 |
| 1 hour | 36,000,000,000 |
| 1 day | 864,000,000,000 |
| 1 week | 6,048,000,000,000 |

## Example in Power Automate

To add one day to the current time using ticks:

```text
addTicks(utcNow(), 864000000000)
```

To subtract one day:

```text
addTicks(utcNow(), -864000000000)
```

The calculator above can generate the tick value for a custom duration and gives you a ready-to-copy Power Automate expression.

## Why use this?

Ticks can be useful when you need precise date and time calculations or when working with expressions and APIs that represent time using .NET tick values.

For most ordinary date arithmetic, functions such as `addDays()`, `addHours()` and `addMinutes()` are easier to read. This tool is intended for the cases where ticks are useful or required.
