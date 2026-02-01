-- Migration: Voice Workflow Sessions Table
-- Description: Create table for voice workflow session audit and analytics

CREATE TABLE IF NOT EXISTS voice_workflow_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL,
  language VARCHAR(5) NOT NULL,
  initial_state VARCHAR(50) NOT NULL,
  final_state VARCHAR(50),
  workflow_data JSONB DEFAULT '{}',
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_seconds INTEGER
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_voice_workflow_user_id ON voice_workflow_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_workflow_session_id ON voice_workflow_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_voice_workflow_created_at ON voice_workflow_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_voice_workflow_completed ON voice_workflow_sessions(completed);
CREATE INDEX IF NOT EXISTS idx_voice_workflow_language ON voice_workflow_sessions(language);

-- Add foreign key constraint if users table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE voice_workflow_sessions 
    ADD CONSTRAINT fk_voice_workflow_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_voice_workflow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_voice_workflow_updated_at
  BEFORE UPDATE ON voice_workflow_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_voice_workflow_updated_at();