export function mountContactForm(section: HTMLElement) {
  const form = section.querySelector<HTMLFormElement>('form');
  const success = section.querySelector<HTMLElement>('.contact__success');
  const button = form?.querySelector<HTMLButtonElement>('[type="submit"]');
  const error = section.querySelector<HTMLElement>('.form__error');
  if (!form || !success || !button || !error) return;

  // Preserve each theme's button contents, including any icon.
  const buttonContents = button.innerHTML;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled) return;
    button.disabled = true;
    button.textContent = 'Sending…';
    error.textContent = '';
    try {
      const response = await fetch('https://formspree.io/f/xqewvpqp', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = data?.errors?.[0]?.message;
        throw new Error(typeof message === 'string' ? message : 'Something went wrong — please try again.');
      }
      form.reset();
      form.style.display = 'none';
      success.classList.add('contact__success--visible');
      const heading = success.querySelector<HTMLElement>('.contact__success-heading');
      if (heading) {
        heading.tabIndex = -1;
        heading.focus();
      }
    } catch (cause) {
      button.innerHTML = buttonContents;
      button.disabled = false;
      error.textContent = cause instanceof Error ? cause.message : 'Something went wrong — please try again.';
    }
  });
}
