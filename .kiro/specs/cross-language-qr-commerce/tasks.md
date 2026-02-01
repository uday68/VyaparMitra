# Implementation Plan: Cross-Language QR Commerce

## Overview

This implementation plan breaks down the Cross-Language QR Commerce feature into discrete, incremental coding steps. Each task builds on previous work and focuses on core functionality with comprehensive testing. The plan leverages VyaparMitra's existing infrastructure including the voice processing pipeline, BHASHINI translation services, and GraphQL real-time subscriptions.

## Tasks

- [x] 1. Set up core data models and database schemas
  - Create TypeScript interfaces for QRSession, NegotiationRoom, Message, and TranslationCache models
  - Implement PostgreSQL migrations for transactional data (QR sessions, payments)
  - Implement MongoDB schemas for document data (messages, negotiation rooms)
  - Set up Redis schema for translation caching
  - _Requirements: 1.1, 1.2, 3.5, 6.1_

- [ ] 2. Implement QR Session Service
  - [x] 2.1 Create QR code generation and validation logic
    - Implement generateQRCode method with unique session token creation
    - Implement validateQRCode method with session data decoding
    - Add 24-hour expiration logic and session cleanup
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 2.5_

  - [ ]* 2.2 Write property test for QR code uniqueness and structure
    - **Property 1: QR Code Uniqueness and Structure**
    - **Validates: Requirements 1.1, 1.4**

  - [ ]* 2.3 Write property test for session creation consistency
    - **Property 2: Session Creation Consistency**
    - **Validates: Requirements 1.2, 1.3**

  - [x] 2.4 Implement session lifecycle management
    - Create negotiation room creation logic
    - Implement automatic session expiration and cleanup
    - Add session rejoin capability
    - _Requirements: 1.2, 1.5, 6.4, 9.4_

  - [ ]* 2.5 Write property test for session cleanup on expiration
    - **Property 3: Session Cleanup on Expiration**
    - **Validates: Requirements 1.5, 2.3**

- [ ] 3. Implement QR scanning and session joining
  - [x] 3.1 Create QR scanner integration and session validation
    - Implement QR code decoding and session information extraction
    - Add session validation with expiration checking
    - Create language selection interface with 12 supported languages
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [ ]* 3.2 Write property test for QR code validation and decoding
    - **Property 4: QR Code Validation and Decoding**
    - **Validates: Requirements 2.1, 2.5**

  - [ ]* 3.3 Write unit test for language selection interface
    - Test that exactly 12 language options are presented
    - **Validates: Requirements 2.2**

  - [x] 3.4 Implement real-time connection establishment
    - Create GraphQL subscription setup for negotiation rooms
    - Implement WebSocket connection management
    - Add connection recovery and state synchronization
    - _Requirements: 2.4, 5.4, 6.2_

  - [ ]* 3.5 Write property test for real-time connection establishment
    - **Property 6: Real-time Connection Establishment**
    - **Validates: Requirements 2.4**

- [ ] 4. Checkpoint - Ensure QR and session functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement Translation Service with fallback handling
  - [x] 5.1 Create translation engine with BHASHINI integration
    - Implement translateMessage method with BHASHINI API calls
    - Add context-aware translation with conversation history
    - Create translation result caching in Redis
    - _Requirements: 3.2, 7.1, 7.5, 10.4_

  - [ ]* 5.2 Write property test for text translation with fallback
    - **Property 8: Text Translation with Fallback**
    - **Validates: Requirements 3.2, 7.1, 7.2, 7.3**

  - [x] 5.3 Implement fallback translation services
    - Add secondary translation service integration (Google Translate, Azure)
    - Implement error handling with original message display
    - Add translation failure logging
    - _Requirements: 7.2, 7.3, 7.4_

  - [ ]* 5.4 Write property test for translation failure logging
    - **Property 26: Translation Failure Logging**
    - **Validates: Requirements 7.4**

  - [x] 5.5 Implement translation caching and performance optimization
    - Create translation cache lookup and storage
    - Add cache invalidation and cleanup logic
    - Implement performance monitoring for translation timing
    - _Requirements: 10.3, 10.4_

  - [ ]* 5.6 Write property test for translation caching
    - **Property 28: Translation Caching**
    - **Validates: Requirements 10.4**

