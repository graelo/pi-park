---
number: 2
title: Use a relocatable Markdown parking-lot registry
status: proposed
date: 2026-11-22
---

# Use a relocatable Markdown parking-lot registry

## Context and Problem Statement

Interesting sessions need a durable, browsable index independent of their original working directory. Users want to edit notes and organize them freely.

## Decision Drivers

* Human-readable and editable without Pi.
* Registrations can be renamed and moved into subdirectories.
* Re-parking must not silently destroy edits.

## Considered Options

* Markdown files with YAML metadata.
* A centralized database.

## Decision Outcome

Chosen option: **Markdown files with YAML metadata**. Each registration records the session ID, source file, original cwd, and parking time, alongside a summary. New files enter the lot root; discovery searches recursively by metadata. The lot defaults to `${XDG_DATA_HOME:-~/.local/share}/pi-park`, and `PI_PARK_DIR` can override it with an absolute path. An empty or unset override uses the default; relative overrides are rejected to avoid changing lots when the working directory changes.

### Consequences

* Good: notes are portable and browsable with ordinary tools, and the lot can be placed in a user-selected directory.
* Bad: the override must be configured consistently wherever Pi and the CLI are launched.
* Bad: duplicate registrations and malformed metadata require explicit handling; recursive scans cost more than indexed lookup.
* Bad: the registry is not a backup of the source session or workspace.

### Confirmation

Test discovery after renaming and moving registrations, duplicate detection, and protection against overwriting edited files.

## Pros and Cons of the Options

### Markdown files with YAML metadata

* Good: straightforward to inspect and edit.
* Bad: parsing and concurrent modifications require care.

### A centralized database

* Good: indexed queries and transactional updates.
* Bad: less convenient to browse and reorganize as ordinary files.
