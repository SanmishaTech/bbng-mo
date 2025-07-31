import { createTamagui, createTokens } from '@tamagui/core'

const tokens = createTokens({
  color: {
    white: '#fff',
    black: '#000',
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#ffffff',
    backgroundDark: '#000000',
  },
  space: {
    0: 0,
    0.5: 2,
    1: 4,
    1.5: 6,
    2: 8,
    2.5: 10,
    3: 12,
    3.5: 14,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
  },
  size: {
    0: 0,
    0.5: 2,
    1: 4,
    1.5: 6,
    2: 8,
    2.5: 10,
    3: 12,
    3.5: 14,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
  },
  radius: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    true: 8,
  },
  zIndex: {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
  },
})

const appConfig = createTamagui({
  tokens,
  themes: {
    light: {
      background: tokens.color.white,
      color: tokens.color.black,
    },
    dark: {
      background: tokens.color.backgroundDark,
      color: tokens.color.white,
    },
  },
})

export default appConfig

export type Conf = typeof appConfig

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends Conf {}
}