- [ ] 6. Implement Voice Processing Service integration
  - [x] 6.1 Create voice-to-text processing
    - Integrate with existing VyaparMitra STT pipeline
    - Add language-specific voice processing
    - Implement audio quality validation
    - _Requirements: 3.1, 10.2_

  - [ ]* 6.2 Write property test for voice-to-text processing
    - **Property 7: Voice-to-Text Processing**
    - **Validates: Requirements 3.1**

  - [x] 6.3 Create text-to-speech processing
    - Integrate with existing VyaparMitra TTS pipeline
    - Add multilingual voice synthesis
    - Implement voice profile selection
    - _Requirements: 3.3_

  - [ ]* 6.4 Write property test for text-to-speech conversion
    - **Property 9: Text-to-Speech Conversion**
    - **Validates: Requirements 3.3**

  - [x] 6.5 Implement voice processing error handling and fallback
    - Add voice processing failure detection
    - Implement automatic fallback to text input
    - Create voice data cleanup after successful conversion
    - _Requirements: 4.3, 9.5_

  - [ ]* 6.6 Write property test for voice input feedback and fallback
    - **Property 13: Voice Input Feedback and Fallback**
    - **Validates: Requirements 4.2, 4.3**

- [ ] 7. Implement Negotiation Service for real-time communication
  - [x] 7.1 Create message sending and receiving logic
    - Implement sendMessage method with translation integration
    - Add message persistence with original and translated versions
    - Create message history retrieval
    - _Requirements: 3.5, 6.1_

  - [ ]* 7.2 Write property test for message history persistence
    - **Property 10: Message History Persistence**
    - **Validates: Requirements 3.5**

  - [x] 7.3 Implement real-time message delivery
    - Create GraphQL subscription resolvers for live messages
    - Add message delivery timing optimization
    - Implement typing indicators and status updates
    - _Requirements: 5.1, 5.2, 5.5_

  - [ ]* 7.4 Write property test for message delivery timing
    - **Property 15: Message Delivery Timing**
    - **Validates: Requirements 5.1, 5.2**

  - [ ] 7.5 Implement language switching and input method tracking
    - Add mid-session language change handling
    - Create input method indication (voice vs text)
    - Update translation targets when language changes
    - _Requirements: 3.6, 4.5_

  - [ ]* 7.6 Write property test for language switching updates
    - **Property 11: Language Switching Updates**
    - **Validates: Requirements 3.6**

- [ ] 8. Checkpoint - Ensure core communication functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement session persistence and recovery
  - [ ] 9.1 Create session state persistence
    - Implement immediate message and state persistence
    - Add session data retention policies (7-day retention)
    - Create session cleanup for abandoned sessions
    - _Requirements: 6.1, 6.3_

  - [ ]* 9.2 Write property test for immediate message persistence
    - **Property 18: Immediate Message Persistence**
    - **Validates: Requirements 6.1**

  - [ ] 9.3 Implement reconnection and recovery logic
    - Add participant reconnection handling
    - Implement complete message history restoration
    - Create network resilience with message queuing
    - _Requirements: 5.4, 6.2_

  - [ ]* 9.4 Write property test for session recovery on reconnection
    - **Property 19: Session Recovery on Reconnection**
    - **Validates: Requirements 6.2**

  - [ ]* 9.5 Write property test for network resilience
    - **Property 16: Network Resilience**
    - **Validates: Requirements 5.4**

- [ ] 10. Implement security and access control
  - [ ] 10.1 Create authentication and authorization
    - Implement participant authentication before session access
    - Add QR code access control and validation
    - Create session security with proper token validation
    - _Requirements: 9.2, 9.3_

  - [ ]* 10.2 Write property test for authentication before access
    - **Property 29: Authentication Before Access**
    - **Validates: Requirements 9.2**

  - [ ]* 10.3 Write property test for QR code access control
    - **Property 30: QR Code Access Control**
    - **Validates: Requirements 9.3**

  - [ ] 10.4 Implement data privacy and cleanup
    - Add automatic voice data deletion after text conversion
    - Implement session expiration after inactivity
    - Create secure message encryption handling
    - _Requirements: 9.4, 9.5_

  - [ ]* 10.5 Write property test for voice data cleanup
    - **Property 32: Voice Data Cleanup**
    - **Validates: Requirements 9.5**

