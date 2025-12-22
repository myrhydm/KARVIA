/**
 * Dream Metadata Extractor
 * Automatically extracts structured metadata from dream text using pattern matching and NLP
 */

class DreamMetadataExtractor {
    constructor() {
        // Define patterns for extracting different types of metadata
        this.patterns = {
            targetRoles: [
                // Executive/Leadership roles
                'product manager', 'pm', 'senior product manager', 'lead product manager',
                'director', 'vp', 'vice president', 'chief', 'ceo', 'cto', 'cmo',
                'head of', 'team lead', 'engineering manager', 'design lead',
                
                // Specific professional roles
                'ux designer', 'ui designer', 'graphic designer', 'web designer',
                'software engineer', 'developer', 'frontend developer', 'backend developer',
                'data scientist', 'data analyst', 'machine learning engineer',
                'marketing manager', 'growth manager', 'content creator', 'copywriter',
                'coach', 'consultant', 'therapist', 'counselor', 'trainer',
                'founder', 'entrepreneur', 'business owner', 'startup founder',
                'freelancer', 'contractor', 'independent consultant'
            ],
            
            domains: [
                // Technology domains
                'ai tools', 'artificial intelligence', 'machine learning', 'ai-first',
                'fintech', 'edtech', 'healthtech', 'blockchain', 'crypto',
                'saas', 'software', 'mobile apps', 'web development',
                
                // Creative/Content domains
                'storytelling', 'personal branding', 'content creation', 'social media',
                'marketing', 'advertising', 'brand strategy', 'creative strategy',
                'video production', 'photography', 'graphic design',
                
                // Wellness/Lifestyle domains
                'digital wellness', 'mental health', 'fitness', 'nutrition',
                'mindfulness', 'coaching', 'personal development', 'habits',
                
                // Business domains
                'e-commerce', 'retail', 'consulting', 'real estate', 'finance',
                'healthcare', 'education', 'non-profit', 'sustainability'
            ],
            
            currentRoles: [
                // Common current positions
                'customer success', 'customer support', 'account manager',
                'agency marketing', 'marketing coordinator', 'marketing assistant',
                'freelancing', 'freelancer', 'contractor', 'consultant',
                'ux designer', 'ui designer', 'graphic designer',
                'software engineer', 'developer', 'analyst', 'coordinator',
                'manager', 'associate', 'specialist', 'executive'
            ],
            
            locations: [
                // Major tech/business hubs
                'san francisco', 'sf', 'silicon valley', 'palo alto', 'mountain view',
                'new york', 'nyc', 'manhattan', 'brooklyn',
                'austin', 'dallas', 'houston',
                'seattle', 'portland', 'denver', 'boulder',
                'los angeles', 'la', 'santa monica', 'venice',
                'chicago', 'boston', 'washington dc', 'dc',
                'miami', 'atlanta', 'nashville',
                
                // International locations
                'london', 'berlin', 'amsterdam', 'paris', 'barcelona', 'madrid',
                'dublin', 'edinburgh', 'zurich', 'geneva',
                'toronto', 'vancouver', 'montreal',
                'sydney', 'melbourne', 'singapore', 'hong kong', 'tokyo',
                'dubai', 'abu dhabi', 'tel aviv', 'bangalore', 'mumbai'
            ],
            
            motivations: [
                // Achievement/Growth motivations
                'ready to lead', 'ready to own', 'ready to scale', 'ready to build',
                'finally creating', 'finally building', 'finally leading',
                'shape how millions', 'impact millions', 'scale my ideas',
                'amplify stories', 'amplify voices', 'help people',
                
                // Change/Transition motivations  
                'done playing small', 'finally prioritizing', 'prioritize peace',
                'creating from purpose', 'purpose over pressure', 'peace over performance',
                'own my voice', 'show up fully', 'be authentic',
                'break free', 'escape corporate', 'leave agency life',
                
                // Impact motivations
                'make a difference', 'change lives', 'solve problems',
                'build something meaningful', 'create real impact'
            ]
        };
        
        // Contextual phrases that help identify the pattern
        this.contextPatterns = {
            roleTransition: ['after', 'from', 'transition from', 'coming from', 'leaving'],
            location: ['in', 'from', 'based', 'located', 'working in', 'living in'],
            motivation: ['because', 'since', 'as', 'so that', 'to', 'for'],
            domain: ['in', 'for', 'with', 'around', 'focused on', 'specializing in']
        };
    }
    
    /**
     * Main extraction method
     */
    extractMetadata(dreamText) {
        if (!dreamText || typeof dreamText !== 'string') {
            return this.getEmptyMetadata();
        }
        
        const text = dreamText.toLowerCase().trim();
        
        return {
            targetRole: this.extractTargetRole(text),
            domain: this.extractDomain(text),
            currentRole: this.extractCurrentRole(text),
            location: this.extractLocation(text),
            motivation: this.extractMotivation(text),
            confidence: this.calculateExtractionConfidence(text)
        };
    }
    
