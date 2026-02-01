# Implementation Plan: Voice-First Product Addition

## Overview

This implementation plan converts the voice-first product addition design into discrete coding tasks. The approach builds incrementally on VyaparMitra's existing voice processing infrastructure, extending the AddProduct page with voice-first capabilities while maintaining backward compatibility with manual input.

## Tasks

- [x] 1. Set up voice workflow infrastructure
  - [x] 1.1 Create voice workflow state management service
    - Implement `VoiceWorkflowService` in `src/services/voice_workflow_service.ts`
    - Add Redis schemas for session storage with 5-minute TTL
    - Create PostgreSQL migration for workflow audit table
    - _Requirements: 5.1, 5.3, 5.5_
  
  - [x] 1.2 Write property test for workflow state management
    - **Property 8: Session State Persistence**
    - **Validates: Requirements 5.3, 5.4**
  
  - [x] 1.3 Create voice prompt generator service
    - Implement `VoicePromptGenerator` in `src/services/voice_prompt_generator.ts`
    - Add multilingual prompt templates for all 12 languages
    - Include currency context for Indian commerce
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 1.4 Write property test for multilingual prompts
    - **Property 7: Currency Context Preservation**
    - **Validates: Requirements 4.3**

- [x] 2. Extend voice intent system for product addition workflow
  - [x] 2.1 Add workflow states to voice intent service
    - Extend `VoiceIntentService` with `VoiceWorkflowState` enum
    - Add workflow session management methods
    - Implement state transition logic for product addition
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [x] 2.2 Write property test for intent recognition
    - **Property 1: Multilingual Intent Recognition**
    - **Validates: Requirements 1.1**
  
  - [x] 2.3 Write property test for language consistency
    - **Property 2: Workflow State Consistency**
    - **Validates: Requirements 1.4, 4.1, 4.5**
  
  - [x] 2.4 Add voice workflow route handlers
    - Extend `src/routes/voice.ts` with workflow endpoints
    - Add session creation, state update, and completion endpoints
    - Implement error handling with retry logic
    - _Requirements: 1.5, 7.1_
  
  - [x] 2.5 Write property test for retry logic
    - **Property 4: Retry Logic Consistency**
    - **Validates: Requirements 1.5, 2.3, 7.1**

- [ ] 3. Checkpoint - Ensure voice workflow infrastructure tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement camera integration module
  - [ ] 4.1 Create camera capture component
    - Implement `VoiceCameraCapture` component in `client/src/components/VoiceCameraCapture.tsx`
    - Add automatic photo capture with 2-second timing
    - Implement photo confirmation UI with retake option
    - _Requirements: 2.1, 2.2, 2.5_
  
  - [ ] 4.2 Write property test for camera timing
    - **Property 3: Camera Automation Timing**
    - **Validates: Requirements 2.1**
  
  - [ ] 4.3 Add camera error handling and fallback
    - Implement retry logic for failed captures (max 2 retries)
    - Add manual photo upload fallback
    - Handle camera permission and hardware issues
    - _Requirements: 2.3, 7.4_
  
  - [ ] 4.4 Write unit tests for camera error scenarios
    - Test permission denied handling
    - Test hardware unavailable scenarios
    - Test capture failure recovery
    - _Requirements: 2.3, 7.4_

- [ ] 5. Enhance AddProduct page with voice-first capabilities
  - [ ] 5.1 Add voice workflow state management to AddProduct page
    - Extend `client/src/pages/AddProduct.tsx` with voice workflow state
    - Add mode switching between manual and voice-first
    - Implement voice status indicators and UI feedback
    - _Requirements: 6.3_
  
  - [ ] 5.2 Integrate camera capture into AddProduct workflow
    - Connect camera component to voice workflow triggers
    - Add photo confirmation step in voice workflow
    - Maintain existing manual photo upload functionality
    - _Requirements: 2.4, 6.3_
  
  - [ ] 5.3 Write property test for workflow progression
    - **Property 5: Workflow State Progression**
    - **Validates: Requirements 2.4, 3.1, 3.3, 5.2**
  
  - [ ] 5.4 Add voice-guided data collection UI
    - Implement quantity and price input via voice
    - Add voice confirmation dialogs for collected data
    - Display voice prompts with waveform animations
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ] 5.5 Write property test for voice data conversion
    - **Property 6: Voice Data Conversion Accuracy**
    - **Validates: Requirements 3.2, 3.4**