- [ ] 11. Implement payment integration with language context
  - [ ] 11.1 Create payment transition with context preservation
    - Implement negotiation-to-payment workflow transition
    - Add language preference preservation during payment
    - Create session context maintenance throughout payment
    - _Requirements: 6.5, 8.1, 8.4_

  - [ ]* 11.2 Write property test for payment transition with context
    - **Property 22: Payment Transition with Context**
    - **Validates: Requirements 6.5, 8.1, 8.4**

  - [ ] 11.3 Create multilingual payment interface
    - Implement payment information display in customer's language
    - Add multilingual payment confirmations
    - Create payment failure recovery with context preservation
    - _Requirements: 8.2, 8.3, 8.5_

  - [ ]* 11.4 Write property test for multilingual payment confirmations
    - **Property 24: Multilingual Payment Confirmations**
    - **Validates: Requirements 8.3**

- [ ] 12. Implement frontend components
  - [x] 12.1 Create QR code generation and display components
    - Build vendor QR code generation interface
    - Add QR code display with expiration timer
    - Create QR code regeneration functionality
    - _Requirements: 1.1, 1.3_

  - [x] 12.2 Create QR scanner and session joining components
    - Build customer QR scanner interface
    - Add language selection component with 12 languages
    - Create session joining and connection status display
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 12.3 Create negotiation interface components
    - Build dual input method interface (voice + text)
    - Add real-time message display with translation
    - Create typing indicators and connection status
    - _Requirements: 4.1, 4.2, 5.5_

  - [x]* 12.4 Write unit test for dual input method support
    - **Property 12: Dual Input Method Support**
    - **Validates: Requirements 4.4**

- [ ] 13. Implement API endpoints and GraphQL resolvers
  - [x] 13.1 Create REST endpoints for QR and session management
    - Implement QR code generation endpoint
    - Add session validation and joining endpoints
    - Create session status and management endpoints
    - _Requirements: 1.1, 2.1, 2.5_

  - [x] 13.2 Create GraphQL subscriptions for real-time communication
    - Implement message subscription resolvers
    - Add typing indicator subscriptions
    - Create session status update subscriptions
    - _Requirements: 2.4, 5.5_

  - [x] 13.3 Add API validation and error handling
    - Implement Zod validation schemas for all inputs
    - Add comprehensive error handling and logging
    - Create rate limiting for translation and voice services
    - _Requirements: 7.4, 10.5_

- [ ] 14. Implement performance optimizations
  - [ ] 14.1 Add caching and performance monitoring
    - Implement Redis caching for translations and sessions
    - Add performance monitoring for voice and translation services
    - Create graceful degradation for service overloads
    - _Requirements: 10.3, 10.4, 10.5_

  - [ ]* 14.2 Write property test for voice processing performance
    - **Property 33: Voice Processing Performance**
    - **Validates: Requirements 10.2**

  - [ ]* 14.3 Write property test for translation performance
    - **Property 34: Translation Performance**
    - **Validates: Requirements 10.3**

  - [ ]* 14.4 Write property test for graceful service degradation
    - **Property 35: Graceful Service Degradation**
    - **Validates: Requirements 10.5**

- [ ] 15. Integration and end-to-end testing
  - [ ] 15.1 Create integration tests for complete workflows
    - Test QR generation → scanning → negotiation → payment flow
    - Add multilingual communication integration tests
    - Create voice and text input integration tests
    - _Requirements: All requirements integration_

  - [ ]* 15.2 Write integration tests for session lifecycle
    - Test complete session lifecycle from creation to completion
    - Add reconnection and recovery integration tests
    - _Requirements: 6.2, 6.4, 6.5_

- [ ] 16. Final checkpoint - Ensure all functionality works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with minimum 100 iterations
- Integration tests ensure complete workflow functionality
- The implementation leverages existing VyaparMitra infrastructure (voice pipeline, BHASHINI, GraphQL)
- All voice and translation services integrate with existing service layer patterns