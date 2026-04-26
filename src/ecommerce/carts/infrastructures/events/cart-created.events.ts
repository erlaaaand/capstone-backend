export class CartCreatedEvent {
  constructor(
    public readonly cartId: string,
    public readonly userId: string,
    public readonly createdAt: Date,
  ) {}
}