- [ ] 6. Implement voice service integration and error handling
  - [ ] 6.1 Add STT service integration for data collection
    - Extend STT service to handle numeric value extraction
    - Add quantity and price parsing with validation
    - Implement confirmation workflow for extracted values
    - _Requirements: 3.2, 3.4_
  
  - [ ] 6.2 Add TTS service integration for voice prompts
    - Integrate TTS service with voice prompt generator
    - Add multilingual prompt generation and playback
    - Implement prompt queuing and timing management
    - _Requirements: 3.1, 3.3, 4.1_
  
  - [ ] 6.3 Implement comprehensive error handling
    - Add graceful degradation for voice service failures
    - Implement fallback to text prompts when TTS fails
    - Add translation service fallback mechanisms
    - _Requirements: 7.2, 7.3, 7.5_
  
  - [ ] 6.4 Write property test for service degradation
    - **Property 10: Graceful Service Degradation**
    - **Validates: Requirements 7.2, 7.3, 7.4, 7.5**

- [ ] 7. Checkpoint - Ensure voice-first workflow integration tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement backend service integration
  - [ ] 8.1 Ensure voice workflow uses existing product creation APIs
    - Verify voice workflow calls same backend endpoints as manual workflow
    - Add voice-specific metadata to product creation requests
    - Maintain database schema compatibility
    - _Requirements: 6.1, 6.2_
  
  - [ ] 8.2 Write property test for backend consistency
    - **Property 9: Backend Service Consistency**
    - **Validates: Requirements 6.1, 6.2, 6.5**
  
  - [ ] 8.3 Add audit logging for voice workflows
    - Extend audit logging to capture voice workflow events
    - Add session tracking and completion metrics
    - Implement voice-specific analytics data collection
    - _Requirements: 6.5_
  
  - [ ] 8.4 Write unit tests for audit logging
    - Test voice workflow event logging
    - Test session completion tracking
    - Test analytics data collection
    - _Requirements: 6.5_

- [ ] 9. Implement performance optimizations and monitoring
  - [ ] 9.1 Add performance monitoring for voice workflows
    - Implement timing measurements for all workflow steps
    - Add performance metrics collection and logging
    - Create performance dashboards for voice workflow analytics
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [ ] 9.2 Write property test for performance requirements
    - **Property 11: Performance Response Times**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**
  
  - [ ] 9.3 Add caching and optimization for voice services
    - Implement TTS response caching in Redis
    - Add translation result caching for common phrases
    - Optimize voice workflow session storage
    - _Requirements: 8.5_
  
  - [ ] 9.4 Write property test for end-to-end performance
    - **Property 12: End-to-End Workflow Completion**
    - **Validates: Requirements 8.5**

- [ ] 10. Integration testing and final validation
  - [ ] 10.1 Create comprehensive integration tests
    - Test complete voice workflow from intent to product creation
    - Test cross-language workflow functionality
    - Test service failure recovery scenarios
    - _Requirements: All requirements_
  
  - [ ] 10.2 Write integration tests for workflow completion
    - Test successful product creation via voice workflow
    - Test workflow interruption and recovery
    - Test fallback to manual mode scenarios
    - _Requirements: 3.5, 5.4, 5.5_
  
  - [ ] 10.3 Add performance and load testing
    - Test concurrent voice workflow sessions
    - Validate response time requirements under load
    - Test voice service scalability
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 11. Final checkpoint - Ensure all tests pass and feature is complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests ensure end-to-end functionality
- The implementation builds incrementally on existing VyaparMitra infrastructure
- Voice workflow maintains full compatibility with existing manual product addition
- All voice services include comprehensive error handling and fallback mechanisms