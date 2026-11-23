# pi-park

[![CI](https://github.com/graelo/pi-park/actions/workflows/ci.yml/badge.svg)](https://github.com/graelo/pi-park/actions/workflows/ci.yml)

Park interesting Pi conversations in a directory of Markdown notes, and fork them later into a different working directory.

## Quick start

1. **Park** a session — in Pi, run `/park` (generates a model summary), or from a shell: `pi-park --session <full-session-id>`.
2. **Browse** the parking lot — plain Markdown files with YAML frontmatter, editable in any editor.
3. **Unpark** — from the directory where you want to continue, run `pi-unpark`; pick a registration in `fzf` and the source session is forked there.

Requires Node.js 24+, Pi, and `fzf` (for `pi-unpark`); `bat` is optional.

## Parking lot

Registrations live in `${XDG_DATA_HOME:-~/.local/share}/pi-park/` by default. Set `PI_PARK_DIR` to an absolute path to use a different parking lot; an unset or empty value uses the default. Set it in the environment that starts Pi as well as in shells running `pi-park` or `pi-unpark`:

```sh
export PI_PARK_DIR="$HOME/Documents/parked-sessions"
```

Each registration has YAML frontmatter with a session ID, source session file, original working directory and parking time, followed by a summary or manually written notes. New notes are written to the root; you can rename and move them into subdirectories. Discovery is by frontmatter, not filename — `.md` files are searched recursively (case-insensitive) and filenames are ignored — so renaming or moving notes is safe, but do not change the frontmatter unless you intend to change the referenced session. Duplicate `session_id`s across notes are rejected when parking.

In Pi, use `/park` to generate a summary with the current model. From a shell, `pi-park --session <full-session-id>` prompts for your own notes without calling a model. Add `--summarize` to request a model-generated summary instead — the shell path shells out to `pi --print` and uses Pi's configured model. Model calls may incur cost and send conversation content to the provider; `/park` is not necessarily free. When parking the same session again, you are asked before its existing note is replaced; without a terminal the existing note is never overwritten.

### Session directory

`pi-park` and `pi-unpark` resolve the session directory the same way Pi does — from `PI_CODING_AGENT_SESSION_DIR` if set, otherwise from the Pi settings of the current working directory. Running from an unrelated directory can therefore fail with `Session not found`.

## Unparking

From the directory where you want to continue:

```sh
pi-unpark
```

Choose a registration using `fzf`; Escape or Ctrl-C cancels (exit 0). The selected Markdown file is previewed. If `bat` is installed, it colorizes the preview using your configured theme and filename-based syntax mappings; otherwise the raw Markdown is shown. Your `FZF_DEFAULT_OPTS` settings control fzf's interface. Pi creates the fork in the current directory; the registration and source session remain untouched. You can also use `pi --fork <session-id>` directly.

Forking copies the session as it exists **at unpark time**, not a snapshot from when it was parked. It does not restore the original workspace or uncommitted changes.

## Command reference

### `pi-park`

```sh
pi-park --session <full-session-id> [--summarize]
```

- Without `--summarize`, prompts for manual notes and makes no model call. Requires a terminal; without one the command fails with guidance. Noninteractive parking needs `--summarize`.
- `--summarize` generates a summary with Pi's configured model via `pi --print` (prompt on stdin, summary from stdout). May incur cost; may transmit session content to the provider.
- Re-parking a session that is already parked prompts for confirmation; without a terminal it refuses to overwrite the existing note.
- Exit codes: `2` for usage errors, `1` for failures (unknown session, empty notes, …), `0` on success or when the user declines to overwrite.

### `pi-unpark`

```sh
pi-unpark
```

No arguments. Exits `1` with `No parked sessions found in <root>` when the lot is empty; exits `0` when the selection is cancelled; otherwise propagates Pi's exit code from the fork.

## Troubleshooting

| Error | Likely cause |
| --- | --- |
| `Session not found` | Wrong session directory (see above), or a partial/incorrect ID — `pi-park` requires the full session ID. |
| `Already parked` / `Multiple registrations found` | Duplicate parking or duplicate notes; resolve the duplicates in the lot first. |
| `PI_PARK_DIR must be an absolute path` | `PI_PARK_DIR` is set to a relative path. |
| `fzf exited with status …` / `spawn fzf ENOENT` | `fzf` is not installed or not on PATH (required by `pi-unpark`). |
| `Manual notes require a terminal` | Running noninteractively; use `--summarize` or a TTY. |
| `No parked sessions found` | The lot is empty, or `PI_PARK_DIR` points somewhere else. |

## Dependencies and installation

Requires Node.js 24+, Pi, and `fzf` (for `pi-unpark`); `bat` is optional. The extension is a Pi package; standalone executables need a separate npm installation or link, since installing a Pi package does not put its binaries on PATH.

Install both the extension and the standalone CLI from npm:

```sh
pi install npm:@graelo/pi-park
npm install -g @graelo/pi-park
```

The extension can also be installed from the Git repository:

```sh
pi install git:github.com/graelo/pi-park
```

Direct global npm installation from Git has failed in testing with npm 11; use a packed tarball or a local checkout instead.

Installation from a local checkout for development:

```sh
npm install
pi install /absolute/path/to/pi-park
npm link
```

`pi-park` and `pi-unpark` rely on Pi; model summarization also requires configured model/authentication. `pi-park` searches the configured Pi session directory for an exact ID. `/park` uses the current session's model. `pi-unpark` first validates the recorded source file, then searches configured session storage if the file is unavailable.

## Uninstall

```sh
pi uninstall npm:@graelo/pi-park    # remove the extension
npm uninstall -g @graelo/pi-park    # remove the standalone CLI
```

## Privacy

Summaries are sent to the configured model provider and may contain sensitive information. The parking lot is local and notes are created with owner-only permissions (`0600`), but the frontmatter also records the source session file path and the original working directory — treat the lot and Pi's session files accordingly.

## Design

Significant design choices are recorded as MADR architecture decision records in [`doc/adr/`](doc/adr/) — the relocatable Markdown registry, delegating selection to fzf and forking to Pi, and opt-in shell summarization. See [`CHANGELOG.md`](CHANGELOG.md) for release history.

## Development

```sh
npm install
npm run check
npm test
```

To publish a new version, run `npm publish` from this directory. `publishConfig` marks the scoped package public; publishing requires npm authentication and permission for the `@graelo` scope.

Licensed under [MIT](LICENSE).
