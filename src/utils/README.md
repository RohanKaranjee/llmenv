# Utils Module

This directory contains utility functions used throughout the llmenv CLI.

## Modules

### `formatters.ts`

Output formatters for displaying data structures in the CLI with colored output.

**Functions:**

- `formatProjectList(projects: ProjectEntry[]): string`
  - Formats a list of projects as a readable table
  - Shows project name, path, and relative last active time
  - Uses cyan for headers, green for timestamps, yellow for empty state

- `formatPinList(pins: Pin[]): string`
  - Formats a list of pins with numbering
  - Shows short ID (first 8 chars), fact text, and creation timestamp
  - Uses cyan for headers, yellow for empty state

- `formatHistory(history: HistoryEntry[]): string`
  - Formats decision history entries
  - Shows timestamp, provider, prompt, and response (truncated if > 200 chars)
  - Uses cyan for headers and provider tags, yellow for empty state

**Color Scheme:**
- Green: Success indicators (timestamps, active states)
- Yellow: Warnings and empty states
- Cyan: Headers and informational labels
- Gray: Secondary information (paths, metadata)
- White: Primary content

### `error-handler.ts`

Centralized error handling with user-friendly messages and appropriate exit codes.

**Functions:**

- `handleError(error: unknown): never`
  - Handles all error types with appropriate formatting
  - Displays error messages with context
  - Exits with appropriate exit codes

**Exit Codes:**
- 0: Success
- 1: General error
- 2: Configuration error
- 3: Validation error
- 4: API error
- 5: Not found error

## Testing

All utility functions have comprehensive unit tests in `tests/unit/`:
- `formatters.test.ts`: 18 tests covering all formatter functions
- `error-handler.test.ts`: 25 tests covering error handling scenarios

Run tests with:
```bash
npm test -- tests/unit/formatters.test.ts
npm test -- tests/unit/error-handler.test.ts
```

## Examples

See `examples/formatters-demo.ts` for a demonstration of all formatters in action.

Run the demo with:
```bash
npx tsx examples/formatters-demo.ts
```
