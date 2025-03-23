/**
 * Model representing a prospect (LinkedIn profile)
 */
class ProspectModel {
  constructor(data = {}) {
    this.id = data.id || Date.now();
    this.name = data.name || '';
    this.title = data.title || '';
    this.company = data.company || '';
    this.companyId = data.companyId || null; // Reference to company
    this.email = data.email || '';
    this.phone = data.phone || '';
    this.linkedinUrl = data.linkedinUrl || '';
    this.location = data.location || '';
    this.keySkills = data.keySkills || [];
    this.experience = data.experience || [];
    this.interests = data.interests || [];
    this.education = data.education || [];
    this.painPoints = data.painPoints || [];
    this.salesAngles = data.salesAngles || [];
    this.notes = data.notes || '';
    this.lastAnalyzed = data.lastAnalyzed || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.tags = data.tags || [];
    this.status = data.status || 'new'; // new, contacted, qualified, opportunity, customer, archived
    this.potentialValue = data.potentialValue || 0;
    this.summary = data.summary || '';
  }

  /**
   * Create a prospect from LinkedIn data
   * @param {Object} linkedinData - Structured LinkedIn profile data
   * @returns {ProspectModel} - New prospect model instance
   */
  static fromLinkedInData(linkedinData) {
    return new ProspectModel({
      name: linkedinData.contactName,
      title: linkedinData.contactTitle,
      company: linkedinData.companyName,
      linkedinUrl: linkedinData.linkedinUrl,
      keySkills: linkedinData.contactKeySkills?.split(', ') || [],
      painPoints: linkedinData.potentialPainPoints?.split(', ') || [],
      salesAngles: linkedinData.suggestedSalesAngles?.split(', ') || [],
      summary: linkedinData.contactSummary || '',
      lastAnalyzed: new Date().toISOString(),
      status: 'new',
      email: linkedinData.contactEmail || '',
      phone: linkedinData.contactPhone || '',
    });
  }

  /**
   * Convert to a simple object for storage/serialization
   * @returns {Object} - Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      title: this.title,
      company: this.company,
      companyId: this.companyId,
      email: this.email,
      phone: this.phone,
      linkedinUrl: this.linkedinUrl,
      location: this.location,
      keySkills: this.keySkills,
      experience: this.experience,
      interests: this.interests,
      education: this.education,
      painPoints: this.painPoints,
      salesAngles: this.salesAngles,
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

export default ProspectModel;