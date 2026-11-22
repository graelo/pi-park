# pi-park

Park interesting Pi conversations in a directory of Markdown notes, and fork them later into a different working directory.

> **Work in progress:** the workflows and installation described here need further integration testing.

## Parking lot

Registrations live in `${XDG_DATA_HOME:-~/.local/share}/pi-park/`. Each has YAML frontmatter with a session ID, source session file, original working directory and parking time, followed by a summary or manually written notes. New notes are written to the root; you can rename and move them into subdirectories. Do not change the metadata unless you intend to change the referenced session.

In Pi, use `/park` to generate a summary with the current model. From a shell, `pi-park --session <full-session-id>` prompts for your own notes without calling a model. Add `--summarize` to request a model-generated summary instead. Model calls may incur cost and send conversation content to the provider; `/park` is not necessarily free. When parking the same session again, you are asked before its existing note is replaced. Noninteractive re-parking refuses to overwrite it.

## Unparking

From the directory where you want to continue:

```sh
pi-unpark
```

Choose a registration using `fzf`; Escape cancels. The selected Markdown file is previewed. If `bat` is installed, it colorizes the preview using your configured theme and filename-based syntax mappings; otherwise the raw Markdown is shown. Your `FZF_DEFAULT_OPTS` settings control fzf's interface. Pi creates the fork in the current directory; the registration and source session remain untouched. You can also use `pi --fork <session-id>` directly.

Forking copies the session as it exists **at unpark time**, not a snapshot from when it was parked. It does not restore the original workspace or uncommitted changes.

## Dependencies and installation

Requires Node.js 24+, Pi, and `fzf` (for `pi-unpark`). The extension is a Pi package; standalone executables need a separate npm installation or link, since installing a Pi package does not put its binaries on PATH. Installation from a local checkout for development:

```sh
npm install
npm run build
pi install /absolute/path/to/pi-park
npm link
```

`pi-park` and `pi-unpark` rely on Pi; model summarization also requires configured model/authentication. `pi-park` searches the configured Pi session directory for an exact ID. `/park` uses the current session's model. `pi-unpark` first validates the recorded source file, then searches configured session storage if the file is unavailable.

## Privacy

Summaries are sent to the configured model provider and may contain sensitive information. The parking lot is local and notes are created with owner-only permissions. Treat it and Pi's session files accordingly.

## Development

```sh
npm install
npm run check
npm test
```

Licensed under MIT.
