---
name: ui-patterns
description: |
  @rfdtech/components patterns, lessons learned, UI conventions, and what-not-to-do.
  Read before building any component, page, or layout.
---

# UI Patterns

## @rfdtech/components first

Use `@rfdtech/components` for every standard UI element. Never hand-roll a button, card, table,
modal, dialog, dropdown, progress bar, etc.

| Need            | Use                                                                                                                                                |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Click action    | `Button`                                                                                                                                           |
| Text input      | `Input`                                                                                                                                            |
| Select/dropdown | `Dropdown`                                                                                                                                         |
| Phone number    | `PhoneNumberInput`                                                                                                                                 |
| Checkbox        | `Checkbox`                                                                                                                                         |
| Radio options   | `RadioGroup`                                                                                                                                       |
| Date            | `DateSelector` / `DateRangeSelector`                                                                                                               |
| Upload          | `UploadField`                                                                                                                                      |
| Modal           | `Modal` (4 sizes)                                                                                                                                  |
| Confirm/alert   | `Dialog`                                                                                                                                           |
| Popover menu    | `Popover`                                                                                                                                          |
| Table           | `Table` + `TableHeader` + `TableSearch` + `TableFilter` + `TableActions` + `TableContent` + `TableBulkActions` + `TableFooter` + `TablePagination` |

If a component doesn't exist, use the `rfdtech-ui` skill's MCP tools (`search_components`,
`get_component_types`, `get_rules`) before building custom.

---

## Hard rules (read every session)

1. **MetricCard**: use `description` prop for bottom text. NEVER use `trend` or `trendValue`.
2. **SidebarBadge**: MUST be a child of `SidebarLink`, not a sibling. Unique key on `SidebarItem` =
   `item.label`.
3. **Pages for lazy routes**: export `function Component()`, not named exports.
4. **Error handling**: use `errorElement: <RouteErrorPage />` at route level, NOT class-based
   ErrorBoundary (except at the app root — see `@starter/ui`'s `AppProviders`, which wraps
   everything in an `ErrorBoundary` as the outermost safety net).
5. **404**: standalone top-level route with `errorElement`, NOT wrapped in any layout.
6. **No padding div inside Card**: `<Card>` already has its own padding. Do NOT wrap children in
   `<div className="p-4">`.
7. **Table columns must be memoized**: define column arrays inside `useMemo`.
8. **Table actions/filters go in `<TableActions>`**: NEVER render action buttons outside the
   designated slot.
9. **Options arrays must be `useMemo`'d**: never inline `options={[...]}`.
10. **No single-letter variable names**: use `users`, not `u`; `filteredRoles`, not `fr`.
11. **No emojis, no em dashes, no coauthors** anywhere.
12. **No unnecessary long descriptive comments**.
13. **No internal page padding**: pages inside `AppBody`/layout must NOT add `p-*`, `px-*`, `py-*`,
    `m-*`, or `bg-background`.
14. **No duplicate layout backgrounds**: never add `bg-background` to page roots or dashboard
    sections.
15. **No Card double-padding**: never put padding wrappers directly inside `Card`, `DialogContent`,
    or `ModalContent`.
16. **No extra stats by default**: do not add stats bars, summary cards, or extra info sections
    unless explicitly requested.
17. **No static inline styles**: use Tailwind arbitrary values like `h-[calc(100vh-80px)]`.
18. **No native controls by default**: never use native `<button>`, `<input>`, `<select>`,
    `<textarea>`, etc. when a component exists.
19. **Card actions belong in `CardActions`**: must be inside `<CardActions>` as a sibling of
    `<CardTitle>`.
20. **Row actions use `rowActions`**: per-row actions on `<TableContent>`, not hand-rolled action
    cells.

---

## Modal structure

```
<Modal>
  <ModalPortal>
    <ModalOverlay />
    <ModalContent showCloseButton size="md|lg">
      <ModalHeader>
        <ModalTitle>Title</ModalTitle>
        <ModalDescription>Optional description</ModalDescription>
      </ModalHeader>
      <Form {...form}>
        <ModalBody>
          <div className="flex flex-col gap-6">{/* fields */}</div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary">Action</Button>
        </ModalFooter>
      </Form>
    </ModalContent>
  </ModalPortal>
</Modal>
```

