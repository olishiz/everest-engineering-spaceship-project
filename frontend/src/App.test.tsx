// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

describe('Spaceship dashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('scrollTo', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('loads the operational overview in demo mode', async () => {
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Mission dashboard' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /demo data/i })).toBeTruthy();
    expect(screen.getByLabelText('Mission metrics').children).toHaveLength(4);
  });

  it('onboards a passenger from the manifest workflow', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: 'Mission dashboard' });

    fireEvent.click(screen.getByRole('button', { name: 'Passengers' }));
    fireEvent.click(screen.getAllByRole('button', { name: /add passenger/i })[0]);
    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: 'Maya Chen' },
    });
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'maya@x26.space' },
    });
    fireEvent.change(screen.getByLabelText('Membership tier'), {
      target: { value: 'GOLD' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create passenger/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Maya Chen').length).toBeGreaterThan(0);
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });
});