    /**
     * Extract target role from dream text
     */
    extractTargetRole(text) {
        // Look for roles mentioned in aspirational context
        const aspirationalPhrases = ['as a', 'become a', 'being a', 'working as', 'role as'];
        
        for (const phrase of aspirationalPhrases) {
            const index = text.indexOf(phrase);
            if (index !== -1) {
                const afterPhrase = text.substring(index + phrase.length).trim();
                for (const role of this.patterns.targetRoles) {
                    if (afterPhrase.startsWith(role)) {
                        return this.capitalizeRole(role);
                    }
                }
            }
        }
        
        // Fallback: look for any target role mentioned
        for (const role of this.patterns.targetRoles) {
            if (text.includes(role)) {
                return this.capitalizeRole(role);
            }
        }
        
        return '';
    }
    
    /**
     * Extract domain/industry from dream text
     */
    extractDomain(text) {
        const domainPhrases = ['in', 'with', 'for', 'around', 'focused on'];
        
        // Look for domains in context
        for (const domain of this.patterns.domains) {
            if (text.includes(domain)) {
                return this.capitalizeDomain(domain);
            }
        }
        
        return '';
    }
    
    /**
     * Extract current role from dream text
     */
    extractCurrentRole(text) {
        const transitionPhrases = ['after', 'from', 'coming from', 'leaving', 'transitioning from'];
        
        for (const phrase of transitionPhrases) {
            const index = text.indexOf(phrase);
            if (index !== -1) {
                const afterPhrase = text.substring(index + phrase.length).trim();
                for (const role of this.patterns.currentRoles) {
                    if (afterPhrase.includes(role)) {
                        return this.capitalizeRole(role);
                    }
                }
            }
        }
        
        return '';
    }
    
    /**
     * Extract location from dream text
     */
    extractLocation(text) {
        const locationPhrases = ['in', 'from', 'based in', 'located in', 'working in', 'living in'];
        
        for (const phrase of locationPhrases) {
            const index = text.indexOf(phrase);
            if (index !== -1) {
                const afterPhrase = text.substring(index + phrase.length).trim();
                for (const location of this.patterns.locations) {
                    if (afterPhrase.startsWith(location)) {
                        return this.capitalizeLocation(location);
                    }
                }
            }
        }
        
        // Fallback: look for any location mentioned
        for (const location of this.patterns.locations) {
            if (text.includes(location)) {
                return this.capitalizeLocation(location);
            }
        }
        
        return '';
    }
    
    /**
     * Extract motivation from dream text
     */
    extractMotivation(text) {
        const motivationPhrases = ['because', 'since', 'as', 'so that', '—'];
        
        for (const phrase of motivationPhrases) {
            const index = text.indexOf(phrase);
            if (index !== -1) {
                const afterPhrase = text.substring(index + phrase.length).trim();
                for (const motivation of this.patterns.motivations) {
                    if (afterPhrase.includes(motivation)) {
                        return this.capitalizeMotivation(motivation);
                    }
                }
            }
        }
        
        return '';
    }
    
    /**
     * Calculate confidence score for extraction accuracy
     */
    calculateExtractionConfidence(text) {
        let score = 0;
        const totalFields = 5;
        
        if (this.extractTargetRole(text)) score++;
        if (this.extractDomain(text)) score++;
        if (this.extractCurrentRole(text)) score++;
        if (this.extractLocation(text)) score++;
        if (this.extractMotivation(text)) score++;
        
        return Math.round((score / totalFields) * 100);
    }
    
    /**
     * Helper methods for formatting extracted text
     */
    capitalizeRole(role) {
        return role.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
    
    capitalizeDomain(domain) {
        // Special cases for domain formatting
        if (domain.includes('ai')) {
            return domain.replace('ai', 'AI');
        }
        return domain.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
    
    capitalizeLocation(location) {
        // Special cases for location formatting
        const specialCases = {
            'sf': 'San Francisco',
            'nyc': 'New York City',
            'la': 'Los Angeles',
            'dc': 'Washington DC'
        };
        
        if (specialCases[location]) {
            return specialCases[location];
        }
        
        return location.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
    
    capitalizeMotivation(motivation) {
        return motivation.charAt(0).toUpperCase() + motivation.slice(1);
    }
    
    /**
     * Return empty metadata structure
     */
    getEmptyMetadata() {
        return {
            targetRole: '',
            domain: '',
            currentRole: '',
            location: '',
            motivation: '',
            confidence: 0
        };
    }
    
    /**
     * Test extraction with example texts
     */
    testExtraction() {
        const examples = [
            "Designing AI-first products as a Product Manager at a growth-stage startup in San Francisco, after 5 years as a UX designer — because I'm ready to lead cross-functional teams and ship what matters.",
            "Helping solopreneurs craft bold personal brands through storytelling strategy from my studio in Austin, after years in agency marketing — because I'm finally using my skills to amplify human stories.",
            "Building a digital wellness startup from Dubai that helps Gen Z build habits, after freelancing for 3 years — because I'm ready to scale my ideas into real impact."
        ];
        
        console.log('🧪 Testing Dream Metadata Extraction:');
        examples.forEach((example, index) => {
            console.log(`\nExample ${index + 1}:`);
            console.log(`Text: "${example}"`);
            console.log('Extracted:', this.extractMetadata(example));
        });
    }
}

module.exports = DreamMetadataExtractor;