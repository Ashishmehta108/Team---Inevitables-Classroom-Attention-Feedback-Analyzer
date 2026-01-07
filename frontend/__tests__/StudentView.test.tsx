import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StudentView } from '@/components/StudentView';

jest.mock('@/lib/api', () => ({
  markAttendance: jest.fn(),
  respondPoll: jest.fn(),
  createDoubt: jest.fn(),
  submitFeedback: jest.fn(),
  getPollResults: jest.fn()
}));

const mockedApi = jest.requireMock('@/lib/api');

describe('StudentView', () => {
  const token = 'tok';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('marks attendance with provided session id', async () => {
    mockedApi.markAttendance.mockResolvedValue({ ok: true });
    render(<StudentView token={token} studentCode="STU-1234" />);

    fireEvent.change(screen.getByPlaceholderText(/session id/i), { target: { value: 'sess-1' } });
    fireEvent.click(screen.getByText(/Mark Present/i));

    await waitFor(() => expect(mockedApi.markAttendance).toHaveBeenCalledWith(token, 'sess-1'));
  });

  it('submits poll vote using loaded options', async () => {
    mockedApi.getPollResults.mockResolvedValue({
      poll: { id: 'poll-1', question: 'Ready?' },
      results: [{ optionId: 'opt-yes', text: 'Yes', count: 0 }]
    });
    mockedApi.respondPoll.mockResolvedValue({ ok: true });
    render(<StudentView token={token} studentCode="STU-9999" />);

    const pollInputs = screen.getAllByPlaceholderText(/Poll ID/i);
    fireEvent.change(pollInputs[0], { target: { value: 'poll-1' } });
    fireEvent.click(screen.getByText(/Load Poll/i));

    await waitFor(() => screen.getByText('Yes'));
    fireEvent.click(screen.getByText('Yes'));
    fireEvent.click(screen.getByText(/Submit Vote/i));

    await waitFor(() => expect(mockedApi.respondPoll).toHaveBeenCalledWith(token, 'poll-1', 'opt-yes'));
  });
});
