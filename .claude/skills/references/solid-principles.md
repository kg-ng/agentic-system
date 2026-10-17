# SOLID Principles Reference

SOLID principles applied to typical service/handler code and infrastructure-as-code.
Each section defines the principle, what a violation looks like, and what a
correct fix looks like. Loaded by `solid-reviewer` and `solid-implementer`.

---

## S — Single Responsibility Principle

**Rule:** Each module, class, or function has exactly one reason to change.

**In handlers/entry points:**
- [OK] Handler only orchestrates: parse input → call service → return response
- [NO] Handler also contains business logic, direct data-store calls, HTTP client code

**In infrastructure code:**
- [OK] Separate constructs for networking, compute, storage, and routing
- [NO] One mega-stack that creates everything at once

**Violation signals:**
- Handler file with mixed concerns and no clear boundary
- Function name contains `And` (e.g. `validateAndSave`)
- A stack/module constructor doing far more than composing sub-resources

**Correct pattern:**
```typescript
// handler.ts — orchestration only
export const handler = async (event) => {
  const request = parseRequest(event);            // parse
  const result  = await service.process(request); // delegate
  return buildResponse(result);                   // respond
};
```

---

## O — Open/Closed Principle

**Rule:** Open for extension, closed for modification.

**In routing/dispatch:**
- [OK] Route maps / strategy objects that add new cases without touching existing code
- [NO] `switch` or `if/else if` chains that grow with every new action

**In infrastructure:**
- [OK] Reusable constructs that accept props to vary behaviour
- [NO] Copy-pasting a stack/module to add a minor variation

**Violation signals:**
- A `switch (action)` with many cases in a single handler
- Adding a feature requires modifying an existing function body

**Caution — copy-paste drift:** when a new module/pipeline is created by copying
an existing one, the business-logic constants (filters, labels, identifiers) are
the most common thing left unadapted — "it compiles" and "tests pass" are not
evidence the copy was correctly adapted, since the bug is usually in values, not
types. Diff the copy against the original line-by-line for anything that should
have changed.

**Security caveat — do NOT apply OCP to auth:**
Auth checks, route authorization, and permission policies must stay explicit and
auditable — never abstracted behind interfaces or strategy objects.

---

## L — Liskov Substitution Principle

**Rule:** A subtype must be fully substitutable for its base type without breaking correctness.

- [OK] Test mocks implement the same interface contract as real implementations
- [OK] Adapters honour the same error shape and return-type contract as what they replace
- [NO] A mock that returns `undefined` where the real implementation returns `{ status: 200 }`

**Violation signals:**
- Test mocks that throw on paths where real implementations return valid data
- An alternate implementation of an interface that silently changes the contract
  (different error type, different null-handling)

---

## I — Interface Segregation Principle

**Rule:** No client should be forced to depend on methods/props it does not use.

- [OK] Small, focused interfaces/props per consumer
- [NO] A single fat object/props type passed everywhere, most fields unused by most consumers

**Violation signals:**
- A function/construct receiving an entire parent object instead of the specific
  fields it needs
- A shared "god interface" that every implementation partially implements

---

## D — Dependency Inversion Principle

**Rule:** High-level modules should not depend on low-level modules; both should
depend on abstractions.

- [OK] External clients (DB, HTTP, storage) injected or constructed at the composition root
- [NO] Clients constructed inline inside business logic, deep in a call chain
- [NO] Hardcoded resource names/identifiers embedded directly in application logic

**Security caveat:** never suggest DIP refactoring for auth/permission
controls — they must remain explicit and directly inspectable.

---

## Applying This Reference

`solid-reviewer` uses this document to classify findings by principle and
severity. `solid-implementer` uses it to understand the *shape* of a correct fix
before touching code. Both agents must respect the auth/permission exceptions
called out above in every principle section — those exceptions exist because
implicit, "clever" abstractions over security-critical code make audits harder,
not easier.
