---
number: 1
title: Record architecture decisions
status: accepted
date: 2026-11-22
---

# Record architecture decisions

## Context and Problem Statement

Significant design choices need a durable record of their rationale and trade-offs.

## Decision Drivers

* Decisions should be reviewable alongside the code.
* The format should be consistent with neighboring projects.

## Considered Options

* MADR records managed by `adrs`.
* Informal notes in the README.

## Decision Outcome

Chosen option: **MADR records managed by `adrs`**, because they capture context, alternatives and consequences in version control.

### Consequences

* Good, because decisions and their rationale are easy to discover and review.
* Bad, because records require maintenance when decisions change.

### Confirmation

Run `adrs doctor` and review records when architecture changes.

## Pros and Cons of the Options

### MADR records managed by `adrs`

* Good, because structured records capture trade-offs.
* Bad, because maintaining them adds work.

### Informal README notes

* Good, because they need no separate tooling.
* Bad, because decision history and alternatives can become unclear.
