# Angular 17 Patterns Reference

## Component Anatomy

Every page and shared component in this project follows this structure:

```typescript
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
// import other Angular modules and services as needed

@Component({
  selector: 'app-my-page',         // kebab-case, 'app-' prefix
  standalone: true,                 // ALWAYS true
  imports: [
    CommonModule,                   // NgClass, NgStyle, AsyncPipe, etc.
    RouterLink,                     // for routerLink directive
    // ReactiveFormsModule          // if using forms
    // HttpClientModule             // NOT here — provided at root
  ],
  templateUrl: './my-page.page.html', // use templateUrl for pages > 300 lines
  // template: `...`               // inline only for short templates
})
export class MyPageComponent implements OnInit {
  // 1. Injected services
  private router = inject(Router);
  private svc    = inject(MyService);

  // 2. Signals (reactive state)
  isLoading = signal(false);
  items     = signal<Item[]>([]);

  // 3. Computed values
  count = computed(() => this.items().length);
  hasItems = computed(() => this.items().length > 0);

  // 4. Lifecycle
  ngOnInit() {
    this.loadData();
  }

  // 5. Methods
  private async loadData() { ... }
  onAction(id: string) { ... }
}
```

---

## Standalone Components

All components in this project are **standalone** (`standalone: true`). There are no NgModule declarations.

Key implications:
- Import what you use directly in `imports: []` on the `@Component` decorator
- `RouterLink`, `RouterOutlet` must be explicitly imported if used in template
- `HttpClient` is provided at app root — do NOT add `HttpClientModule` to component `imports`
- `ReactiveFormsModule` or `FormsModule` must be added when using forms

---

## Dependency Injection

Use `inject()` — never use constructor injection in new code:

```typescript
// ✓ Correct — inject() at field level
export class MyComponent {
  private svc  = inject(MyService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb   = inject(FormBuilder);
}

// ✗ Avoid — constructor injection (legacy pattern)
export class MyComponent {
  constructor(private svc: MyService) {}
}
```

`inject()` must be called at the class field level or inside the constructor body. It cannot be called inside lifecycle hooks or methods (the injection context is only active during construction).

---

## Signals

All reactive state uses Angular 17 signals — not `BehaviorSubject`, not component properties with `ngModel` without `ReactiveFormsModule`.

```typescript
import { signal, computed, effect } from '@angular/core';

// Writable signal
count = signal(0);
name  = signal('');
items = signal<string[]>([]);
user  = signal<User | null>(null);

// Read the value (in TypeScript):
const n = this.count();

// Write:
this.count.set(5);

// Update based on previous value:
this.count.update(prev => prev + 1);
this.items.update(prev => [...prev, newItem]);

// Computed (read-only derived signal):
total = computed(() => this.items().reduce((a, b) => a + b.amount, 0));

// Effect (runs whenever dependencies change — use sparingly):
_ = effect(() => {
  console.log('count changed:', this.count());
});
```

### In templates — always call signals as functions:
```html
<!-- ✓ Signal call syntax -->
<p>Count: {{ count() }}</p>
@if (user()) {
  <p>{{ user()!.name }}</p>
}

<!-- ✗ Wrong — signals are not plain properties -->
<p>Count: {{ count }}</p>
```

### Signal with complex objects:
```typescript
// For objects, replace the whole value on update
filters = signal({ status: 'ALL', page: 1 });

setStatus(s: string) {
  this.filters.update(prev => ({ ...prev, status: s }));
}
```

---

## Control Flow (Angular 17 Block Syntax)

**Never use `*ngIf`, `*ngFor`, `*ngSwitch`** in new code. Use the built-in block syntax:

```html
<!-- Conditional -->
@if (isLoading()) {
  <app-shimmer-skeleton />
} @else if (items().length === 0) {
  <p class="text-on-surface-variant text-sm">No items found</p>
} @else {
  <p>{{ count() }} items</p>
}

<!-- Loop -->
@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
} @empty {
  <p>Nothing here yet</p>
}

<!-- Switch -->
@switch (status()) {
  @case ('ACTIVE')    { <span class="text-tertiary">Active</span> }
  @case ('SUSPENDED') { <span class="text-error">Suspended</span> }
  @case ('PENDING')   { <span class="text-amber-700">Pending</span> }
  @default            { <span class="text-on-surface-variant">Unknown</span> }
}
```

`@for` requires a `track` expression — use a unique identifier (`item.id`, `item.ref`, etc.). This enables efficient DOM reconciliation.

---

## Lifecycle Hooks

| Hook | When it runs | Common use |
|---|---|---|
| `ngOnInit` | After constructor, before first render | Load initial data |
| `ngOnChanges` | Whenever `@Input` value changes | React to parent updates |
| `ngOnDestroy` | Before component is removed from DOM | Cancel subscriptions, clear timers |
| `ngAfterViewInit` | After the view (template) is rendered | Access `@ViewChild` elements |

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';

export class MyComponent implements OnInit, OnDestroy {
  private interval?: ReturnType<typeof setInterval>;

