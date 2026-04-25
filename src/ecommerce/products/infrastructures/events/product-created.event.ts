export class ProductCreatedEvent {
  constructor(
    public readonly productId: string,
    public readonly productName: string,
    public readonly variety: string,
    public readonly createdById: string,
    public readonly createdAt: Date,
  ) {}
}