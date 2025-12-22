/**
 * Dream Language Structure Configuration
 * Defines the schema and patterns for parsing natural language dreams
 * into structured data for goal generation and analysis
 */

const DREAM_TYPES = {
    EMPLOYEE: 'employee',
    ENTREPRENEUR: 'entrepreneur'
};

// Extended archetype classification for personalized journeys
const DREAM_ARCHETYPES = {
    CAREER: 'career',           // Traditional career/business goals
    CREATIVE: 'creative',       // Creative/lifestyle transformation  
    EMOTIONAL: 'emotional',     // Emotional healing/transition
    SELF_DISCOVERY: 'self-discovery' // Identity work/renewal
};

const MARKET_TYPES = {
    B2B: 'B2B',
    B2C: 'B2C',
    D2C: 'D2C',
    MIXED: 'Mixed'
};

// Base schema for all dreams
const BASE_DREAM_SCHEMA = {
    mode: null, // 'employee' | 'entrepreneur'
    rawText: '',
    confidence: null, // 0-100 from user input
    timeHorizon: null, // months from user input
    extractedAt: null,
    parsingConfidence: 0 // 0-1 from LLM parsing quality
};

// Employee-specific dream schema
const EMPLOYEE_DREAM_SCHEMA = {
    ...BASE_DREAM_SCHEMA,
    mode: DREAM_TYPES.EMPLOYEE,
    role: null,
    targetCompany: null,
    teamContext: null,
    techFocus: null,
    marketType: null,
    impactStatement: null,
    industryVertical: null,
    seniorityLevel: null, // 'junior', 'mid', 'senior', 'staff', 'principal', 'director', 'vp', 'c-level'
    workStyle: null, // 'remote', 'hybrid', 'onsite'
    location: null
};

// Entrepreneur-specific dream schema
const ENTREPRENEUR_DREAM_SCHEMA = {
    ...BASE_DREAM_SCHEMA,
    mode: DREAM_TYPES.ENTREPRENEUR,
    ventureIdea: null,
    industryVertical: null,
    techFocus: null,
    targetPersona: null,
    productFormat: null,
    deliveryModel: null,
    businessModel: null, // 'subscription', 'marketplace', 'saas', 'hardware', 'services'
    marketType: null,
    impactStatement: null,
    fundingStage: null, // 'bootstrapped', 'pre-seed', 'seed', 'series-a'
    teamSize: null,
    region: null
};

// Natural language parsing patterns for employee dreams
const EMPLOYEE_PATTERNS = [
    "I want to become a {role} at {company} working with the {team} to {mission}",
    "I want to work as a {role} at {company} in the {team} team",
    "I dream of being a {role} at {company} focusing on {focus}",
    "I want to join {company} as a {role} to {impact}",
    "My goal is to become a {role} working on {focus} at {company}",
    "I aspire to be a {role} at {company} building {product} for {audience}"
];

// Natural language parsing patterns for entrepreneur dreams
const ENTREPRENEUR_PATTERNS = [
    "I want to start a {industry} company that uses {tech} to {goal} for {audience}",
    "I want to launch a {industry} startup using {tech} to {impact}",
    "I dream of founding a company that {mission} for {audience}",
    "I want to build a {product} that helps {audience} {outcome}",
    "I want to create a {industry} business using {tech} to solve {problem}",
    "My goal is to start a {businessModel} company in {industry}"
];

// Industry verticals for classification
const INDUSTRY_VERTICALS = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce', 
    'Gaming', 'Media', 'Real Estate', 'Travel', 'Food & Beverage',
    'Fashion', 'Wellness', 'Sports', 'Automotive', 'Energy',
    'Agriculture', 'Manufacturing', 'Consulting', 'Marketing',
    'Legal', 'Non-profit', 'Government'
];

// Tech focus areas
const TECH_FOCUS_AREAS = [
    'Artificial Intelligence', 'Machine Learning', 'Generative AI',
    'Foundation Models', 'Computer Vision', 'Natural Language Processing',
    'Blockchain', 'Web3', 'Cryptocurrency', 'IoT', 'Robotics',
    'AR/VR', 'Mobile Development', 'Web Development', 'Cloud Computing',
    'DevOps', 'Cybersecurity', 'Data Science', 'Analytics',
    'Backend Engineering', 'Frontend Engineering', 'Full Stack'
];

