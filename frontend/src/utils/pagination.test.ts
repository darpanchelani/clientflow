import { extractCursor } from './pagination';

describe('extractCursor', () => {
  it('extracts an encoded cursor from an API URL', () => {
    expect(extractCursor('https://api.example.com/leads?cursor=next%3Dpage')).toBe('next=page');
  });

  it('returns null for absent or malformed URLs', () => {
    expect(extractCursor(null)).toBeNull();
    expect(extractCursor('not a url')).toBeNull();
  });
});
