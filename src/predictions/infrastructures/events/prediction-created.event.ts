// src/predictions/infrastructures/events/prediction-created.event.ts
export class PredictionCreatedEvent {
  constructor(
    public readonly predictionId: string,
    public readonly userId: string,
    public readonly imageUrl: string,
    public readonly occurredAt: Date,
  ) {}
}
