/**
 * Discriminated union field definitions for the SectionedEditor.
 * Every field has a key (unique per section), a label, and a kind.
 * None of these fields ask users to enter JSON — each data point is its own input.
 */

// Simple single-value field kinds
export type SimpleFieldDef = {
  key: string;
  label: string;
  placeholder?: string;
  hint?: string;
  /** Span full width in the 2-column grid */
  wide?: boolean;
} & (
  | { kind: "text" }
  | { kind: "textarea"; rows?: number }
  | { kind: "number"; unit?: string }
  | { kind: "email" }
  | { kind: "url" }
  | { kind: "select"; options: string[] }
  | { kind: "toggle"; onLabel?: string; offLabel?: string }
  | { kind: "richtext" }
);

/** A list of plain text strings — e.g. algorithm filter chips, feature bullet lines */
export type ArrayStringFieldDef = {
  key: string;
  kind: "array-string";
  label: string;
  hint?: string;
  placeholder?: string;
  wide?: boolean;
};

/** A repeatable list of structured objects — e.g. FAQ items, plan cards, stat rows */
export type ArrayObjectFieldDef = {
  key: string;
  kind: "array-object";
  label: string;
  itemLabel?: string;
  schema: SimpleFieldDef[];
  hint?: string;
  wide?: boolean;
};

export type FieldDef = SimpleFieldDef | ArrayStringFieldDef | ArrayObjectFieldDef;

export type SectionDef = {
  id: string;
  title: string;
  description?: string;
  fields: FieldDef[];
  /** Form-state key holding a boolean ("true"/"false") for whether this section is shown on the live site. When set, a Show-on-site toggle is rendered in the section header bar. */
  visibleKey?: string;
};
