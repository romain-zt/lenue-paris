import { vi } from 'vitest';

vi.mock('next/font/google', () => ({
  Cormorant_Garamond: () => ({ variable: '--font-cormorant', className: 'mock-cormorant' }),
  Jost: () => ({ variable: '--font-jost', className: 'mock-jost' }),
}));

vi.mock('next/font/local', () => ({
  default: () => ({ variable: '--font-local', className: 'mock-local' }),
}));
