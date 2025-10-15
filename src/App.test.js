import { render, screen } from '@testing-library/react';
import React from 'react';

// Simple test component to verify testing setup works
const TestComponent = () => {
  return <div data-testid="test-component">Test Component</div>;
};

describe('Testing Setup', () => {
  test('renders test component', () => {
    render(<TestComponent />);
    const testElement = screen.getByTestId('test-component');
    expect(testElement).toBeInTheDocument();
    expect(testElement).toHaveTextContent('Test Component');
  });

  test('basic DOM operations work', () => {
    const div = document.createElement('div');
    div.textContent = 'Hello World';
    document.body.appendChild(div);
    
    expect(div).toBeInTheDocument();
    expect(div).toHaveTextContent('Hello World');
    
    document.body.removeChild(div);
  });

  test('Jest matchers work correctly', () => {
    expect(true).toBe(true);
    expect(1 + 1).toBe(2);
    expect('hello').toContain('lo');
  });
});