// Product formats
const PRODUCT_FORMATS = [
    'Mobile App', 'Web Application', 'SaaS Platform', 'API Service',
    'AI Assistant', 'Chatbot', 'Dashboard', 'Marketplace',
    'Social Platform', 'E-commerce Site', 'Hardware Device',
    'Wearable', 'Browser Extension', 'Desktop Application'
];

// LLM parsing prompt template
const DREAM_PARSING_PROMPT = `
You are an expert at parsing career dreams and entrepreneurial goals into structured data.

Parse the following dream text and extract key information:

DREAM TEXT: "{dreamText}"
USER CONFIDENCE: {confidence}%
TIME HORIZON: {timeHorizon} months

Determine if this is an EMPLOYEE or ENTREPRENEUR dream, then extract relevant fields.

For EMPLOYEE dreams, extract:
- role: Specific job title/role
- targetCompany: Company name (if mentioned)
- teamContext: Team or department
- techFocus: Technology/tools/skills mentioned
- marketType: B2B, B2C, or Mixed
- impactStatement: What they want to achieve/impact
- industryVertical: Industry sector
- seniorityLevel: Career level (junior/mid/senior/staff/principal/director/vp/c-level)

For ENTREPRENEUR dreams, extract:
- ventureIdea: Core business concept
- industryVertical: Industry sector
- techFocus: Technology/tools mentioned
- targetPersona: Target customer/user
- productFormat: Type of product/service
- businessModel: Revenue model
- marketType: B2B, B2C, or Mixed
- impactStatement: Problem they want to solve
- region: Geographic focus

Return a JSON object with the extracted data. Include a parsingConfidence score (0-1) based on how clear the dream was to parse.

IMPORTANT: 
- Use null for missing/unclear fields
- Be specific and extract exact phrases when possible
- Classify industry vertical from this list: ${INDUSTRY_VERTICALS.join(', ')}
- Classify tech focus from this list: ${TECH_FOCUS_AREAS.join(', ')}
- For product format, use: ${PRODUCT_FORMATS.join(', ')}

Example output format:
{
  "mode": "employee",
  "role": "AI Product Manager",
  "targetCompany": "Anthropic",
  "teamContext": "Consumer AI team",
  "techFocus": "Foundation Models",
  "marketType": "B2C",
  "impactStatement": "improve mental wellness using foundation models",
  "industryVertical": "Technology",
  "seniorityLevel": "mid",
  "parsingConfidence": 0.95
}
`;

// Validation rules for parsed dreams
const VALIDATION_RULES = {
    employee: {
        required: ['mode', 'impactStatement'],
        recommended: ['role', 'industryVertical', 'techFocus'],
        optional: ['targetCompany', 'teamContext', 'marketType', 'seniorityLevel', 'workStyle', 'location']
    },
    entrepreneur: {
        required: ['mode', 'impactStatement'],
        recommended: ['ventureIdea', 'industryVertical', 'targetPersona'],
        optional: ['techFocus', 'productFormat', 'businessModel', 'marketType', 'fundingStage', 'teamSize', 'region']
    }
};

// Quality scoring for parsed dreams
const QUALITY_METRICS = {
    EXCELLENT: 0.9, // Clear, specific, actionable
    GOOD: 0.7,      // Good detail, minor gaps
    FAIR: 0.5,      // Basic info, needs clarification
    POOR: 0.3       // Vague, missing key details
};

// Archetype-specific schemas for personalized parsing
const ARCHETYPE_SCHEMAS = {
    [DREAM_ARCHETYPES.CAREER]: {
        archetype: DREAM_ARCHETYPES.CAREER,
        desired_role: null,
        desired_company: null, 
        current_role: null,
        current_location: null,
        emotional_driver: null,
        required_fields: ['desired_role', 'current_role', 'emotional_driver']
    },
    [DREAM_ARCHETYPES.CREATIVE]: {
        archetype: DREAM_ARCHETYPES.CREATIVE,
        creative_goal: null,
        current_challenge: null,
        emotional_driver: null,
        required_fields: ['creative_goal', 'current_challenge', 'emotional_driver']
    },
    [DREAM_ARCHETYPES.EMOTIONAL]: {
        archetype: DREAM_ARCHETYPES.EMOTIONAL,
        current_emotion: null,
        desired_emotion: null,
        emotional_driver: null,
        required_fields: ['current_emotion', 'desired_emotion', 'emotional_driver']
    },
    [DREAM_ARCHETYPES.SELF_DISCOVERY]: {
        archetype: DREAM_ARCHETYPES.SELF_DISCOVERY,
        rediscover_aspect: null,
        after_experience: null,
        emotional_driver: null,
        required_fields: ['rediscover_aspect', 'after_experience', 'emotional_driver']
    }
};

