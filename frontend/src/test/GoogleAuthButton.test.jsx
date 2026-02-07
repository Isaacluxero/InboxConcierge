import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GoogleAuthButton from '../components/Auth/GoogleAuthButton';

// Mock window.location
delete window.location;
window.location = { href: '' };

describe('GoogleAuthButton', () => {
  it('should render the button', () => {
    render(<GoogleAuthButton />);

    const button = screen.getByRole('button', { name: /sign in with google/i });
    expect(button).toBeInTheDocument();
  });

  it('should have correct styling', () => {
    render(<GoogleAuthButton />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-primary');
  });

  it('should redirect to Google auth URL on click', async () => {
    const user = userEvent.setup();
    render(<GoogleAuthButton />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(window.location.href).toContain('/auth/google');
  });

  it('should display Google icon', () => {
    render(<GoogleAuthButton />);

    // Check for the Google 'G' text
    expect(screen.getByText('G')).toBeInTheDocument();
  });
});
