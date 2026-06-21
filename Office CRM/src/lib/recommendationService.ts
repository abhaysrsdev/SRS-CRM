import { dbGetAll, dbGet, dbPutMany, dbGetByIndex } from './db';
import type { Customer, Product, Tag, Recommendation } from '../types';

export class RecommendationService {
  /**
   * Fetch all tags from DB and return as a Map for quick lookup
   */
  static async getTagsMap(): Promise<Map<string, Tag>> {
    const tags = await dbGetAll<Tag>('tags');
    return new Map(tags.map((t) => [t.id, t]));
  }

  /**
   * Calculate common tags, match score, and percentage
   */
  static calculateMatch(
    customerTagIds: string[],
    productTagIds: string[],
    tagsMap: Map<string, Tag>
  ): { matchedTags: string[]; score: number; percentage: number } {
    if (!customerTagIds?.length || !productTagIds?.length) {
      return { matchedTags: [], score: 0, percentage: 0 };
    }

    const customerTagsSet = new Set(customerTagIds);
    const matchedTags: string[] = [];
    let score = 0;
    let totalProductScore = 0;

    for (const pTagId of productTagIds) {
      const tag = tagsMap.get(pTagId);
      if (!tag) continue;
      
      const weight = tag.weight || 0;
      totalProductScore += weight;

      if (customerTagsSet.has(pTagId)) {
        matchedTags.push(pTagId);
        score += weight;
      }
    }

    const percentage = totalProductScore > 0 ? Math.round((score / totalProductScore) * 100) : 0;

    return { matchedTags, score, percentage };
  }

  /**
   * Generate and store recommendations for a single customer
   */
  static async generateRecommendations(customerId: string): Promise<Recommendation[]> {
    const customer = await dbGet<Customer>('customers', customerId);
    if (!customer) return [];

    const products = await dbGetAll<Product>('products');
    const tagsMap = await this.getTagsMap();

    const recommendations: Recommendation[] = [];

    for (const product of products) {
      const { matchedTags, score, percentage } = this.calculateMatch(
        customer.tags || [],
        product.tags || [],
        tagsMap
      );

      // Only recommend if there is a match
      if (score > 0) {
        recommendations.push({
          id: `${customerId}_${product.id}`, // composite ID
          customerId,
          productId: product.id,
          matchedTags,
          score,
          percentage,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Sort descending by score
    recommendations.sort((a, b) => b.score - a.score);

    // Save to DB
    await dbPutMany('recommendations', recommendations);

    return recommendations;
  }

  /**
   * Recalculate recommendations for all customers
   * Triggered when a tag weight changes, or bulk updates occur
   */
  static async recalculateAll(): Promise<void> {
    const customers = await dbGetAll<Customer>('customers');
    const promises = customers.map(c => this.generateRecommendations(c.id));
    await Promise.all(promises);
  }

  /**
   * Get Top Recommendations for a Customer
   */
  static async getTopRecommendations(customerId: string, limit: number = 10): Promise<Recommendation[]> {
    const all = await dbGetByIndex<Recommendation>('recommendations', 'by-customer', customerId);
    return all.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}
