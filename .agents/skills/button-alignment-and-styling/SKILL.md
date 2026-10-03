---
name: button-alignment-and-styling
description: Standards and guidelines for button alignment, equal height, modal action footers, semantic action tones, and button color palette (primary accent, secondary brand-blue, cancel red). Use when creating or styling buttons, button groups, modal actions, and fixing button height disparities.
license: MIT
metadata:
  author: frontend-quality
  version: "1.0"
---

# Button Alignment, Sizing, and Styling Standards

This skill documents the rules and patterns to ensure that all buttons across the application (especially grouped buttons in modals and forms) have identical height, perfect vertical alignment, and consistent semantic styling.

---

## 1. The Root Causes of Button Misalignment

1. **Border Box Disparity (The 2px Jump):**
   - When a button with a 1px border (`border: 1px solid ...`) sits next to a button with `border: none;`, even with identical vertical padding, the bordered button is **2px taller** (1px top + 1px bottom).
   - Solution: Every button must have a base `border: 1px solid transparent;` (or an explicit 1px colored border). When border colors change, the physical box dimensions remain constant.

2. **Missing `align-items: center` in Containers:**
   - In CSS Flexbox, `align-items` defaults to `stretch`.
   - If buttons have slightly different intrinsic heights, line-heights, or paddings, `stretch` distorts them or aligns them unevenly.
   - Solution: All modal action rows and button group containers MUST declare `align-items: center;`.

3. **Explicit Height and `line-height: 1`:**
   - Relying solely on padding (`padding: 10px 16px`) causes heights to vary if font sizes or fonts differ (e.g. Outfit vs JetBrains Mono or icons inside).
   - Solution: Set standard `height: 42px; min-height: 42px; line-height: 1;`.

4. **Mixing `<button>`, `<a>`, and `<label>` Elements:**
   - In 3-button groups (such as modal actions where one button triggers a link to WhatsApp or a file upload), mixing `<a>`, `<button>`, and `<label>` can cause baseline jumps unless all elements share `display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box;`.

---

## 2. Global Button Specifications

Every standard button should adhere to the following base rules:

```css
button,
.btn-primary,
.btn-secondary,
.btn-blue,
.btn-cancel,
.btn-submit {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 42px;
  height: 42px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid transparent; /* Crucial: 1px baseline prevents height jumps */
  font-family: inherit;
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
}
```

---

## 3. Color Palette & Semantic Tones

Never use dull, unstyled browser grey (`#e5e7eb`, default button grey, or bland grey text) for secondary actions.

### 3.1 Primary Action (`.btn-primary`, `.btn-submit`)
- **Fondo:** `var(--accent-color)` (Naranja vibrante)
- **Texto:** `var(--white)`
- **Borde:** `1px solid var(--accent-color)`
- **Hover:** `background: var(--accent-hover); border-color: var(--accent-hover); transform: translateY(-1px);`

### 3.2 Secondary Action (`.btn-secondary`, `.btn-blue`)
- **Fondo:** `var(--brand-blue)` (`#1d5fbf`)
- **Texto:** `var(--white)`
- **Borde:** `1px solid var(--brand-blue)`
- **Hover:** `background: #154ca0; border-color: #154ca0; color: var(--white); transform: translateY(-1px);`

### 3.3 Cancel Action (`[data-action-tone="cancel"]`, `.btn-cancel`)
- **Fondo:** `var(--action-cancel-bg)` (Rojo suave)
- **Texto:** `var(--text-primary)`
- **Borde:** `1px solid var(--error-color)`
- **Hover:** `background: var(--action-cancel-hover);`

### 3.4 Add / Upload Action (`[data-action-tone="add"]`, `[data-action-tone="upload"]`)
- **Fondo:** `var(--action-add-bg)` (Verde suave)
- **Texto:** `var(--text-primary)`
- **Borde:** `1px solid var(--success-color)`
- **Hover:** `background: var(--action-add-hover);`

---

## 4. Modal Action Containers

Modal footers and action rows MUST follow this standard layout pattern:

```css
.modal-actions-row,
.modal-footer-actions,
.modal-actions,
.modal-footer {
  display: flex;
  align-items: center; /* NEVER omit this */
  justify-content: flex-end;
  gap: var(--space-3);
  flex-wrap: wrap;
}

/* Ensure all child buttons/links conform to identical height */
:is(.modal-actions-row, .modal-footer-actions, .modal-actions, .modal-footer) > :is(button, a, label) {
  box-sizing: border-box;
  min-height: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
```

---

## 5. Examples

### ❌ Incorrect Pattern
```css
/* Bad: Mismatched borders, missing container alignment, dull grey button */
.modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.modal__btn-cancel {
  padding: 10px 20px;
  border: 1px solid var(--border-color); /* 2px taller than submit! */
  background: var(--surface-soft);
  color: var(--text-secondary);
}

.modal__btn-submit {
  padding: 10px 20px;
  border: none;
  background: var(--accent-color);
  color: white;
}
```

### ✅ Correct Pattern
```css
/* Good: Exact height, 1px baseline border, center alignment, semantic blue/red */
.modal__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);
}

.modal__btn-cancel {
  box-sizing: border-box;
  height: 42px;
  min-height: 42px;
  padding: 0 var(--space-5);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  border: 1px solid var(--error-color);
  background: var(--action-cancel-bg);
  color: var(--text-primary);
  line-height: 1;
}

.modal__btn-submit {
  box-sizing: border-box;
  height: 42px;
  min-height: 42px;
  padding: 0 var(--space-5);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  border: 1px solid var(--accent-color);
  background: var(--accent-color);
  color: var(--white);
  line-height: 1;
}
```