// Template structures for each archetype
const ARCHETYPE_TEMPLATES = {
    [DREAM_ARCHETYPES.CAREER]: {
        template: "[Doing dream work] at [place], after [past role], because [motivational truth].",
        example: "Leading product strategy at a healthtech startup, after years in support roles, because I'm ready to shape what really matters.",
        patterns: {
            desired_role: /^([^,]+?),?\s*at/i,
            desired_company: /at\s+([^,]+?),?\s*after/i,
            current_role: /after\s+([^,]+?),?\s*because/i,
            emotional_driver: /because\s+(.+)$/i
        }
    },
    [DREAM_ARCHETYPES.CREATIVE]: {
        template: "[Running/Creating/Leading] [project/business] for [audience], after [past experience], because [personal calling].",
        example: "Running my own marketing consultancy, helping women-led startups share their voice, after 5 years in corporate, because I'm finally creating from purpose — not pressure.",
        patterns: {
            creative_goal: /^([^,]+?),?\s*for/i,
            current_challenge: /for\s+([^,]+?),?\s*after/i,
            current_role: /after\s+([^,]+?),?\s*because/i,
            emotional_driver: /because\s+(.+)$/i
        }
    },
    [DREAM_ARCHETYPES.EMOTIONAL]: {
        template: "[Living/Leading/Moving] with [emotional state], after [struggle or phase], because [breakthrough insight].",
        example: "Navigating life with calm, confidence, and emotional strength, after years of putting others first — because I'm finally living from peace, not pressure.",
        patterns: {
            desired_emotion: /^([^,]+?),?\s*after/i,
            current_emotion: /after\s+([^,]+?),?\s*because/i,
            emotional_driver: /because\s+(.+)$/i
        }
    },
    [DREAM_ARCHETYPES.SELF_DISCOVERY]: {
        template: "[Owning/Embracing/Expressing] [authentic self], after [limiting context], because [empowering belief].",
        example: "Owning my voice, expressing who I truly am, after years of shrinking myself to fit — because I'm finally done playing small.",
        patterns: {
            rediscover_aspect: /^([^,]+?),?\s*after/i,
            after_experience: /after\s+([^,]+?),?\s*because/i,
            emotional_driver: /because\s+(.+)$/i
        }
    }
};

// Simple regex patterns for archetype field extraction (fallback)
const ARCHETYPE_PATTERNS = {
    [DREAM_ARCHETYPES.CAREER]: {
        desired_role: /^([^,]+?),?\s*at/i,
        desired_company: /at\s+([^,]+?),?\s*after/i,
        current_role: /after\s+([^,]+?),?\s*because/i,
        emotional_driver: /because\s+(.+)$/i
    },
    [DREAM_ARCHETYPES.CREATIVE]: {
        creative_goal: /^([^,]+?),?\s*for/i,
        current_challenge: /for\s+([^,]+?),?\s*after/i,
        current_role: /after\s+([^,]+?),?\s*because/i,
        emotional_driver: /because\s+(.+)$/i
    },
    [DREAM_ARCHETYPES.EMOTIONAL]: {
        desired_emotion: /^([^,]+?),?\s*after/i,
        current_emotion: /after\s+([^,]+?),?\s*because/i,
        emotional_driver: /because\s+(.+)$/i
    },
    [DREAM_ARCHETYPES.SELF_DISCOVERY]: {
        rediscover_aspect: /^([^,]+?),?\s*after/i,
        after_experience: /after\s+([^,]+?),?\s*because/i,
        emotional_driver: /because\s+(.+)$/i
    }
};

module.exports = {
    DREAM_TYPES,
    DREAM_ARCHETYPES,
    MARKET_TYPES,
    BASE_DREAM_SCHEMA,
    EMPLOYEE_DREAM_SCHEMA,
    ENTREPRENEUR_DREAM_SCHEMA,
    ARCHETYPE_SCHEMAS,
    ARCHETYPE_TEMPLATES,
    ARCHETYPE_PATTERNS,
    EMPLOYEE_PATTERNS,
    ENTREPRENEUR_PATTERNS,
    INDUSTRY_VERTICALS,
    TECH_FOCUS_AREAS,
    PRODUCT_FORMATS,
    DREAM_PARSING_PROMPT,
    VALIDATION_RULES,
    QUALITY_METRICS
};