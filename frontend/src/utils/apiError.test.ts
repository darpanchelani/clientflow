import { getFriendlyErrorMessage, parseApiErrorPayload } from './apiError';

describe('API error helpers', () => {
  it('flattens field validation errors', () => {
    expect(parseApiErrorPayload({ fields: { email: ['Already registered.'] } })).toBe(
      'email: Already registered.'
    );
  });

  it('does not expose server error bodies', () => {
    expect(
      getFriendlyErrorMessage({ response: { status: 500, data: { detail: 'database internals' } } })
    ).toBe('Server error. Please try again in a moment.');
  });

  it('uses a useful message for network failures', () => {
    expect(getFriendlyErrorMessage(new Error('offline'))).toBe(
      'Network error. Check your connection and try again.'
    );
  });
});
