import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App.jsx';

vi.mock('./api.js', () => ({
  generatePlans: vi.fn(),
  savePlans: vi.fn(),
  generateAndSave: vi.fn()
}));

describe('App', () => {
  it('renders the travel planner form', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: '旅遊行程 JSON 規劃器' })).toBeInTheDocument();
    expect(screen.getByLabelText('目的地')).toBeInTheDocument();
    expect(screen.getByLabelText('Notion Database ID')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '產生並寫入 Notion' })).toBeInTheDocument();
  });
});
