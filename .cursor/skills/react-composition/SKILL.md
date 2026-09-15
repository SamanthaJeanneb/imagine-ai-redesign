---
name: react-composition
description: React composition conventions for this codebase — compound components over boolean/enum flag props, omission over negation, JSX children over config arrays, lifted context providers over state syncing. Use whenever writing, refactoring, or reviewing React components (.tsx), planning a component API, or reviewing a diff that touches component props.
---

# React Composition Conventions

Instructions for coding agents working in this codebase. Follow these when writing new React components, refactoring existing ones, or reviewing code.

Based on Fernando Rojo, "Composition Is All You Need", React Universe Conf 2025.

**Core principle: a component's API is its children, not its flags.**

## Hard rules

Apply these by default. Do not wait to be asked.

1. **Never add a boolean prop that selects which subtree renders.** If a parent passes `isEditing`, `isThread`, `mode="compact"` and the child branches its layout on it, that is a composition bug. Split the component and let the parent render the tree it wants.
2. **A condition checked in 2+ places inside one component is a split point.** That repetition is the signal. Stop and decompose.
3. **Omission, not negation.** Never add `hideFooter`, `showAvatar`, `allowAttachments`, `withHeader`. The caller simply does not render that child.
4. **JSX over config arrays.** Never accept `items={[{ icon, isMenu, divider, menuItems }]}` with a loop that handles every shape. Make each item its own component sharing a primitive underneath.
5. **`render*` props are a last resort.** `renderFooter`, `renderItem`, `renderSubmit` look like a cleanup but break the moment something must render outside the component's own tree. Try compound children and lifted context first.
6. **One-off UI stays inline.** If Cancel/Save is used by exactly one variant, render those buttons inline in that variant. Do not widen the shared component's API for a single consumer.
7. **Convenience wrappers take zero variant flags.** A wrapper bundling the common set is fine, but it must not receive `isEditing`-style props, and consumers must always be able to bypass it and render the parts directly.
8. **Do not hand-memoize context consumers.** Assume the React Compiler. It memoizes based only on the context fields a component actually reads. Add `memo`/`useMemo`/`useCallback` only against a measured profile, and leave a comment saying so.

## Component shape

Build features the way Radix builds primitives: small, independently renderable parts.

```tsx
// Shared internals
<Composer.Provider>
  <Composer.DropZone />
  <Composer.Frame>
    <Composer.Header />
    <Composer.Input />
    <Composer.Footer>
      <Composer.CommonActions />
      <Composer.SubmitButton />
    </Composer.Footer>
  </Composer.Frame>
</Composer.Provider>
```

Each variant is its own JSX tree that reuses only the parts it needs.

```tsx
// Edit variant: no attachments, so no DropZone. No boolean anywhere.
<Composer.Provider>
  <Composer.Frame>
    <Composer.Header />
    <Composer.Input />
    <Composer.Footer>
      <Composer.TextFormatAction />
      <Composer.EmojiAction />
      <Button onClick={cancel}>Cancel</Button>
      <Button onClick={save}>Save</Button>
    </Composer.Footer>
  </Composer.Frame>
</Composer.Provider>
```

## Before / after

```tsx
// ❌ Monolith with a flag API
<UserForm
  isUpdateUser
  hideWelcomeMessage
  hideTerms
  skipOnboardingRedirect
  onlyEditName
  isSlugRequired={false}
/>

// ✅ Distinct trees over shared internals
<UserForm.Provider initialValues={user} onSubmit={updateUser}>
  <UserForm.NameField />
  <UserForm.SubmitButton>Save</UserForm.SubmitButton>
</UserForm.Provider>
```

Duplication across variant trees is acceptable and usually correct. Prefer shared internals reassembled per use case over one monolith with a wide prop API.

## State

The provider defines the interface. The component that renders the provider supplies the implementation.

```tsx
type ComposerContext = {
  state: ComposerState;
  update: (next: Partial<ComposerState>) => void;
  submit: () => void;
  meta: { inputRef: RefObject<HTMLInputElement> }; // non-state escape hatch
};
```

