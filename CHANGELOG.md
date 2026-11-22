# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-11-22

### Added

- Set `PI_PARK_DIR` to an absolute path to choose a parking lot shared by `/park`, `pi-park`, and `pi-unpark`. An unset or empty value keeps the existing default.

## [0.1.0] - 2026-11-22

### Added

- Park persistent sessions with `/park` and browse editable Markdown registrations, which can be moved or renamed within the parking lot.
- Register an existing session with `pi-park --session <id>`, using manual notes or an opt-in model-generated summary with `--summarize`.
- Select a registration with `pi-unpark` and fork its source session into the current directory using Pi and `fzf`.
- Preview registrations with optional `bat` highlighting that respects user theme and syntax configuration, with a plain-text fallback.
- Confirm before replacing an existing registration and validate source session identity before forking.
