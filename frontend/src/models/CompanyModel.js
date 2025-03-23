/**
 * Model representing a company (LinkedIn company)
 */
class CompanyModel {
  constructor(data = {}) {
    this.id = data.id || Date.now();
    this.name = data.name || '';
    this.industry = data.industry || '';
    this.size = data.size || '';
    this.location = data.location || '';
    this.website = data.website || '';
    this.linkedinUrl = data.linkedinUrl || '';
    this.specialties = data.specialties || [];
    this.description = data.description || '';
    this.founded = data.founded || null;
    this.keyProducts = data.keyProducts || [];
    this.recentNews = data.recentNews || [];
    this.painPoints = data.painPoints || [];
    this.salesAngles = data.salesAngles || [];
    this.decisionMakers = data.decisionMakers || [];
    this.prospects = data.prospects || []; // References to associated prospect IDs
    this.notes = data.notes || '';
    this.lastAnalyzed = data.lastAnalyzed || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.tags = data.tags || [];
    this.status = data.status || 'new'; // new, researched, approached, opportunity, customer, archived
    this.potentialValue = data.potentialValue || 0;
    this.summary = data.summary || '';
  }

  /**
   * Create a company from LinkedIn data
   * @param {Object} linkedinData - Structured LinkedIn company data
   * @returns {CompanyModel} - New company model instance
   */
  static fromLinkedInData(linkedinData) {
    const keyProducts = linkedinData.companyKeyProducts?.split(', ') || [];
    
    return new CompanyModel({
      name: linkedinData.companyName,
      industry: linkedinData.companyIndustry,
      size: linkedinData.companySize,
      linkedinUrl: linkedinData.linkedinUrl,
      specialties: [],
      keyProducts: keyProducts,
      recentNews: linkedinData.recentCompanyNews?.split('. ') || [],
      painPoints: linkedinData.potentialPainPoints?.split(', ') || [],
      salesAngles: linkedinData.suggestedSalesAngles?.split(', ') || [],
      summary: linkedinData.companySummary || '',
      lastAnalyzed: new Date().toISOString(),
      status: 'new',
    });
  }

  /**
   * Add a decision maker to the company
   * @param {Object} decisionMaker - Decision maker data
   */
  addDecisionMaker(decisionMaker) {
    // Check if decision maker already exists
    const exists = this.decisionMakers.some(dm => dm.linkedinUrl === decisionMaker.linkedinUrl);
    
    if (!exists) {
      this.decisionMakers.push({
        ...decisionMaker,
        id: Date.now()
      });
      this.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Link a prospect to this company
   * @param {number} prospectId - ID of the prospect to link
   */
  linkProspect(prospectId) {
    if (!this.prospects.includes(prospectId)) {
      this.prospects.push(prospectId);
      this.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Convert to a simple object for storage/serialization
   * @returns {Object} - Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      industry: this.industry,
      size: this.size,
      location: this.location,
      website: this.website,
      linkedinUrl: this.linkedinUrl,
      specialties: this.specialties,
      description: this.description,
      founded: this.founded,
      keyProducts: this.keyProducts,
      recentNews: this.recentNews,
      painPoints: this.painPoints,
      salesAngles: this.salesAngles,
      decisionMakers: this.decisionMakers,
      prospects: this.prospects,
      notes: this.notes,
      lastAnalyzed: this.lastAnalyzed,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      tags: this.tags,
      status: this.status,
      potentialValue: this.potentialValue,
      summary: this.summary,
    };
  }
}

export default CompanyModel;