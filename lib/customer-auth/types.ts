export type CustomerSession = {
  sessionId: string;
  customerId: string;
  email: string;
  displayName: string | null;
  expiresAt: Date;
};

export class CustomerAuthError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}
