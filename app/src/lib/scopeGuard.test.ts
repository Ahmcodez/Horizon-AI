import { describe, it, expect } from 'vitest'
import { looksOffTopic } from './scopeGuard'

describe('looksOffTopic', () => {
  it('flags clearly off-topic requests', () => {
    expect(looksOffTopic('What is the weather today?')).toBe(true)
    expect(looksOffTopic('Write me a poem about spring')).toBe(true)
    expect(looksOffTopic('Tell me a joke')).toBe(true)
    expect(looksOffTopic('What is the stock price of Apple?')).toBe(true)
  })

  it('does not flag genuine Social Security / Medicare questions', () => {
    expect(looksOffTopic('Should I claim now or wait two years?')).toBe(false)
    expect(looksOffTopic('How does the earnings test work?')).toBe(false)
    expect(looksOffTopic('What is IRMAA and does it apply to me?')).toBe(false)
    expect(looksOffTopic('When is my full retirement age?')).toBe(false)
  })

  it('does not flag an empty or whitespace-only question', () => {
    expect(looksOffTopic('')).toBe(false)
    expect(looksOffTopic('   ')).toBe(false)
  })
})
