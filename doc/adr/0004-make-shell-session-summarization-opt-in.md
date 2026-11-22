---
number: 4
title: Make shell session summarization opt-in
status: proposed
date: 2026-11-22
---

# Make shell session summarization opt-in

## Context and Problem Statement

Parking from the shell may happen long after the conversation ended. Generating a summary requires another model request, potentially transmitting session content and incurring cost without a useful prompt-cache hit. How should the shell command make this explicit?

## Decision Drivers

* Avoid unexpected model charges and transmission of conversation content.
* Allow parking without a configured or available model.
* Keep model-generated summaries convenient when explicitly desired.

## Considered Options

* Prompt for manual notes by default and generate a summary only with `--summarize`.
* Always generate a model summary.
* Create a placeholder note without asking for input.

## Decision Outcome

Chosen option: **prompt for manual notes by default and generate a summary only with `--summarize`**. Without the flag, a noninteractive invocation fails with guidance rather than silently making a model call. With the flag, Pi's configured model is used; this is not necessarily the model from the original conversation.

The in-session `/park` command continues to generate a summary using the current model. It is also a model request and can incur charges; a cache hit is not guaranteed. Both model-based paths may transmit conversation context to the provider.

### Consequences

* Good, because shell parking makes model usage, cost and data transmission opt-in.
* Good, because a session can be parked when no model is available.
* Bad, because manual parking requires an interactive terminal and user-provided notes.
* Bad, because generated summaries require an additional flag and may differ depending on the currently configured model.

### Confirmation

Test that shell parking without `--summarize` does not spawn Pi, that `--summarize` invokes it, and that model errors never create or overwrite a registration.

## Pros and Cons of the Options

### Prompt for manual notes by default

* Good, because users control when a model request happens.
* Bad, because users must supply notes themselves unless they opt in.

### Always generate a model summary

* Good, because it minimizes manual input.
* Bad, because it silently incurs potential cost and sends context to a provider.

### Create a placeholder

* Good, because parking can be immediate and noninteractive.
* Bad, because the registration may remain uninformative until edited.
