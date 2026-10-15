export function Partial({
  name,
  children,
  id,
  class: className = "",
}: {
  name: string;
  children?: any;
  id?: string;
  class?: string;
}) {
  return (
    <div
      data-partial={name}
      id={id || `partial-${name}`}
      class={`hono-partial ${className}`.trim()}
    >
      {children}
    </div>
  );
}
