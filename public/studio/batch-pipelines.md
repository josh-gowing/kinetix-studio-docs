# Kinetix Studio v2.5 — Reusable batch pipelines

Application version: **2.5.0-dev.1**. KX language registry: **2.2**.

## Arrays

`symbols.length` returns the current element count. `symbols[i]` is zero-based (out-of-range reads return KX `null`); assignment by index already exists. The existing `array.*` namespace stays compatible. Arrays now also expose its methods through instance access:

```kx
const symbols = ["MSFT", "NVDA"];
symbols.push("AMD", "INTC");
console.log(symbols.length);
console.log(symbols[1]);
console.log(symbols.includes("NVDA"));
const firstTwo = symbols.slice(0, 2);
```

`push` mutates the same array and returns its new length; multiple appended arguments are supported. `slice` makes a shallow copy and supports negative bounds as the namespace form does. Includes uses scalar value/object identity membership, not deep object comparison. `.length` is read-only; use push/pop or indexed assignment to change the array. Assigning to const prevents rebinding, while mutation of its array remains supported.

For awaited sequential iteration use a named KX function:

```kx
function inspect(symbol, index, original) {
    console.log(index + ": " + symbol);
}
symbols.forEach(inspect);
```

`array.forEach(symbols, inspect)` is equivalent. Callbacks run in order, and each native operation/callback is awaited before the next item. It returns null. The initial length is captured: appends during iteration are not visited, while values at remaining positions are read when visited. A callback error propagates to its enclosing try/catch; handle errors inside the callback if processing should continue. Use return to finish a callback, not break/continue. Anonymous/arrow functions and JavaScript async syntax are not introduced in this release.

## Exceptions

```kx
try {
    const report = data.validate(table);
    if (report.status != "passed") {
        throw { message: "Dataset failed validation", symbol: symbol };
    }
} catch (error) {
    console.log(symbol + ": " + error.operation + ": " + error.message);
} finally {
    console.log("Instrument attempt finished");
}
```

Try requires a catch or finally block. Catch syntax requires a variable: `catch (error)`. Catch bindings are local to the handler; try/catch/finally each have block scope. Ordinary runtime errors and native I/O/validation/save failures can be caught. Explicit throw accepts a scalar or object (an object's message field is used as its message); catches expose a structured object with `message`, `code`, `line`, `column`, `fileId`, `fileName`, `operation`, and the thrown `value`. User object fields such as symbol are retained. The innermost failing call supplies operation/location. Include the loop's symbol when recording failures; the runtime does not guess instrument identity from arbitrary file names.

Break, continue and return are control flow, not catchable errors. Finally runs during normal control flow and ordinary exception unwinding. Stop/cancellation, statement/compute/loop limits and maximum call depth are fatal and cannot be swallowed by catch or overridden by finally; fatal termination does not guarantee user cleanup code executes. Each saved dataset is independently immutable; exceptions do not roll back previously successful saves or external side effects.

## Loops and compiler checks

Existing for, while, for-of, break, continue, prefix/postfix ++ and -- remain supported and are regression-tested together with exceptions. Conditions must be scalar. Continue in a for loop still executes its update; while loops must advance their condition explicitly. For-of over arrays observes appended entries until the existing iteration budget is reached; use slice for a fixed collection or forEach for a fixed initial length. A bounded loop can terminate naturally at exactly its configured limit. Break/continue outside a loop or across a function boundary are rejected by the compiler; runtime function boundaries enforce the same rule for imported modules.

The compiler's existing parser and AST are extended directly; structural checks, strategy broker-dependency analysis, diagnostics and editor keyword/snippet support understand the new statements. The existing dynamic runtime supplies value/type checks; this change does not claim a full JavaScript type system. Native/network APIs remain pipeline-only.

## Batch acceptance workflow

Use `examples/pipelines/batch-daily-normalization-v2.5.kx`. Configure paths, symbols, source snapshot cutoff and actual adjustment method. Start with MSFT/NVDA, then increase the limit to the full universe. Do not copy an old snapshot cutoff for newly captured files. Each instrument builds a fresh native plan, validates it and saves only passed, nonempty results. Warnings are deliberately treated as skipped failures in the example; change that policy explicitly if appropriate for your research. Success/failure arrays record per-instrument outcomes; the summary reports attempted, passed and failed counts. Correct malformed role maps rather than catching and ignoring them as successes.

Data plans are lazy: missing/corrupt files generally fail at preview/validate/save rather than data.read. Catch encloses the entire instrument operation, including save. This release changes language ergonomics, not calendar, corporate-action or price-adjustment semantics.

## Verification

`npm run v25:test` checks language behavior, nested control flow, non-catchable limits, error provenance and per-instrument isolation. It runs in release:test. `npm run v25:native:test` compiles the same KX runner and executes it against the real Rust/DuckDB engine via a test-only JSON-line bridge. Synthetic native fixtures cover 2 and 29 instruments plus missing/corrupt inputs in the middle of a batch. The bridge always writes to a test-owned temporary global root/catalog, even when configured to read a real workspace. The Rust integration test is explicitly ignored by a plain cargo test because its runner must be compiled first.

For a read-only real-data acceptance run, set KINETIX_V25_WORKSPACE and optionally KINETIX_V25_PIPELINE to the workspace and existing recipe, then run v25:native:test. It never writes to the supplied workspace or recipe. Native checks for daily completion, availability, holidays, DST and immutable output continue to run separately.


Vendor ISO text timestamps in Parquet are supported by daily normalization in v2.5. Only ISO dates/full timestamps are accepted; naive ISO times explicitly mean UTC, offsets are honored, and the original text remains unchanged. Ambiguous locale dates and invalid/clock-only values fail closed.


Sort daily rows explicitly by session_close before strict monotonicity validation, as the example does. Native relational transforms do not promise implicit row order. Sorting changes row order, not timestamps, prices, corporate-action treatment or completeness. A non-monotonic warning should be investigated or resolved explicitly rather than counted as a passed validation.
