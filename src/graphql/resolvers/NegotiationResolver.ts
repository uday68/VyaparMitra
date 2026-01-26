import { Resolver, Query, Mutation, Arg, ID, Float, Subscription, Root, PubSub, PubSubEngine } from 'type-graphql';
import { NegotiationService, NegotiationStatus } from '../../services/negotiation_service';

@Resolver()
export class NegotiationResolver {
  @Query(() => [Object])
  async negotiations(
    @Arg('userId', () => ID) userId: string,
    @Arg('userType') userType: 'vendor' | 'customer'
  ): Promise<any[]> {
    try {
      return await NegotiationService.getUserNegotiations(userId, userType);
    } catch (error) {
      console.error('Failed to fetch negotiations:', error);
      throw new Error('Failed to fetch negotiations');
    }
  }

  @Query(() => Object, { nullable: true })
  async negotiation(@Arg('id', () => ID) id: number): Promise<any> {
    try {
      return await NegotiationService.getNegotiationById(id);
    } catch (error) {
      console.error('Failed to fetch negotiation:', error);
      throw new Error('Negotiation not found');
    }
  }

  @Query(() => [Object])
  async negotiationBids(@Arg('negotiationId', () => ID) negotiationId: number): Promise<any[]> {
    try {
      return await NegotiationService.getNegotiationBids(negotiationId);
    } catch (error) {
      console.error('Failed to fetch negotiation bids:', error);
      throw new Error('Failed to fetch negotiation bids');
    }
  }

  @Mutation(() => Object)
  async createNegotiation(
    @Arg('vendorId', () => ID) vendorId: string,
    @Arg('customerId', () => ID) customerId: string,
    @Arg('productId', () => ID) productId: string,
    @PubSub() pubSub: PubSubEngine
  ): Promise<any> {
    try {
      const negotiation = await NegotiationService.createNegotiation(vendorId, customerId, productId);
      
      // Notify subscribers
      await pubSub.publish('NEGOTIATION_CREATED', {
        negotiationCreated: negotiation,
        vendorId,
        customerId,
      });

      return negotiation;
    } catch (error) {
      console.error('Failed to create negotiation:', error);
      throw new Error('Failed to create negotiation');
    }
  }

  @Mutation(() => Object)
  async createBid(
    @Arg('negotiationId', () => ID) negotiationId: number,
    @Arg('bidderType') bidderType: 'vendor' | 'customer',
    @Arg('bidderId', () => ID) bidderId: string,
    @Arg('amount', () => Float) amount: number,
    @Arg('message', { nullable: true }) message: string,
    @Arg('language') language: string,
    @Arg('targetLanguage', { nullable: true }) targetLanguage: string,
    @PubSub() pubSub: PubSubEngine
  ): Promise<any> {
    try {
      const result = await NegotiationService.createBid({
        negotiationId,
        bidderType,
        bidderId,
        amount,
        message,
        language,
        targetLanguage,
      });

      // Notify subscribers
      await pubSub.publish('BID_CREATED', {
        bidCreated: result.bid,
        negotiationId,
        spokenResponseUrl: result.spokenResponseUrl,
        translatedMessage: result.translatedMessage,
      });

      return result;
    } catch (error) {
      console.error('Failed to create bid:', error);
      throw new Error('Failed to create bid');
    }
  }

  @Mutation(() => Object)
  async acceptBid(
    @Arg('negotiationId', () => ID) negotiationId: number,
    @Arg('accepterId', () => ID) accepterId: string,
    @Arg('accepterType') accepterType: 'vendor' | 'customer',
    @Arg('language') language: string,
    @PubSub() pubSub: PubSubEngine
  ): Promise<any> {
    try {
      const result = await NegotiationService.acceptBid(negotiationId, accepterId, accepterType, language);

      if (result.success) {
        // Notify subscribers
        await pubSub.publish('BID_ACCEPTED', {
          bidAccepted: {
            negotiationId,
            accepterId,
            message: result.message,
            spokenResponseUrl: result.spokenResponseUrl,
          },
        });
      }

      return result;
    } catch (error) {
      console.error('Failed to accept bid:', error);
      throw new Error('Failed to accept bid');
    }
  }

  @Mutation(() => Object)
  async rejectBid(
    @Arg('negotiationId', () => ID) negotiationId: number,
    @Arg('rejecterId', () => ID) rejecterId: string,
    @Arg('rejectorType') rejectorType: 'vendor' | 'customer',
    @Arg('language') language: string,
    @Arg('reason', { nullable: true }) reason: string,
    @PubSub() pubSub: PubSubEngine
  ): Promise<any> {
    try {
      const result = await NegotiationService.rejectBid(negotiationId, rejecterId, rejectorType, language, reason);

      if (result.success) {
        // Notify subscribers
        await pubSub.publish('BID_REJECTED', {
          bidRejected: {
            negotiationId,
            rejecterId,
            message: result.message,
            spokenResponseUrl: result.spokenResponseUrl,
            reason,
          },
        });
      }

      return result;
    } catch (error) {
      console.error('Failed to reject bid:', error);
      throw new Error('Failed to reject bid');
    }
  }

  // Subscriptions for real-time updates
  @Subscription(() => Object, {
    topics: 'NEGOTIATION_CREATED',
    filter: ({ payload, args }) => {
      return payload.vendorId === args.userId || payload.customerId === args.userId;
    },
  })
  negotiationCreated(
    @Arg('userId', () => ID) userId: string,
    @Root() payload: any
  ): any {
    return payload.negotiationCreated;
  }

  @Subscription(() => Object, {
    topics: 'BID_CREATED',
    filter: ({ payload, args }) => {
      return payload.negotiationId === args.negotiationId;
    },
  })
  bidCreated(
    @Arg('negotiationId', () => ID) negotiationId: number,
    @Root() payload: any
  ): any {
    return payload;
  }

  @Subscription(() => Object, {
    topics: 'BID_ACCEPTED',
    filter: ({ payload, args }) => {
      return payload.bidAccepted.negotiationId === args.negotiationId;
    },
  })
  bidAccepted(
    @Arg('negotiationId', () => ID) negotiationId: number,
    @Root() payload: any
  ): any {
    return payload.bidAccepted;
  }

  @Subscription(() => Object, {
    topics: 'BID_REJECTED',
    filter: ({ payload, args }) => {
      return payload.bidRejected.negotiationId === args.negotiationId;
    },
  })
  bidRejected(
    @Arg('negotiationId', () => ID) negotiationId: number,
    @Root() payload: any
  ): any {
    return payload.bidRejected;
  }
}