- No `<form>` element — call `form.handleSubmit(onSubmit)` from the button's `onClick`.
- Cancel button: `variant="ghost"`, **no icon** (modal actions are iconless).
- Submit button: `variant="primary"` for create/assign, `variant="primary-destructive"` for
  destructive actions.
- Button ordering: Ghost (Cancel) then Primary (action) then Destructive (last, rightmost).

### User profile section in modals

```tsx
<div className="flex items-center gap-4">
  <Avatar name={userName} size={48} />
  <div className="flex flex-col">
    <span className="text-sm font-medium text-foreground">{userName}</span>
    <span className="text-xs text-foreground-muted">{userEmail}</span>
  </div>
</div>
```

### Section labels

- Section heading: `text-sm font-medium text-foreground`
- Section sub-label: `text-xs font-medium text-foreground-muted uppercase tracking-wider`
- Heading to fields gap: `gap-[13px]` (not `gap-4`)

---

## Dialog (confirmation) pattern

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogPortal>
    <DialogOverlay />
    <DialogContent>
      <div className="flex items-center gap-2">
        <CircleX className="size-5 text-error shrink-0" />
        <DialogTitle>Title</DialogTitle>
      </div>
      <DialogDescription>Description</DialogDescription>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={handleAction}>
          Action
        </Button>
      </div>
    </DialogContent>
  </DialogPortal>
</Dialog>
```

- No `classNames={{ content: "p-0 overflow-hidden" }}` — DialogContent handles its own padding.
- No inner wrapper divs — title, description, actions live directly inside `DialogContent`.
- Confirm flows manually close: `onClick={() => { onConfirm(); onOpenChange(false); }}`.

### Bulk delete — read selection from state

```tsx
// Just open the dialog, no id capture
onClick: () => setDeleteConfirmOpen(true);

// On confirm, read directly from `selected`:
function handleDeleteConfirm() {
  query.setData((prev) => prev.filter((u) => !selected.has(u.id)));
  setSelected(new Set());
  setDeleteConfirmOpen(false);
}
```

---

## Toast patterns

```tsx
import { useToast } from '@rfdtech/components';

const { toast } = useToast();

toast({
  title: 'Action Completed',
  description: 'Details about what happened.',
  variant: 'success' | 'error' | 'warning' | 'default',
  icon: <CheckCircle2 size={18} strokeWidth={2} aria-hidden />,
});
```

### Rules

- Always extract toast logic into named handler functions — never call `toast()` inside a JSX
  lambda.
- Icon size must be `size={18} strokeWidth={2}`. Mark `aria-hidden`.

### Endpoint toast config

Instead of `useRef` + `useEffect` + `useToast` boilerplate, pass `toast` on the hook's options (see
`architecture` skill):

```tsx
const query = useQueryEndpoint(endpoint, args, {
  toast: { onError: [{ condition: () => true, title: 'Failed', variant: 'error' }] },
});

const { mutateAsync } = useMutationEndpoint(endpoint, {
  toast: {
    onSuccess: [{ condition: (r) => r.status === 'queued', title: 'Queued', variant: 'success' }],
    onError: [{ condition: () => true, title: 'Failed', variant: 'error' }],
  },
});
```

Each entry: `{ condition, title, variant }`. `title` can be a string or function. Pure side-effect
toasts belong entirely in `toast` — no refs, no `useToast`, no `useEffect`.

---

## Page layout patterns

### Full-height page with scrollable sections

```tsx
<div className="h-[calc(100vh-80px)] flex flex-col gap-body">
```

### Scrollable card content

```tsx
<Card className="flex-[2] min-h-0 flex flex-col">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hidden">{/* scrollable content */}</div>
</Card>
```

Key: `min-h-0` is required for flex overflow to work.

### scrollbar-hidden utility

Defined in `packages/tailwind-config/theme.css`:

```css
@utility scrollbar-hidden {
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
}
```

### Flex height distribution

```tsx
<div className="flex flex-1 flex-col gap-4 min-h-0">
  <Card className="flex-[2] min-h-0 flex flex-col"> {/* 2/3 */}</Card>
  <Card className="flex-[1] min-h-0 flex flex-col"> {/* 1/3 */}</Card>
