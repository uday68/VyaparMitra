import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fc from 'fast-check';
import { VoiceWorkflowService, VoiceWorkflowState } from '../services/voice_workflow_service';
import { redis } from '../db/redis';
import { pool } from '../db/postgres';

describe('VoiceWorkflowService Property Tests', () => {
  beforeEach(async () => {
    // Clean up any existing test data
    const keys = await redis.keys('voice_workflow:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    
    // Clean up PostgreSQL test data
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM voice_workflow_sessions WHERE session_id LIKE $1', ['test-%']);
    } finally {
      client.release();
    }
  });

  afterEach(async () => {
    // Clean up after each test
    const keys = await redis.keys('voice_workflow:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM voice_workflow_sessions WHERE session_id LIKE $1', ['test-%']);
    } finally {
      client.release();
    }
  });

  /**
   * Property 8: Session State Persistence
   * For any interrupted voice workflow session, the system should preserve all collected data 
   * (photo, quantity, price) for exactly 5 minutes and provide a summary when resumed
   * Validates: Requirements 5.3, 5.4
   */
  it('Property 8: Session State Persistence', async () => {
    await fc.assert(fc.asyncProperty(
      fc.string({ minLength: 1, maxLength: 50 }).map(s => `test-user-${s}`), // userId
      fc.constantFrom('en', 'hi', 'bn', 'mr', 'kn', 'ml', 'gu', 'pa', 'ta', 'te', 'or', 'as'), // language
      fc.constantFrom(...Object.values(VoiceWorkflowState)), // initial state
      fc.record({
        photo: fc.option(fc.string({ minLength: 10, maxLength: 100 })),
        quantity: fc.option(fc.integer({ min: 1, max: 1000 })),
        price: fc.option(fc.float({ min: 0.01, max: 10000, noNaN: true })),
        productName: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
        unit: fc.option(fc.constantFrom('kg', 'pcs', 'ltr', 'box')),
        category: fc.option(fc.constantFrom('fruits', 'vegetables', 'dairy', 'grains'))
      }), // workflow data
      async (userId, language, initialState, workflowData) => {
        // Create a workflow session
        const session = await VoiceWorkflowService.createWorkflowSession(userId, language);
        expect(session).toBeDefined();
        expect(session.userId).toBe(userId);
        expect(session.language).toBe(language);
        expect(session.state).toBe(VoiceWorkflowState.PHOTO_CAPTURE); // Always starts with photo capture

        // Update the session with test data
        const updatedSession = await VoiceWorkflowService.updateWorkflowState(
          session.sessionId,
          initialState,
          workflowData
        );

        // Verify data persistence
        expect(updatedSession.state).toBe(initialState);
        expect(updatedSession.data).toMatchObject(workflowData);

        // Simulate interruption - retrieve session after update
        const retrievedSession = await VoiceWorkflowService.getWorkflowSession(session.sessionId);
        expect(retrievedSession).not.toBeNull();
        
        if (retrievedSession) {
          // Verify all data is preserved
          expect(retrievedSession.sessionId).toBe(session.sessionId);
          expect(retrievedSession.userId).toBe(userId);
          expect(retrievedSession.language).toBe(language);
          expect(retrievedSession.state).toBe(initialState);
          expect(retrievedSession.data).toMatchObject(workflowData);

          // Verify session expires in approximately 5 minutes (allowing for test execution time)
          const now = new Date();
          const timeDiff = retrievedSession.expiresAt.getTime() - now.getTime();
          expect(timeDiff).toBeGreaterThan(4 * 60 * 1000); // At least 4 minutes
          expect(timeDiff).toBeLessThan(6 * 60 * 1000); // At most 6 minutes
        }

        // Clean up
        await VoiceWorkflowService.completeWorkflow(session.sessionId);
      }
    ), { numRuns: 50 });
  });

  it('should maintain workflow state consistency across updates', async () => {
    await fc.assert(fc.asyncProperty(
      fc.string({ minLength: 1, maxLength: 50 }).map(s => `test-user-${s}`),
      fc.constantFrom('en', 'hi', 'bn', 'mr'),
      fc.array(fc.constantFrom(...Object.values(VoiceWorkflowState)), { minLength: 2, maxLength: 5 }),
      async (userId, language, stateSequence) => {
        const session = await VoiceWorkflowService.createWorkflowSession(userId, language);
        let currentSession = session;

        // Apply state sequence
        for (const state of stateSequence) {
          currentSession = await VoiceWorkflowService.updateWorkflowState(
            session.sessionId,
            state,
            { updatedAt: new Date().toISOString() }
          );

          // Verify state is correctly updated
          expect(currentSession.state).toBe(state);
          expect(currentSession.sessionId).toBe(session.sessionId);
          expect(currentSession.userId).toBe(userId);
          expect(currentSession.language).toBe(language);
        }

        // Verify final state persistence
        const finalSession = await VoiceWorkflowService.getWorkflowSession(session.sessionId);
        expect(finalSession?.state).toBe(stateSequence[stateSequence.length - 1]);

        await VoiceWorkflowService.completeWorkflow(session.sessionId);
      }
    ), { numRuns: 30 });
  });

  it('should handle concurrent session operations correctly', async () => {
    await fc.assert(fc.asyncProperty(
      fc.string({ minLength: 1, maxLength: 50 }).map(s => `test-user-${s}`),
      fc.constantFrom('en', 'hi', 'bn'),
      fc.array(fc.record({
        state: fc.constantFrom(...Object.values(VoiceWorkflowState)),
        data: fc.record({
          quantity: fc.option(fc.integer({ min: 1, max: 100 })),
          price: fc.option(fc.float({ min: 1, max: 1000, noNaN: true }))
        })
      }), { minLength: 2, maxLength: 5 }),
      async (userId, language, operations) => {
        const session = await VoiceWorkflowService.createWorkflowSession(userId, language);

        // Execute operations concurrently
        const promises = operations.map((op, index) => 
          VoiceWorkflowService.updateWorkflowState(
            session.sessionId,
            op.state,
            { ...op.data, operationIndex: index }
          )
        );

        const results = await Promise.all(promises);

        // Verify all operations completed successfully
        expect(results).toHaveLength(operations.length);
        results.forEach(result => {
          expect(result.sessionId).toBe(session.sessionId);
          expect(result.userId).toBe(userId);
          expect(result.language).toBe(language);
        });

        // Verify final state is one of the applied states
        const finalSession = await VoiceWorkflowService.getWorkflowSession(session.sessionId);
        expect(finalSession).not.toBeNull();
        
        if (finalSession) {
          const appliedStates = operations.map(op => op.state);
          expect(appliedStates).toContain(finalSession.state);
        }

        await VoiceWorkflowService.completeWorkflow(session.sessionId);
      }
    ), { numRuns: 20 });
  });

  it('should properly clean up expired sessions', async () => {
    const userId = 'test-cleanup-user';
    const language = 'en';

    // Create multiple sessions
    const sessions = await Promise.all([
      VoiceWorkflowService.createWorkflowSession(userId, language),
      VoiceWorkflowService.createWorkflowSession(userId, language),
      VoiceWorkflowService.createWorkflowSession(userId, language)
    ]);

    // Verify sessions exist
    for (const session of sessions) {
      const retrieved = await VoiceWorkflowService.getWorkflowSession(session.sessionId);
      expect(retrieved).not.toBeNull();
    }

    // Manually expire sessions in Redis (simulate time passage)
    for (const session of sessions) {
      const redisKey = `voice_workflow:${session.sessionId}`;
      await redis.expire(redisKey, 1); // Set to expire in 1 second
    }

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Run cleanup
    const cleanedCount = await VoiceWorkflowService.cleanupExpiredSessions();
    expect(cleanedCount).toBeGreaterThanOrEqual(0);

    // Verify sessions are no longer accessible
    for (const session of sessions) {
      const retrieved = await VoiceWorkflowService.getWorkflowSession(session.sessionId);
      expect(retrieved).toBeNull();
    }
  });

  it('should handle service health checks correctly', async () => {
    const isHealthy = await VoiceWorkflowService.isHealthy();
    expect(typeof isHealthy).toBe('boolean');
    
    // Service should be healthy in test environment
    expect(isHealthy).toBe(true);
  });
});

