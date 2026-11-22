---
number: 3
title: Delegate selection to fzf and forking to Pi
status: proposed
date: 2026-11-22
---

# Delegate selection to fzf and forking to Pi

## Context and Problem Statement

Users need to select a parked session and continue it in their current directory without maintaining a custom session browser or session-copy implementation.

## Decision Drivers

* Minimize custom terminal UI and session-format dependencies.
* Support reorganized registration files and a Markdown preview.
* Preserve the source session and registration.

## Considered Options

* Select with fzf and invoke Pi's `--fork`.
* Implement a custom browser and copy session data directly.

## Decision Outcome

Chosen option: **select with fzf and invoke Pi's `--fork`**. Validate the selected registration and source identity before launching Pi in the caller's working directory.

### Consequences

* Good: Pi owns fork semantics; fzf provides fuzzy selection and preview.
* Bad: `pi-unpark` requires fzf and Pi on PATH.
* Bad: the fork reflects the source session at unpark time, not a snapshot from parking time.

### Confirmation

Test cancellation, moved registrations, source identity validation, destination cwd, and preservation of the original session.

## Pros and Cons of the Options

### Select with fzf and invoke Pi's `--fork`

* Good: small integration surface and familiar tools.
* Bad: external executables must be installed.

### Custom browser and session copying

* Good: full control over interaction.
* Bad: greater maintenance and potential incompatibility with Pi session format changes.
