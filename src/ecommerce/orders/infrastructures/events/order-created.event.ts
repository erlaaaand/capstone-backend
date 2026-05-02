export class OrderCreatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly totalAmount: number,
    public readonly itemCount: number,
    public readonly createdAt: Date,
  ) {}
}