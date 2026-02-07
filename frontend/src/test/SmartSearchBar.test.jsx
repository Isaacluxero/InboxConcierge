import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SmartSearchBar from '../components/Search/SmartSearchBar';

describe('SmartSearchBar', () => {
  let mockOnSearch;

  beforeEach(() => {
    mockOnSearch = vi.fn();
  });

  it('should render search input', () => {
    render(<SmartSearchBar onSearch={mockOnSearch} isLoading={false} />);

    const input = screen.getByPlaceholderText(/search emails/i);
    expect(input).toBeInTheDocument();
  });

  it('should call onSearch when form is submitted', async () => {
    const user = userEvent.setup();
    render(<SmartSearchBar onSearch={mockOnSearch} isLoading={false} />);

    const input = screen.getByPlaceholderText(/search emails/i);
    const searchButton = screen.getByRole('button', { name: /search/i });

    await user.type(input, 'test query');
    await user.click(searchButton);

    expect(mockOnSearch).toHaveBeenCalledWith('test query');
  });

  it('should not submit empty search', async () => {
    const user = userEvent.setup();
    render(<SmartSearchBar onSearch={mockOnSearch} isLoading={false} />);

    const searchButton = screen.getByRole('button', { name: /search/i });
    await user.click(searchButton);

    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it('should show loading state', () => {
    render(<SmartSearchBar onSearch={mockOnSearch} isLoading={true} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText(/searching/i)).toBeInTheDocument();
  });

  it('should clear input after submission', async () => {
    const user = userEvent.setup();
    render(<SmartSearchBar onSearch={mockOnSearch} isLoading={false} />);

    const input = screen.getByPlaceholderText(/search emails/i);
    await user.type(input, 'test query');

    const form = input.closest('form');
    await user.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('should handle long search queries', async () => {
    const user = userEvent.setup();
    render(<SmartSearchBar onSearch={mockOnSearch} isLoading={false} />);

    const longQuery = 'a'.repeat(500);
    const input = screen.getByPlaceholderText(/search emails/i);

    await user.type(input, longQuery);
    await user.click(screen.getByRole('button', { name: /search/i }));

    expect(mockOnSearch).toHaveBeenCalledWith(longQuery);
  });

  it('should trim whitespace from queries', async () => {
    const user = userEvent.setup();
    render(<SmartSearchBar onSearch={mockOnSearch} isLoading={false} />);

    const input = screen.getByPlaceholderText(/search emails/i);
    await user.type(input, '  test query  ');
    await user.click(screen.getByRole('button', { name: /search/i }));

    expect(mockOnSearch).toHaveBeenCalledWith('test query');
  });
});
