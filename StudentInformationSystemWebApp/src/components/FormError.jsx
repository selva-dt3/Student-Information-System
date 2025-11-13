/**
 * PUBLIC_INTERFACE
 * FormError: Accessible, consistent error message display for forms
 */
export default function FormError({ id, message }) {
  if (!message) return null;
  return (
    <div id={id} className="sis-error" role="alert" aria-live="polite">
      {message}
    </div>
  );
}