  ngOnInit() {
    this.interval = setInterval(() => this.refresh(), 30_000);
  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }
}
```

---

## Input / Output (Component Communication)

```typescript
import { Component, Input, Output, EventEmitter, input, output } from '@angular/core';

// New signal-based API (Angular 17.1+) — preferred
export class MyCardComponent {
  title = input.required<string>();          // required input
  subtitle = input('');                      // optional with default
  userId = input<string>();                  // optional, no default

  closed = output<void>();                   // typed output event
  selected = output<string>();

  onClose() {
    this.closed.emit();
  }

  onSelect(id: string) {
    this.selected.emit(id);
  }
}

// Usage in parent template:
// <app-my-card [title]="'Hello'" (closed)="onCardClosed()" />
```

---

## Reactive Forms

```typescript
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <input formControlName="email" type="email" />
      @if (form.get('email')?.invalid && form.get('email')?.touched) {
        <p class="text-error text-xs">Valid email required</p>
      }
      <button type="submit" [disabled]="form.invalid || isLoading()">Submit</button>
    </form>
  `
})
export class LoginFormComponent {
  private fb = inject(FormBuilder);
  isLoading  = signal(false);

  form = this.fb.nonNullable.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    name:     ['', [Validators.required, Validators.maxLength(100)]],
  });

  async onSubmit() {
    if (this.form.invalid) return;
    this.isLoading.set(true);
    try {
      const { email, password } = this.form.getRawValue();
      await this.svc.login(email, password);
    } finally {
      this.isLoading.set(false);
    }
  }
}
```

### Accessing form values and errors:
```typescript
// Get typed value (all fields, even disabled)
const val = this.form.getRawValue();

// Get value (skips disabled fields)
const val = this.form.value;

// Check field validity
this.form.get('email')?.valid      // boolean
this.form.get('email')?.invalid    // boolean
this.form.get('email')?.touched    // user has interacted
this.form.get('email')?.dirty      // value has changed
this.form.get('email')?.errors     // null | ValidationErrors

// Programmatically set error
this.form.get('email')?.setErrors({ serverError: 'Email already in use' });

// Reset form
this.form.reset();
```

---

## HTTP Client (Angular Services)

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);

  // GET request
  getUsers(page = 1, size = 20): Observable<UserListResponse> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);
    return this.http.get<UserListResponse>('/api/admin/users', { params });
  }

  // POST request
  createUser(payload: CreateUserDto): Observable<UserResponse> {
    return this.http.post<UserResponse>('/api/admin/users', payload);
  }

  // PUT request
  updateUser(id: string, payload: UpdateUserDto): Observable<UserResponse> {
    return this.http.put<UserResponse>(`/api/admin/users/${id}`, payload);
  }

  // DELETE request
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`/api/admin/users/${id}`);
  }

  // Extract inner data field from envelope
  getUserData(id: string): Observable<User> {
    return this.http.get<{ data: User }>(`/api/admin/users/${id}`).pipe(
      map(res => res.data)
    );
  }
}
```

---

## TanStack Query (`injectQuery`)

For pages that display server data, prefer `injectQuery` over direct `HttpClient` subscriptions — it handles caching, loading states, refetching, and error states.

```typescript
import { injectQuery, injectMutation } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

export class UsersPageComponent {
  private svc = inject(AdminService);

  // Basic query
  usersQuery = injectQuery(() => ({
    queryKey: ['users'],
    queryFn: () => lastValueFrom(this.svc.getUsers()),
  }));

  // Query with dynamic key (re-fetches when signal changes)
  page = signal(1);
  pagedQuery = injectQuery(() => ({
    queryKey: ['users', this.page()],
    queryFn: () => lastValueFrom(this.svc.getUsers(this.page())),
  }));

  // Mutation (for POST/PUT/DELETE)
  suspendMutation = injectMutation(() => ({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      lastValueFrom(this.svc.suspendUser(id, reason)),
    onSuccess: () => {
      this.toast.show('success', 'User suspended');
      // Optionally invalidate cache:
      // inject(QueryClient).invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => this.toast.show('error', 'Failed to suspend user'),
  }));
}
```

Template usage:
```html
@if (usersQuery.isPending()) {
  <app-shimmer-skeleton />
} @else if (usersQuery.isError()) {
  <p class="text-error">Failed to load users</p>
} @else {
  @for (user of usersQuery.data()?.data; track user.id) {
    <div>{{ user.name }}</div>
  }
}

<!-- Mutation button -->
<button
  (click)="suspendMutation.mutate({ id: user.id, reason: 'Policy violation' })"
  [disabled]="suspendMutation.isPending()">
  Suspend
</button>
```

---

## `toSignal` — Converting Observables to Signals

```typescript
import { toSignal } from '@angular/core/rxjs-interop';

export class MyComponent {
  private route = inject(ActivatedRoute);

  // Convert route param to signal
  userId = toSignal(this.route.paramMap.pipe(map(p => p.get('id'))));

