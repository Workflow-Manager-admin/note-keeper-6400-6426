import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Kavia Notes app title on topbar', () => {
  render(<App />);
  const topbarTitle = screen.getByText(/Kavia Notes/i);
  expect(topbarTitle).toBeInTheDocument();
});