</div>
```

---

## View-mode toggles — swap content only, never layout

```tsx
<Table paramPrefix="records">
  <TableHeader>{/* search + toggle + filters — same for both modes */}</TableHeader>

  {viewMode === 'list' ? (
    <TableContent columns={columns} data={paged} rowKey={...} />
  ) : (
    <div className="grid grid-cols-... gap-4 p-4">{/* tiles */}</div>
  )}

  <TableFooter><TablePagination ... /></TableFooter>
</Table>
```

**Never** pull `TableSearch`, `TableFilter`, or `ViewModeToggle` out of `<Table>` context.

---

## Field / form patterns

### No `<form>` element in modals

Call `form.handleSubmit(onSubmit)` from the submit button's `onClick`.

### Required fields

Use one banner at the top: `<p className="text-sm text-error -mt-2">All fields are required</p>`. Do
NOT put `*` on each label.

### Warning info section

```tsx
<div className="bg-warning-bg rounded-xl p-4 flex gap-3">
  <Info className="size-5 text-warning shrink-0 mt-0.5" />
  <p className="text-sm text-foreground-muted leading-relaxed">...</p>
</div>
```

### "Add" buttons for repeatable sections

```tsx
<button
  type="button"
  className="flex items-center gap-2 mx-auto text-blue-600 cursor-pointer text-sm font-medium hover:underline"
  onClick={() => append({ ... })}
>
  <PlusCircle className="size-4" />
  Add Item
</button>
```

---

## Labels and typography

- Section titles: `text-base font-medium text-foreground`
- Field labels: via `<FieldLabel>` (14px/500/foreground)
- Sub-labels: `text-xs text-foreground-muted mt-0.5`
- Surface backgrounds: use `bg-surface-muted/20` for subtle card backgrounds inside modals
- Rounded corners: `rounded-xl`
- **No inline border overrides** on DateSelector or Dropdown. Keep component defaults.

---

## Accordion pattern

```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@rfdtech/components';

<Accordion type="single" collapsible>
  <AccordionItem value="sessions">
    <AccordionTrigger>Section Title</AccordionTrigger>
    <AccordionContent>...</AccordionContent>
  </AccordionItem>
</Accordion>;
```

---

## Don't add icons that components already render

- `DateDisplay` (from `@starter/ui`) already shows `Calendar` + `Clock` icons (when `noIcons` is
  false, the default).
- Adding an explicit `<Calendar>` before `<DateDisplay>` is a double icon.
- A navigation button uses `ExternalLink` or `ArrowRight`, not `Download`.

---

## What not to do

- Don't put unnecessary wrapping divs or labels.
- Don't add `FieldDescription` unless the design explicitly calls for it.
- Don't keep unused imports after removing dependent code.
- Don't use hardcoded colors — always use theme tokens (`text-foreground`, `bg-surface-muted`,
  etc.).
- Don't override component borders — keep the library's defaults.
- Don't use native `<button>` when a library `<Button>` is expected, and vice versa.
- Don't use absolute positioning for inline elements inside grid layouts — use flex rows.
- Don't change global accent tokens for a single UI element — use Tailwind color classes.
- Don't put `*` on every required label — use one banner.
- Don't mix grid and flex layouts for the same row — pick one.
- Don't use `style={{}}` — use Tailwind arbitrary values.
- Don't add explicit padding inside Card content — Card has built-in padding.
- Don't add `border-t` on card footers — keep the flow borderless.
- Don't add redundant state. If props, store values, or query results already track it, use that.
- Don't use camelCase labels in UI — use plain language. Split `full_name` into `Full Name`.
- Don't add unrequested features.
