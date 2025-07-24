/**
 * Mock type definitions for testing
 */

export interface MockMemory {
  id: string;
  memory: string;
  score?: number;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}

export interface MockAddResponse {
  id: string;
}

export interface MockDeleteResponse {
  message: string;
}

export interface MockUpdateResponse {
  // mem0ai update returns void/undefined
}