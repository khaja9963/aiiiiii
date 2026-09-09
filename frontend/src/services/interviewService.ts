import { InterviewKit, InterviewQuestion } from '../types';

export interface GenerateQuestionsParams {
  jobTitle: string;
  jobDescription: string;
  candidateName: string;
  candidateResume: string;
  candidateExperience: number; // in years
  focusArea?: string;
  apiKey?: string;
  model?: string;
}

const GROQ_STORAGE_KEY = 'recruitment_groq_api_key';
const GROQ_MODEL_KEY = 'recruitment_groq_model';
export const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-20b';

export const interviewService = {
  getStoredApiKey: (): string => {
    try {
      return localStorage.getItem(GROQ_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  },

  setStoredApiKey: (key: string): void => {
    try {
      localStorage.setItem(GROQ_STORAGE_KEY, key.trim());
    } catch (e) {
      console.error('Failed to store Groq API key', e);
    }
  },

  clearStoredApiKey: (): void => {
    try {
      localStorage.removeItem(GROQ_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear Groq API key', e);
    }
  },

  getStoredModel: (): string => {
    try {
      return localStorage.getItem(GROQ_MODEL_KEY) || DEFAULT_GROQ_MODEL;
    } catch {
      return DEFAULT_GROQ_MODEL;
    }
  },

  setStoredModel: (model: string): void => {
    try {
      localStorage.setItem(GROQ_MODEL_KEY, model);
    } catch (e) {
      console.error('Failed to store Groq model', e);
    }
  },

  // Direct Groq API Client Call
  generateViaGroqDirect: async (
    apiKey: string,
    params: GenerateQuestionsParams,
    modelName: string = DEFAULT_GROQ_MODEL
  ): Promise<InterviewKit> => {
    const exp = params.candidateExperience;
    let expTier = 'Junior (0-2 Yrs)';
    let difficulty = 'Beginner';
    let focusGuideline = 'Focus on core programming fundamentals, structured debugging, data structures, and learning capacity.';
    if (exp >= 8) {
      expTier = 'Lead / Architect (8+ Yrs)';
      difficulty = 'Expert';
      focusGuideline = 'Focus on distributed system architecture, trade-offs, technical governance, scaling bottlenecks, and organizational engineering excellence.';
    } else if (exp >= 5) {
      expTier = 'Senior (5-8 Yrs)';
      difficulty = 'Advanced';
      focusGuideline = 'Focus on complex system resilience, concurrency, microservices/APIs, code maintainability, and team technical leadership.';
    } else if (exp >= 3) {
      expTier = 'Mid-Level (3-5 Yrs)';
      difficulty = 'Intermediate';
      focusGuideline = 'Focus on robust feature architecture, clean modular design, integration testing, and independent problem-solving.';
    }

    const difficultyBadge = `${difficulty} (${exp} Yrs Exp)`;

    const systemPrompt = `You are a Principal Engineering Recruiter and Technical Bar Raiser.
Your goal is to generate short, razor-sharp technical interview questions specifically evaluating this candidate against the target role.

Target Position: ${params.jobTitle}
Candidate Name: ${params.candidateName}
Experience: ${exp} Years (${difficultyBadge})
Experience Calibration Guide: ${focusGuideline}

STRICT CONSTRAINTS (MUST COMPLY):
1. QUESTION LENGTH: Each question MUST BE STRICTLY 1 OR 2 LINES (maximum 20-30 words). Never output long paragraphs or multi-part compound setups.
2. DIFFICULTY: The difficulty must strictly match their ${difficultyBadge} tier.
3. Formulate 4 sharp interview questions across categories:
   - "JD Technical": 1-2 lines on core technology requirements.
   - "Resume Deep-Dive": 1-2 lines on candidate's specific claims/projects.
   - "Experience & Architecture": 1-2 lines calibrated to their ${exp} years experience (${difficulty}).
   - "Behavioral & Leadership": 1-2 lines on trade-offs and decision making.
4. For EACH question, provide:
   - "id": string like "groq-q1"
   - "category": exactly one of ["JD Technical", "Resume Deep-Dive", "Experience & Architecture", "Behavioral & Leadership"]
   - "difficulty": "${difficultyBadge}"
   - "question": strictly 1 or 2 line question text
   - "answer": comprehensive, high-scoring model answer that directly answers the question demonstrating deep subject mastery (2-4 clear sentences).
   - "rationale": 1 short sentence reason
   - "whatToLookFor": array of 2 short bullet points
   - "followUpProbe": 1 short follow-up line
5. Provide match score (0-100) and a concise 1-sentence summary.

Respond ONLY with valid JSON in this exact structure:
{
  "jobTitle": "${params.jobTitle}",
  "candidateName": "${params.candidateName}",
  "candidateExperience": ${exp},
  "matchedScore": 86,
  "summary": "Concise 1-sentence executive summary.",
  "questions": [
    {
      "id": "groq-q1",
      "category": "JD Technical",
      "difficulty": "${difficultyBadge}",
      "question": "Short 1 or 2 line question text?",
      "answer": "Clear, direct, and structured model answer explaining the exact technical solution or strategy.",
      "rationale": "Short 1-sentence rationale.",
      "whatToLookFor": ["Point 1", "Point 2"],
      "followUpProbe": "Short 1-line follow-up?"
    }
  ]
}`;

    const userPrompt = `Target Job Title: ${params.jobTitle}
Job Description:
${params.jobDescription}

Candidate Profile:
Name: ${params.candidateName}
Experience: ${exp} years
Resume Content:
${params.candidateResume}`;

    const modelsToTry = [modelName, 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-120b'];
    let lastError: any = null;
    let res: Response | null = null;
    let usedModel = modelName;

    for (const mod of modelsToTry) {
      try {
        const attempt = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey.trim()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: mod,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' }
          })
        });

        if (attempt.ok) {
          res = attempt;
          usedModel = mod;
          break;
        } else {
          lastError = await attempt.json().catch(() => ({}));
          // If not 404 (model not found), don't keep trying others unless it's rate limit or not found
          if (attempt.status !== 404 && attempt.status !== 400) {
            break;
          }
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (!res || !res.ok) {
      throw new Error(lastError?.error?.message || 'Groq API request failed. Please verify your API key.');
    }

    const data = await res.json();
    const content = data.choices[0]?.message?.content;
    const parsed = JSON.parse(content);

    return {
      jobTitle: parsed.jobTitle || params.jobTitle,
      candidateName: parsed.candidateName || params.candidateName,
      candidateExperience: parsed.candidateExperience ?? exp,
      matchedScore: parsed.matchedScore ?? 85,
      summary: parsed.summary || `Personalized Groq LLM assessment generated for ${params.candidateName}.`,
      generatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      questions: parsed.questions || [],
      source: 'groq-llm',
      model: usedModel
    };
  },

  // Main Generator orchestrator
  generateInterviewKit: async (params: GenerateQuestionsParams): Promise<InterviewKit> => {
    const activeKey = params.apiKey || interviewService.getStoredApiKey();
    const chosenModel = params.model || interviewService.getStoredModel();

    // Generate through Groq directly when the user supplies an API key.
    if (activeKey) {
      try {
        return await interviewService.generateViaGroqDirect(activeKey, params, chosenModel);
      } catch (groqErr: any) {
        console.warn('Groq direct API error, falling back to algorithmic calibrator:', groqErr);
        throw new Error(groqErr?.message || 'Failed to generate with Groq API. Please check your API key.');
      }
    }

    // 3. Fallback: Intelligent Algorithmic Calibration Generator
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const exp = params.candidateExperience;
    let expTier = 'Junior (0-2 Yrs)';
    let difficulty = 'Beginner';
    if (exp >= 8) {
      expTier = 'Lead / Architect (8+ Yrs)';
      difficulty = 'Expert';
    } else if (exp >= 5) {
      expTier = 'Senior (5-8 Yrs)';
      difficulty = 'Advanced';
    } else if (exp >= 3) {
      expTier = 'Mid-Level (3-5 Yrs)';
      difficulty = 'Intermediate';
    }

    const difficultyBadge = `${difficulty} (${exp} Yrs Exp)`;

    const jdText = params.jobDescription.toLowerCase();
    const resumeText = params.candidateResume.toLowerCase();

    const techKeywords = [
      'react', 'typescript', 'javascript', 'python', 'fastapi', 'node', 'django',
      'docker', 'kubernetes', 'aws', 'graphql', 'sql', 'postgresql', 'mongodb',
      'redis', 'tailwind', 'microservices', 'next.js', 'vue', 'ci/cd', 'kafka'
    ];

    const detectedJDSkills = techKeywords.filter(k => jdText.includes(k));
    const detectedResumeSkills = techKeywords.filter(k => resumeText.includes(k));
    const overlapSkills = detectedJDSkills.filter(k => detectedResumeSkills.includes(k));
    const missingJDSkills = detectedJDSkills.filter(k => !detectedResumeSkills.includes(k));

    const primaryTech = overlapSkills[0] || detectedJDSkills[0] || 'Fullstack Architecture';
    const secondaryTech = overlapSkills[1] || detectedJDSkills[1] || 'State Management & APIs';
    const gapTech = missingJDSkills[0] || 'Cloud Deployment & Monitoring';

    const questions: InterviewQuestion[] = [
      {
        id: 'q-jd-1',
        category: 'JD Technical',
        difficulty: difficultyBadge,
        question: `How have you structured and optimized ${primaryTech.toUpperCase()} applications in production to handle heavy load?`,
        rationale: `Assesses hands-on production depth with ${primaryTech.toUpperCase()} specified in the JD.`,
        answer: `In high-load production environments with ${primaryTech.toUpperCase()}, I optimize critical paths by introducing distributed caching (e.g. Redis), connection pooling, asynchronous task processing, and payload compression. On the architectural level, I establish horizontal autoscaling rules, break monolithic bottlenecks into independent microservices, and configure CDN edge caching to ensure p99 response times stay sub-100ms.`,
        whatToLookFor: [
          `Concrete optimization tactics rather than generic definitions.`,
          `Awareness of lifecycle and state bottlenecks.`
        ],
        followUpProbe: `What was the most challenging bug or performance regression you solved in ${primaryTech.toUpperCase()}?`
      },
      {
        id: 'q-jd-2',
        category: 'JD Technical',
        difficulty: difficultyBadge,
        question: `How would you quickly adapt your existing skills to build and deploy within our ${gapTech.toUpperCase()} pipeline?`,
        rationale: `Evaluates technical agility and knowledge transferability for ${gapTech.toUpperCase()}.`,
        answer: `I begin by thoroughly reviewing existing system architecture diagrams and deployment configuration scripts to map familiar design patterns onto ${gapTech.toUpperCase()}. Next, I create an isolated sandbox environment to run proof-of-concept pipelines, verify failure recovery mechanics, and pair-program with internal domain experts to align on established operational runbooks within the first two sprints.`,
        whatToLookFor: [
          `Structured methodology for learning new technology.`,
          `Confidence and honesty regarding technical boundaries.`
        ],
        followUpProbe: `Can you share an example where you mastered a new technology quickly under a tight deadline?`
      },
      {
        id: 'q-res-1',
        category: 'Resume Deep-Dive',
        difficulty: difficultyBadge,
        question: `What was the most critical architectural decision or trade-off you made when delivering your ${secondaryTech.toUpperCase()} project?`,
        rationale: `Validates technical depth and ownership of achievements highlighted on ${params.candidateName}'s resume.`,
        answer: `During our ${secondaryTech.toUpperCase()} initiative, our key trade-off was choosing eventual consistency over strict distributed locking to prioritize 99.99% write availability under traffic spikes. We introduced idempotent message consumers and a dead-letter queue recovery mechanism to safely reconcile transient discrepancies without degrading user responsiveness.`,
        whatToLookFor: [
          `Clear rationale defending trade-offs (e.g., complexity vs maintainability).`,
          `Clear articulation of personal contributions.`
        ],
        followUpProbe: `If you were designing that solution again today, what would you do differently?`
      },
      {
        id: 'q-exp-1',
        category: 'Experience & Architecture',
        difficulty: difficultyBadge,
        question: exp >= 8
          ? `With ${exp} years of experience, how do you eliminate cross-system architectural debt and align engineering design with business ROI?`
          : exp >= 5
          ? `As a Senior Engineer with ${exp} years experience, how do you design systems to survive partial network failures and traffic spikes?`
          : exp >= 3
          ? `With ${exp} years under your belt, how do you balance writing reusable abstractions against keeping code easy to debug?`
          : `With ${exp} year(s) of experience, walk me through your step-by-step process for debugging an elusive production bug.`,
        rationale: `Calibrated specifically for ${difficulty} difficulty based on ${exp} years of tenure.`,
        answer: exp >= 8
          ? `I establish Architecture Decision Records (ADRs) and quantify technical debt in terms of delivery velocity and defect rate to gain executive buy-in. We carve out 20% of every sprint for debt remediation, using the Strangler Fig pattern to decommission legacy subsystems incrementally with zero downtime.`
          : exp >= 5
          ? `I implement defensive resiliency patterns including circuit breakers, exponential backoff with jitter, decoupled asynchronous queues, and automated graceful degradation. Critical paths fail back to cached or read-only states rather than cascading failures across dependent microservices.`
          : exp >= 3
          ? `I adhere strictly to Rule of Three: I duplicate simple, clear logic until the exact shared abstraction is proven necessary. I prioritize explicit data flow, single-responsibility functions, and descriptive error logs over deeply nested polymorphic inheritance.`
          : `I isolate reproduction steps by analyzing structured application logs and distributed traces (APM). I write a failing unit/integration test reproducing the exact payload edge case, verify the root cause with breakpoints or telemetry, implement the minimal safe fix, and add regression tests before deploying.`,
        whatToLookFor: [
          `Depth matching ${difficulty} expectations.`,
          `Clear reasoning and real-world considerations.`
        ],
        followUpProbe: `Can you share a situation where that approach was challenged by your team?`
      },
      {
        id: 'q-beh-1',
        category: 'Behavioral & Leadership',
        difficulty: difficultyBadge,
        question: `Describe a difficult technical disagreement you resolved with a teammate regarding system design or code standards.`,
        rationale: `Assesses collaborative decision making, empathy, and professional communication.`,
        answer: `When a teammate and I differed on choosing between GraphQL vs REST for an upcoming API, we stepped back to document trade-offs against our specific mobile client bandwidth constraints and caching requirements. We created a small proof-of-concept, benchmarked latency under throttled network conditions, and mutually agreed on the option that demonstrably satisfied customer SLA metrics while reducing frontend maintenance overhead.`,
        whatToLookFor: [
          `Focus on objective metrics and user needs over personal ego.`,
          `Constructive alignment toward team success.`
        ],
        followUpProbe: `How did the final outcome impact the delivery timeline and team morale?`
      }
    ];

    const matchedScore = Math.min(
      98,
      Math.max(65, Math.round((overlapSkills.length / (detectedJDSkills.length || 1)) * 40 + Math.min(exp * 8, 55)))
    );

    return {
      jobTitle: params.jobTitle,
      candidateName: params.candidateName || 'Candidate',
      candidateExperience: exp,
      matchedScore,
      summary: `Algorithmic preview kit generated for ${params.candidateName || 'the candidate'} applying for ${params.jobTitle}. (Connect a Groq API Key for live AI generation).`,
      generatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      questions,
      source: 'algorithmic'
    };
  }
};