- Ephemeral state → implement with `useState` in that provider.
- Synced / global state → implement with a hook (`useGlobalChannel()`, store selector, query cache) that conforms to the same interface.
- Children consume the context and stay agnostic to which implementation sits above them.
- Swap state management by swapping the provider at the root, never with conditionals inside children.
- Put refs, imperative handles, and other non-state values on `meta` rather than prop drilling or `useImperativeHandle`.

```tsx
// Same children, different state implementation, chosen at the root.
<EphemeralComposerProvider>{children}</EphemeralComposerProvider>
<SyncedComposerProvider channelId={id}>{children}</SyncedComposerProvider>
```

## Lift state above the UI frame

This is the highest-leverage move in the whole document.

When something outside the visual box needs the component's state or actions, do not sync upward with `useEffect`, shared refs, or `onStateChange` callbacks. Pull the provider into its own children-taking component and place the outside UI inside it.

```tsx
// ❌ syncing child state back up
const [draft, setDraft] = useState('');
<Composer onDraftChange={setDraft} />
<ForwardButton disabled={!draft} onClick={() => submit(draft)} />

// ✅ lift the provider above both
<ComposerProvider>
  <ForwardMessageComposer />  {/* the visual box */}
  <MessagePreview />          {/* unrelated sibling */}
  <ForwardButton />           {/* outside the box, calls ctx.submit() directly */}
</ComposerProvider>
```

Anything inside the provider can use the actions even when it is visually outside the component.

## Review checklist

Flag any of these on sight:

- [ ] Boolean or enum props that gate which children render
- [ ] Prop names starting with `is`, `should`, `hide`, `show`, `only`, `with`, `disable` that control layout rather than a single leaf attribute
- [ ] Components with roughly 8+ props, or optional props added one per consumer
- [ ] `render*` props and config arrays standing in for children
- [ ] `useEffect` that copies child state into a parent
- [ ] Refs used to reach in and read form state
- [ ] Discriminated unions on props used to make an over-wide API tolerable (treat the union as evidence the component should be split)
- [ ] A provider nested inside the UI frame when consumers sit outside it
- [ ] Global or synced state hooks called inside a leaf component instead of at a root provider
- [ ] Manual memoization added preemptively rather than from a profile

## Refactor procedure

1. List every variant of the component and diff them in UI and behavior.
2. Extract the shared internals as named compound parts.
3. Rewrite each variant as its own JSX tree. Delete every boolean that existed only to gate rendering.
4. Define the context interface: `state`, `actions`, `meta`.
5. Create one provider per state implementation. Move global/synced hooks into those providers.
6. Hoist the provider above the widest consumer of its actions.
7. Add a thin convenience wrapper only if the same part sequence repeats 3+ times, and give it no variant flags.

## Notes for AI-generated React

A composed codebase is a better prompt. Small, single-purpose components leave far less surface to hallucinate, and the diffs stay reviewable.

When generating React here, restate these conventions in the plan before writing code. Reject generated code that reintroduces boolean-prop branching even when it works.

The next time you're 15 booleans deep into your component props, remember: composition is all you need.

## What is not a violation

- CVA `variant` / `size` props on a primitive that only choose a className (`Button`, `Badge`). The prop picks styling, not a subtree.
- A single leaf attribute forwarded to one element: `disabled`, `aria-*`, `placeholder`, `className`, `asChild`.
- Mapping a homogeneous data array (mock posts, files, members) to one component. The violation is a *config* array describing heterogeneous UI shapes.

## In this codebase

- Feature components live under `src/components/features/<feature>/`; export compound parts as named exports from the feature's module (e.g. `ComposerProvider`, `ComposerFrame`, `ComposerInput`) and assemble variants at the page or layout level.
- Everything here renders mock data from `src/mocks/`. Providers hold ephemeral `useState`; do not add business logic to make a variant work — leave a `TODO` where a synced provider will replace it later.
