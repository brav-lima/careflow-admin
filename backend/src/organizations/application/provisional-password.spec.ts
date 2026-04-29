import { generateProvisionalPassword } from './provisional-password'

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'

describe('generateProvisionalPassword', () => {
  it('generates a string of the default length (12)', () => {
    expect(generateProvisionalPassword()).toHaveLength(12)
  })

  it('respects a custom length', () => {
    expect(generateProvisionalPassword(20)).toHaveLength(20)
  })

  it('only uses characters from the safe alphabet', () => {
    for (let i = 0; i < 100; i++) {
      const pwd = generateProvisionalPassword()
      for (const char of pwd) {
        expect(ALPHABET).toContain(char)
      }
    }
  })

  it('excludes ambiguous characters (0, O, 1, I, l)', () => {
    const ambiguous = ['0', 'O', '1', 'I', 'l']
    for (let i = 0; i < 100; i++) {
      const pwd = generateProvisionalPassword()
      for (const char of ambiguous) {
        expect(pwd).not.toContain(char)
      }
    }
  })

  it('produces different passwords on successive calls', () => {
    const passwords = new Set(Array.from({ length: 50 }, () => generateProvisionalPassword()))
    expect(passwords.size).toBeGreaterThan(1)
  })
})