describe('VoiceWorkflowService Unit Tests', () => {
  beforeEach(async () => {
    // Clean up test data
    const keys = await redis.keys('voice_workflow:test-*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  });

  it('should create workflow session with correct initial state', async () => {
    const userId = 'test-user-123';
    const language = 'hi';

    const session = await VoiceWorkflowService.createWorkflowSession(userId, language);

    expect(session.sessionId).toBeDefined();
    expect(session.userId).toBe(userId);
    expect(session.language).toBe(language);
    expect(session.state).toBe(VoiceWorkflowState.PHOTO_CAPTURE);
    expect(session.data).toEqual({});
    expect(session.createdAt).toBeInstanceOf(Date);
    expect(session.expiresAt).toBeInstanceOf(Date);

    // Verify session is stored in Redis
    const retrieved = await VoiceWorkflowService.getWorkflowSession(session.sessionId);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.sessionId).toBe(session.sessionId);

    await VoiceWorkflowService.completeWorkflow(session.sessionId);
  });

  it('should update workflow state and data correctly', async () => {
    const userId = 'test-user-456';
    const language = 'en';
    const session = await VoiceWorkflowService.createWorkflowSession(userId, language);

    const newData = {
      photo: 'base64-photo-data',
      quantity: 50,
      price: 25.99,
      productName: 'Test Product'
    };

    const updatedSession = await VoiceWorkflowService.updateWorkflowState(
      session.sessionId,
      VoiceWorkflowState.QUANTITY_INPUT,
      newData
    );

    expect(updatedSession.state).toBe(VoiceWorkflowState.QUANTITY_INPUT);
    expect(updatedSession.data).toMatchObject(newData);
    expect(updatedSession.sessionId).toBe(session.sessionId);

    await VoiceWorkflowService.completeWorkflow(session.sessionId);
  });

  it('should throw error when updating non-existent session', async () => {
    const nonExistentSessionId = 'non-existent-session-id';

    await expect(
      VoiceWorkflowService.updateWorkflowState(
        nonExistentSessionId,
        VoiceWorkflowState.COMPLETION
      )
    ).rejects.toThrow(`Voice workflow session not found: ${nonExistentSessionId}`);
  });

  it('should complete workflow and clean up session', async () => {
    const userId = 'test-user-789';
    const language = 'bn';
    const session = await VoiceWorkflowService.createWorkflowSession(userId, language);

    // Verify session exists
    let retrieved = await VoiceWorkflowService.getWorkflowSession(session.sessionId);
    expect(retrieved).not.toBeNull();

    // Complete workflow
    const completed = await VoiceWorkflowService.completeWorkflow(session.sessionId);
    expect(completed).toBe(true);

    // Verify session is removed from Redis
    retrieved = await VoiceWorkflowService.getWorkflowSession(session.sessionId);
    expect(retrieved).toBeNull();
  });

  it('should return false when completing non-existent workflow', async () => {
    const nonExistentSessionId = 'non-existent-session-id';
    const completed = await VoiceWorkflowService.completeWorkflow(nonExistentSessionId);
    expect(completed).toBe(false);
  });

  it('should get user active sessions correctly', async () => {
    const userId = 'test-user-multi';
    const language = 'mr';

    // Create multiple sessions for the same user
    const sessions = await Promise.all([
      VoiceWorkflowService.createWorkflowSession(userId, language),
      VoiceWorkflowService.createWorkflowSession(userId, language),
      VoiceWorkflowService.createWorkflowSession(userId, language)
    ]);

    const activeSessions = await VoiceWorkflowService.getUserActiveSessions(userId);
    expect(activeSessions).toHaveLength(3);

    // Verify all sessions belong to the user
    activeSessions.forEach(session => {
      expect(session.userId).toBe(userId);
      expect(session.language).toBe(language);
    });

    // Clean up
    await Promise.all(sessions.map(s => VoiceWorkflowService.completeWorkflow(s.sessionId)));
  });
});