  // With initial value
  userId = toSignal(this.route.paramMap.pipe(map(p => p.get('id'))), { initialValue: '' });
}
```

---

## `@ViewChild` — DOM / Child Component Access

```typescript
import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

export class MyComponent implements AfterViewInit {
  @ViewChild('myInput') inputRef!: ElementRef<HTMLInputElement>;

  ngAfterViewInit() {
    this.inputRef.nativeElement.focus();
  }
}
```

Template:
```html
<input #myInput type="text" />
```

---

## `@HostListener` and `@HostBinding`

```typescript
import { HostListener, HostBinding } from '@angular/core';

export class MyDirective {
  @HostBinding('class.active') isActive = false;

  @HostListener('click')
  onClick() {
    this.isActive = !this.isActive;
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.close();
  }
}
```

---

## Pipes

```html
<!-- Built-in pipes -->
{{ amount | currency:'NGN':'₦' }}
{{ date | date:'mediumDate' }}
{{ text | uppercase }}
{{ text | lowercase }}
{{ text | titlecase }}
{{ value | json }}
{{ list | slice:0:5 }}
{{ observable$ | async }}   <!-- async pipe — unsubscribes automatically -->
```

For custom pipes, create `src/app/pipes/my.pipe.ts`:
```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'myPipe', standalone: true, pure: true })
export class MyPipe implements PipeTransform {
  transform(value: string): string {
    return value.toUpperCase();
  }
}
```

Add `MyPipe` to the component's `imports` array to use it.

---

## Services

```typescript
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })   // singleton, tree-shakeable
export class AuthService {
  private http  = inject(HttpClient);

  // Signal-based state
  private _token = signal<string | null>(localStorage.getItem('token'));
  readonly token = this._token.asReadonly();

  isAuthenticated = computed(() => !!this._token());

  login(email: string, password: string) {
    return this.http.post<{ data: { token: string } }>('/api/auth/login', { email, password });
  }

  setToken(token: string) {
    localStorage.setItem('token', token);
    this._token.set(token);
  }

  logout() {
    localStorage.removeItem('token');
    this._token.set(null);
  }
}
```

---

## Error Handling Patterns

```typescript
// In a component method (imperative style)
async onSubmit() {
  this.isLoading.set(true);
  this.error.set(null);
  try {
    await lastValueFrom(this.svc.doSomething());
    this.toast.show('success', 'Done!');
    this.router.navigate(['/dashboard']);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Something went wrong';
    this.error.set(msg);
    this.toast.show('error', msg);
  } finally {
    this.isLoading.set(false);
  }
}
```

For HTTP errors from Angular `HttpClient`:
```typescript
import { HttpErrorResponse } from '@angular/common/http';

catch (err: unknown) {
  if (err instanceof HttpErrorResponse) {
    const msg = err.error?.message ?? err.message;
    this.error.set(msg);
  }
}
```

---

## NgClass and NgStyle

```html
<!-- NgClass with object syntax -->
<div [ngClass]="{
  'text-error': hasError(),
  'text-tertiary': !hasError(),
  'opacity-50': isDisabled()
}">...</div>

<!-- NgClass with conditional string -->
<div [class]="isActive() ? 'bg-primary text-white' : 'bg-surface text-on-surface'">...</div>

<!-- NgStyle (prefer Tailwind classes instead) -->
<div [ngStyle]="{ 'max-height': maxHeight() + 'px' }">...</div>
```

---

## Template Reference Variables

```html
<!-- Ref to input element -->
<input #emailInput type="email" />
<button (click)="onSubmit(emailInput.value)">Submit</button>

<!-- Ref to component -->
<app-dialog #dialogRef />
<button (click)="dialogRef.open()">Open</button>
```

---

## Event Binding

```html
<!-- Click -->
<button (click)="onSave()">Save</button>
<button (click)="onSave($event)">Save</button>   <!-- $event = MouseEvent -->

<!-- Input -->
<input (input)="onInput($event)" />               <!-- InputEvent -->
<input (change)="onChange($event)" />             <!-- change event (blur) -->
<input (keydown.enter)="onEnter()" />
<input (keydown.escape)="onClose()" />

<!-- Custom event from child -->
<app-card (dismissed)="onDismiss($event)" />

<!-- Prevent default -->
<a href="#" (click)="onClick($event); $event.preventDefault()">Link</a>
```

---

## Common Angular Mistakes to Avoid

| Mistake | Correct approach |
|---|---|
| Using `*ngIf` / `*ngFor` | Use `@if` / `@for` block syntax |
| Using `BehaviorSubject` for component state | Use `signal()` |
| Calling `inject()` inside `ngOnInit` | Call at class field level |
| Forgetting `track` in `@for` | Always add `track item.id` |
| Reading signal without `()` in template | Always call: `{{ value() }}` |
| Direct DOM access with `document.getElementById` | Use `@ViewChild` with `ElementRef` |
| Missing `standalone: true` | All components must be standalone |
| Missing module in `imports: []` | If a directive/component/pipe is used, it must be imported |
| Using `ngModel` without `FormsModule` in imports | Add `FormsModule` to `imports` |
| `HttpClient` added to component `imports` | It's provided at root — don't add it to components |
