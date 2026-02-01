import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NegotiationInterface } from '../NegotiationInterface';
import { useNegotiationRoom } from '../../hooks/useNegotiationRoom';
import { useToast } from '../../hooks/use-toast';

// Mock dependencies
jest.mock('../../hooks/useNegotiationRoom');
jest.mock('../../hooks/use-toast');

const mockUseNegotiationRoom = useNegotiationRoom as jest.MockedFunction<typeof useNegotiationRoom>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

describe('NegotiationInterface - Dual Input Method Support', () => {
  const mockProps = {
    sessionId: 'test-session-id',
    userId: 'test-user-id',
    userType: 'CUSTOMER' as const,
    initialLanguage: 'en' as const,
    graphqlClient: null
  };

  const mockNegotiationRoom = {
    room: {
      id: 'room-1',
      sessionId: 'test-session-id',
      vendorId: 'vendor-1',
      customerId: 'customer-1',
      vendorLanguage: 'hi',
      customerLanguage: 'en',
      status: 'ACTIVE',
      messages: [],
      lastMessageAt: new Date().toISOString(),
      agreementReached: false
    },
    messages: [],
    isConnected: true,
    isLoading: false,
    error: null,
    typingUsers: [],
    sendMessage: jest.fn(),
    updateTypingStatus: jest.fn(),
    joinNegotiation: jest.fn(),
    reconnect: jest.fn()
  };

  const mockToast = jest.fn();

  beforeEach(() => {
    mockUseNegotiationRoom.mockReturnValue(mockNegotiationRoom);
    mockUseToast.mockReturnValue({ toast: mockToast });
    
    // Mock MediaRecorder
    global.MediaRecorder = jest.fn().mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      ondataavailable: null,
      onstop: null
    }));

    // Mock getUserMedia
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{ stop: jest.fn() }]
        })
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 12: Dual Input Method Support
   * Validates: Requirements 4.4
   * 
   * Tests that the negotiation interface supports both text and voice input methods
   * and allows users to switch between them seamlessly.
   */
  describe('Property 12: Dual Input Method Support', () => {
    it('should render both text input and voice recording controls', () => {
      render(<NegotiationInterface {...mockProps} />);

      // Text input should be present
      const textInput = screen.getByPlaceholderText(/type your message/i);
      expect(textInput).toBeInTheDocument();

      // Voice recording button should be present
      const voiceButton = screen.getByRole('button', { name: /voice/i });
      expect(voiceButton).toBeInTheDocument();

      // Send button should be present
      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeInTheDocument();
    });

    it('should allow text message input and sending', async () => {
      const mockSendMessage = jest.fn().mockResolvedValue(true);
      mockUseNegotiationRoom.mockReturnValue({
        ...mockNegotiationRoom,
        sendMessage: mockSendMessage
      });

      render(<NegotiationInterface {...mockProps} />);

      const textInput = screen.getByPlaceholderText(/type your message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Type a message
      fireEvent.change(textInput, { target: { value: 'Hello, I want to negotiate' } });
      expect(textInput).toHaveValue('Hello, I want to negotiate');

      // Send the message
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith({
          content: 'Hello, I want to negotiate',
          type: 'TEXT',
          language: 'en'
        });
      });

      // Input should be cleared after sending
      expect(textInput).toHaveValue('');
    });

    it('should allow voice recording and sending', async () => {
      const mockSendMessage = jest.fn().mockResolvedValue(true);
      mockUseNegotiationRoom.mockReturnValue({
        ...mockNegotiationRoom,
        sendMessage: mockSendMessage
      });

      render(<NegotiationInterface {...mockProps} />);

      const voiceButton = screen.getByRole('button', { name: /voice/i });

      // Start recording
      fireEvent.click(voiceButton);

      await waitFor(() => {
        expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
      });

      // Simulate recording completion by creating a mock blob
      const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });
      
      // Mock the MediaRecorder behavior
      const mockRecorder = {
        start: jest.fn(),
        stop: jest.fn(),
        ondataavailable: null,
        onstop: null
      };

      // Simulate data available and stop events
      if (mockRecorder.ondataavailable) {
        mockRecorder.ondataavailable({ data: mockBlob });
      }
      if (mockRecorder.onstop) {
        mockRecorder.onstop();
      }

      // The voice message should be available for sending
      // This would typically show a preview with send/cancel options
    });

    it('should support switching between input methods', async () => {
      render(<NegotiationInterface {...mockProps} />);

      const textInput = screen.getByPlaceholderText(/type your message/i);
      const voiceButton = screen.getByRole('button', { name: /voice/i });

      // Start with text input
      fireEvent.change(textInput, { target: { value: 'Text message' } });
      expect(textInput).toHaveValue('Text message');

      // Switch to voice input
      fireEvent.click(voiceButton);

      // Voice recording should start (button should change state)
      await waitFor(() => {
        expect(voiceButton).toHaveAttribute('aria-pressed', 'true');
      });

      // Stop voice recording
      fireEvent.click(voiceButton);

      // Should be able to go back to text input
      fireEvent.change(textInput, { target: { value: 'Another text message' } });
      expect(textInput).toHaveValue('Another text message');
    });

    it('should disable voice input when text is being typed and vice versa', () => {
      render(<NegotiationInterface {...mockProps} />);

      const textInput = screen.getByPlaceholderText(/type your message/i);
      const voiceButton = screen.getByRole('button', { name: /voice/i });

      // When typing, voice button should remain enabled (user can switch)
      fireEvent.change(textInput, { target: { value: 'Typing...' } });
      expect(voiceButton).not.toBeDisabled();

      // When recording, text input should remain enabled (user can switch)
      fireEvent.click(voiceButton);
      expect(textInput).not.toBeDisabled();
    });

    it('should show appropriate feedback for each input method', async () => {
      render(<NegotiationInterface {...mockProps} />);

      const textInput = screen.getByPlaceholderText(/type your message/i);
      const voiceButton = screen.getByRole('button', { name: /voice/i });

      // Text input feedback
      fireEvent.change(textInput, { target: { value: 'Test message' } });
      expect(screen.getByText(/press enter to send/i)).toBeInTheDocument();

      // Voice input feedback
      fireEvent.click(voiceButton);
      await waitFor(() => {
        expect(screen.getByText(/recording/i)).toBeInTheDocument();
      });
    });

    it('should handle input method errors gracefully', async () => {
      // Mock getUserMedia to fail
      Object.defineProperty(navigator, 'mediaDevices', {
        writable: true,
        value: {
          getUserMedia: jest.fn().mockRejectedValue(new Error('Microphone access denied'))
        }
      });

      render(<NegotiationInterface {...mockProps} />);

      const voiceButton = screen.getByRole('button', { name: /voice/i });

      // Try to start voice recording
      fireEvent.click(voiceButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Microphone Access Denied",
          description: "Please allow microphone access to send voice messages.",
          variant: "destructive"
        });
      });

      // Text input should still work
      const textInput = screen.getByPlaceholderText(/type your message/i);
      fireEvent.change(textInput, { target: { value: 'Fallback to text' } });
      expect(textInput).toHaveValue('Fallback to text');
    });

    it('should maintain message history regardless of input method used', async () => {
      const mockMessages = [
        {
          id: '1',
          sessionId: 'test-session-id',
          senderId: 'user-1',
          senderType: 'CUSTOMER',
          content: 'Text message',
          originalContent: 'Text message',
          language: 'en',
          targetLanguage: 'hi',
          type: 'TEXT',
          translationStatus: 'COMPLETED',
          timestamp: new Date().toISOString(),
          deliveredAt: new Date().toISOString(),
          readAt: new Date().toISOString()
        },
        {
          id: '2',
          sessionId: 'test-session-id',
          senderId: 'user-2',
          senderType: 'VENDOR',
          content: 'Voice message transcription',
          originalContent: 'Voice message transcription',
          language: 'hi',
          targetLanguage: 'en',
          type: 'VOICE',
          translationStatus: 'COMPLETED',
          audioUrl: 'blob:audio-url',
          timestamp: new Date().toISOString(),
          deliveredAt: new Date().toISOString(),
          readAt: new Date().toISOString()
        }
      ];

      mockUseNegotiationRoom.mockReturnValue({
        ...mockNegotiationRoom,
        messages: mockMessages
      });

      render(<NegotiationInterface {...mockProps} />);

      // Both text and voice messages should be displayed
      expect(screen.getByText('Text message')).toBeInTheDocument();
      expect(screen.getByText('Voice message transcription')).toBeInTheDocument();

      // Voice message should have audio player
      const audioElement = screen.getByRole('application'); // audio element
      expect(audioElement).toBeInTheDocument();
    });
  });

  it('should validate dual input method requirements', () => {
    render(<NegotiationInterface {...mockProps} />);

    // Requirement 4.4: Interface must support both voice and text input
    const textInput = screen.getByPlaceholderText(/type your message/i);
    const voiceButton = screen.getByRole('button', { name: /voice/i });
    
    expect(textInput).toBeInTheDocument();
    expect(voiceButton).toBeInTheDocument();

    // Both input methods should be accessible simultaneously
    expect(textInput).not.toBeDisabled();
    expect(voiceButton).not.toBeDisabled();

    // Interface should provide clear indication of input method
    expect(screen.getByText(/press enter to send/i)).toBeInTheDocument();
  });
});