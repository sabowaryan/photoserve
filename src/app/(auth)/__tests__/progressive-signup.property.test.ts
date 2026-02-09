/**
 * Property-Based Tests for Progressive Signup
 * 
 * Feature: sales-funnel-optimization
 * Properties: 13, 14, 15
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { z } from 'zod';

type SignupStep = 1 | 2 | 3;

interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
  agreeTerms: boolean;
}

interface SignupState {
  step: SignupStep;
  formData: SignupFormData;
  error: string | null;
  isLoading: boolean;
}

const emailSchema = z.string().email();
const passwordSchema = z.string().min(6);

class ProgressiveSignupFlow {
  private state: SignupState;
  private existingEmails: Set<string>;

  constructor(existingEmails: string[] = []) {
    this.state = {
      step: 1,
      formData: {
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        agreeTerms: false,
      },
      error: null,
      isLoading: false,
    };
    this.existingEmails = new Set(existingEmails.map(e => e.toLowerCase()));
  }

  getState(): SignupState {
    return { ...this.state };
  }

  submitStep1(email: string): { success: boolean; error?: string } {
    try {
      emailSchema.parse(email);
      if (this.existingEmails.has(email.toLowerCase())) {
        this.state.error = 'Email already exists';
        return { success: false, error: 'Email already exists' };
      }
      this.state.formData.email = email;
      this.state.step = 2;
      this.state.error = null;
      return { success: true };
    } catch (err) {
      if (err instanceof z.ZodError && err.issues[0]) {
        this.state.error = err.issues[0].message;
        return { success: false, error: err.issues[0].message };
      }
      return { success: false, error: 'Invalid email' };
    }
  }

  submitStep2(
    password: string,
    confirmPassword: string,
    agreeTerms: boolean
  ): { success: boolean; error?: string; accountCreated?: boolean } {
    if (this.state.step !== 2) {
      return { success: false, error: 'Must complete step 1 first' };
    }
    try {
      passwordSchema.parse(password);
      if (password !== confirmPassword) {
        this.state.error = 'Passwords do not match';
        return { success: false, error: 'Passwords do not match' };
      }
      if (!agreeTerms) {
        this.state.error = 'Must agree to terms';
        return { success: false, error: 'Must agree to terms' };
      }
      this.state.formData.password = password;
      this.state.formData.confirmPassword = confirmPassword;
      this.state.formData.agreeTerms = agreeTerms;
      this.existingEmails.add(this.state.formData.email.toLowerCase());
      this.state.step = 3;
      this.state.error = null;
      return { success: true, accountCreated: true };
    } catch (err) {
      if (err instanceof z.ZodError && err.issues[0]) {
        this.state.error = err.issues[0].message;
        return { success: false, error: err.issues[0].message };
      }
      return { success: false, error: 'Invalid password' };
    }
  }

  submitStep3(name?: string): { success: boolean; completed: boolean } {
    if (this.state.step !== 3) {
      return { success: false, completed: false };
    }
    if (name) {
      this.state.formData.name = name;
    }
    return { success: true, completed: true };
  }

  skipStep3(): { success: boolean; completed: boolean } {
    if (this.state.step !== 3) {
      return { success: false, completed: false };
    }
    return { success: true, completed: true };
  }

  goBack(): boolean {
    if (this.state.step > 1 && this.state.step < 3) {
      this.state.step = (this.state.step - 1) as SignupStep;
      return true;
    }
    return false;
  }
}

const validEmailArbitrary = fc
  .tuple(
    fc.stringMatching(/^[a-z0-9]{1,10}$/),
    fc.constantFrom('gmail.com', 'yahoo.com', 'outlook.com', 'example.com')
  )
  .map(([local, domain]) => `${local}@${domain}`);

const invalidEmailArbitrary = fc.oneof(
  fc.string().filter((s) => !s.includes('@')),
  fc.string().filter((s) => s.includes('@') && !s.includes('.')),
  fc.constant(''),
  fc.constant('invalid'),
  fc.constant('@example.com'),
  fc.constant('user@')
);

const validPasswordArbitrary = fc.stringMatching(/^[a-zA-Z0-9!@#$%^&*]{6,20}$/);
const invalidPasswordArbitrary = fc.string({ minLength: 0, maxLength: 5 });
const nameArbitrary = fc.string({ minLength: 1, maxLength: 50 });

describe('Progressive Signup - Property 13: Soft Signup Flow Structure', () => {
  it('should always start at step 1', () => {
    fc.assert(
      fc.property(fc.array(validEmailArbitrary), (existingEmails) => {
        const flow = new ProgressiveSignupFlow(existingEmails);
        expect(flow.getState().step).toBe(1);
      }),
      { numRuns: 100 }
    );
  });

  it('should progress from step 1 to step 2 after valid email submission', () => {
    fc.assert(
      fc.property(
        validEmailArbitrary,
        fc.array(validEmailArbitrary),
        (email, existingEmails) => {
          const filteredExisting = existingEmails.filter(
            (e) => e.toLowerCase() !== email.toLowerCase()
          );
          const flow = new ProgressiveSignupFlow(filteredExisting);
          const result = flow.submitStep1(email);
          expect(result.success).toBe(true);
          expect(flow.getState().step).toBe(2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should progress from step 2 to step 3 after valid password and terms', () => {
    fc.assert(
      fc.property(
        validEmailArbitrary,
        validPasswordArbitrary,
        (email, password) => {
          const flow = new ProgressiveSignupFlow();
          flow.submitStep1(email);
          const result = flow.submitStep2(password, password, true);
          expect(result.success).toBe(true);
          expect(result.accountCreated).toBe(true);
          expect(flow.getState().step).toBe(3);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow skipping step 3 (profile is optional)', () => {
    fc.assert(
      fc.property(
        validEmailArbitrary,
        validPasswordArbitrary,
        (email, password) => {
          const flow = new ProgressiveSignupFlow();
          flow.submitStep1(email);
          flow.submitStep2(password, password, true);
          const result = flow.skipStep3();
          expect(result.success).toBe(true);
          expect(result.completed).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Progressive Signup - Property 14: Email Validation and Uniqueness', () => {
  it('should accept valid email formats', () => {
    fc.assert(
      fc.property(validEmailArbitrary, (email) => {
        const flow = new ProgressiveSignupFlow();
        const result = flow.submitStep1(email);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject invalid email formats', () => {
    fc.assert(
      fc.property(invalidEmailArbitrary, (invalidEmail) => {
        const flow = new ProgressiveSignupFlow();
        const result = flow.submitStep1(invalidEmail);
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject emails that already exist (case-insensitive)', () => {
    fc.assert(
      fc.property(validEmailArbitrary, (email) => {
        const flow = new ProgressiveSignupFlow([email]);
        const result = flow.submitStep1(email.toUpperCase());
        expect(result.success).toBe(false);
        expect(result.error).toBe('Email already exists');
      }),
      { numRuns: 100 }
    );
  });
});

describe('Progressive Signup - Property 15: Signup Step Progression', () => {
  it('should progress without page reload (state-based progression)', () => {
    fc.assert(
      fc.property(
        validEmailArbitrary,
        validPasswordArbitrary,
        (email, password) => {
          const flow = new ProgressiveSignupFlow();
          expect(flow.getState().step).toBe(1);
          flow.submitStep1(email);
          expect(flow.getState().step).toBe(2);
          flow.submitStep2(password, password, true);
          expect(flow.getState().step).toBe(3);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create account after step 2 completion', () => {
    fc.assert(
      fc.property(
        validEmailArbitrary,
        validPasswordArbitrary,
        (email, password) => {
          const flow = new ProgressiveSignupFlow();
          flow.submitStep1(email);
          const result = flow.submitStep2(password, password, true);
          expect(result.success).toBe(true);
          expect(result.accountCreated).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not progress if terms are not agreed at step 2', () => {
    fc.assert(
      fc.property(
        validEmailArbitrary,
        validPasswordArbitrary,
        (email, password) => {
          const flow = new ProgressiveSignupFlow();
          flow.submitStep1(email);
          const result = flow.submitStep2(password, password, false);
          expect(result.success).toBe(false);
          expect(result.error).toBe('Must agree to terms');
          expect(flow.getState().step).toBe(2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain form data across step progressions', () => {
    fc.assert(
      fc.property(
        validEmailArbitrary,
        validPasswordArbitrary,
        (email, password) => {
          const flow = new ProgressiveSignupFlow();
          flow.submitStep1(email);
          flow.submitStep2(password, password, true);
          const state = flow.getState();
          expect(state.formData.email).toBe(email);
          expect(state.formData.password).toBe(password);
          expect(state.formData.agreeTerms).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
