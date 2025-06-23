import Anthropic from '@anthropic-ai/sdk';
import crypto from 'crypto';
import { getDb } from '../config/database.js';

class AIAnalysisService {
  constructor() {
    this.anthropic = null; // Will be initialized with database API key
    this.model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
    this.temperature = parseFloat(process.env.CLAUDE_TEMPERATURE) || 0.1;
    this.maxTokens = parseInt(process.env.CLAUDE_MAX_TOKENS) || 4000;
    this.maxRetries = parseInt(process.env.CLAUDE_MAX_RETRIES) || 3;
    this.timeout = parseInt(process.env.CLAUDE_TIMEOUT) || 30000;
  }

  /**
   * Get Claude API key from database, fallback to environment variable
   */
  async getClaudeApiKey() {
    try {
      const db = getDb();
      const setting = await db.prepare('SELECT value FROM settings WHERE key = ?').get('claude_api_key');
      
      if (setting?.value) {
        return setting.value;
      }
      
      // Fallback to environment variable for backward compatibility
      return process.env.ANTHROPIC_API_KEY;
    } catch (error) {
      console.error('Error getting Claude API key from database:', error);
      // Fallback to environment variable
      return process.env.ANTHROPIC_API_KEY;
    }
  }

  /**
   * Initialize Anthropic client with current API key
   */
  async initializeClient() {
    const apiKey = await this.getClaudeApiKey();
    if (!apiKey) {
      throw new Error('Claude API key not configured. Please set it in Settings.');
    }
    
    this.anthropic = new Anthropic({ apiKey });
    return this.anthropic;
  }

  /**
   * Generate a unique analysis ID
   */
  generateAnalysisId() {
    return crypto.randomUUID();
  }

  /**
   * Generate a hash for command caching
   */
  generateCommandHash(commands) {
    const commandString = Array.isArray(commands) 
      ? commands.join('|') 
      : commands;
    return crypto.createHash('sha256').update(commandString).digest('hex');
  }

  /**
   * Build the analysis prompt for Claude
   */
  buildAnalysisPrompt(commands, options = {}) {
    const commandList = Array.isArray(commands) 
      ? commands.map((cmd, i) => `${i + 1}. ${cmd}`).join('\n')
      : `1. ${commands}`;

    return `You are an expert terminal instructor who makes complex commands easy to understand. Create educational snippets focused on specific commands with beginner-friendly explanations and advanced techniques.

COMMANDS TO ANALYZE:
${commandList}

FORMATTING RULES:
1. **TITLE**: Use a concise version of the command as the title, MAX 60 CHARACTERS (e.g., "docker ps", "docker build -t image", "git log --oneline")
2. **DESCRIPTION**: Start with a simple analogy explaining what the command does in plain English, then explain the practical benefits and when to use it
3. **CODE**: Show the basic command, explain each flag, then provide advanced variations and pro tips that most people don't know
4. **CATEGORIES**: MAXIMUM 3 categories only. Choose the most relevant ones (e.g., main tool, action, purpose)

EDUCATIONAL APPROACH:
- Use analogies to explain concepts (like comparing docker ps to checking what programs are running)
- Start with the basics, then show advanced techniques
- Include "pro tips" and lesser-known features for competitive advantage  
- Explain WHY each flag matters, not just what it does
- Show real-world scenarios and common use cases

RESPOND WITH ONLY VALID JSON (no other text):
{
  "snippets": [
    {
      "title": "docker ps",
      "description": "docker ps is like checking your computer's task manager to see what programs are running - but for containers. Instead of seeing applications like Chrome or VS Code, you see which containerized services are currently active on your system. This command is essential for monitoring your Docker environment, debugging issues, and understanding what's consuming your system resources.",
      "categories": ["docker", "monitoring", "containers"],
      "fragments": [
        {
          "file_name": "docker-ps-mastery.sh",
          "code": "# Basic command - show running containers\\ndocker ps\\n\\n# Show ALL containers (running + stopped)\\n# -a flag reveals the full picture\\ndocker ps -a\\n\\n# PRO TIP: Custom formatting for specific info\\n# Most people don't know about --format\\ndocker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'\\n\\n# Get only container IDs (perfect for scripting)\\n# -q flag = 'quiet' mode\\ndocker ps -q\\n\\n# ADVANCED: Filter by status\\ndocker ps --filter 'status=running'\\ndocker ps --filter 'status=exited'\\n\\n# POWER USER: Show last N containers\\ndocker ps -n 5\\n\\n# NINJA TECHNIQUE: Watch containers in real-time\\nwatch -n 2 'docker ps'",
          "language": "bash",
          "position": 0
        }
      ]
    }
  ]
}

Make each snippet a mini-masterclass on that specific command with practical insights users can immediately apply.`;
  }

  /**
   * Extract JSON from Claude's response (handles conversational responses)
   */
  extractJSON(responseText) {
    try {
      // Strategy 1: Look for JSON code blocks
      const codeBlockMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        return JSON.parse(codeBlockMatch[1]);
      }

      // Strategy 2: Find the largest JSON object
      const jsonMatches = responseText.match(/\{[\s\S]*\}/g);
      if (jsonMatches) {
        const validJsons = jsonMatches
          .map(match => {
            try { 
              return JSON.parse(match); 
            } catch { 
              return null; 
            }
          })
          .filter(Boolean);

        if (validJsons.length > 0) {
          // Return the largest valid JSON (most likely to be complete)
          return validJsons.reduce((largest, current) => 
            JSON.stringify(current).length > JSON.stringify(largest).length 
              ? current : largest
          );
        }
      }

      throw new Error('No valid JSON found in Claude response');
    } catch (error) {
      console.error('JSON extraction failed:', error);
      throw new Error(`Failed to parse Claude response: ${error.message}`);
    }
  }

  /**
   * Validate the AI-generated snippet structure
   */
  validateSnippetStructure(snippet) {
    const errors = [];

    if (!snippet.title || typeof snippet.title !== 'string') {
      errors.push('Title is required and must be a string');
    }
    if (snippet.title && snippet.title.length > 60) {
      errors.push('Title must be 60 characters or less');
    }
    if (!snippet.description || typeof snippet.description !== 'string') {
      errors.push('Description is required and must be a string');
    }
    if (!Array.isArray(snippet.categories)) {
      errors.push('Categories must be an array');
    }
    if (snippet.categories && snippet.categories.length > 3) {
      errors.push('Maximum 3 categories allowed');
    }
    if (!Array.isArray(snippet.fragments) || snippet.fragments.length === 0) {
      errors.push('At least one fragment is required');
    }

    // Validate fragments
    if (snippet.fragments) {
      snippet.fragments.forEach((fragment, index) => {
        if (!fragment.file_name || typeof fragment.file_name !== 'string') {
          errors.push(`Fragment ${index + 1}: file_name is required`);
        }
        if (!fragment.code || typeof fragment.code !== 'string') {
          errors.push(`Fragment ${index + 1}: code is required`);
        }
        if (!fragment.language || typeof fragment.language !== 'string') {
          errors.push(`Fragment ${index + 1}: language is required`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Clean and validate snippets from AI response
   */
  cleanAndValidateSnippets(snippets) {
    if (!Array.isArray(snippets)) {
      throw new Error('Snippets must be an array');
    }

    const validSnippets = [];
    const errors = [];

    snippets.forEach((snippet, index) => {
      // Auto-fix: Limit categories to maximum 3 if exceeded
      if (snippet.categories && snippet.categories.length > 3) {
        console.log(`⚠️ Snippet ${index} has ${snippet.categories.length} categories, trimming to 3`);
        snippet.categories = snippet.categories.slice(0, 3);
      }

      // Auto-fix: Trim title if it exceeds 60 characters
      if (snippet.title && snippet.title.length > 60) {
        console.log(`⚠️ Snippet ${index} title is ${snippet.title.length} chars, trimming to 60`);
        snippet.title = snippet.title.substring(0, 57) + '...';
      }

      const validation = this.validateSnippetStructure(snippet);
      
      if (validation.isValid) {
        // Clean up the snippet
        const cleanSnippet = {
          title: snippet.title.trim(),
          description: snippet.description.trim(),
          categories: snippet.categories.map(cat => cat.trim().toLowerCase()),
          isPublic: false, // Default to private
          locked: false,   // Default to unlocked
          fragments: snippet.fragments.map((fragment, fragIndex) => ({
            file_name: fragment.file_name.trim(),
            code: fragment.code.trim(),
            language: fragment.language.trim().toLowerCase(),
            position: fragIndex
          }))
        };
        validSnippets.push(cleanSnippet);
      } else {
        errors.push({
          snippetIndex: index,
          errors: validation.errors
        });
      }
    });

    return {
      validSnippets,
      errors
    };
  }

  /**
   * Analyze commands using Claude API
   */
  async analyzeCommands(commands, options = {}) {
    console.log('🔍 analyzeCommands called with:', {
      commands: Array.isArray(commands) ? commands.length : 1,
      commandsType: typeof commands,
      options
    });

    try {
      // Initialize client with current API key
      console.log('🔍 Initializing Claude client...');
      await this.initializeClient();
      console.log('🔍 Claude client initialized successfully');

      const prompt = this.buildAnalysisPrompt(commands, options);
      console.log('🔍 Built prompt, length:', prompt.length);
      
      console.log('🤖 Sending commands to Claude for analysis...');
      console.log(`Commands: ${Array.isArray(commands) ? commands.length : 1} command(s)`);

      const startTime = Date.now();
      
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const processingTime = Date.now() - startTime;
      console.log(`✅ Claude analysis completed in ${processingTime}ms`);

      // Extract and validate the response
      const responseText = response.content[0]?.text;
      if (!responseText) {
        throw new Error('Empty response from Claude API');
      }

      console.log('🔍 Claude raw response (first 500 chars):', responseText.substring(0, 500));

      const extractedData = this.extractJSON(responseText);
      console.log('🔍 Extracted data:', JSON.stringify(extractedData, null, 2));
      
      const validationResult = this.cleanAndValidateSnippets(extractedData.snippets || []);
      console.log('🔍 Validation result:', JSON.stringify({
        validCount: validationResult.validSnippets.length,
        errorCount: validationResult.errors.length,
        errors: validationResult.errors
      }, null, 2));

      const analysisResult = {
        analysisId: this.generateAnalysisId(),
        timestamp: new Date().toISOString(),
        model: this.model,
        tokensUsed: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
          total: response.usage.input_tokens + response.usage.output_tokens
        },
        costEstimate: this.calculateCost(response.usage),
        processingTimeMs: processingTime,
        rawResponse: responseText,
        extractedData,
        validSnippets: validationResult.validSnippets,
        validationErrors: validationResult.errors,
        success: validationResult.validSnippets.length > 0
      };

      return analysisResult;

    } catch (error) {
      console.error('❌ Claude analysis failed:', error);
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  /**
   * Calculate estimated cost for API usage
   */
  calculateCost(usage) {
    // Claude Sonnet pricing (as of 2025): $3 per 1M input tokens, $15 per 1M output tokens
    const inputCost = (usage.input_tokens / 1000000) * 3.00;
    const outputCost = (usage.output_tokens / 1000000) * 15.00;
    return {
      input: inputCost,
      output: outputCost,
      total: inputCost + outputCost
    };
  }

  /**
   * Get model information and health status
   */
  async getHealthStatus() {
    try {
      const apiKey = await this.getClaudeApiKey();
      const isConfigured = !!apiKey;
      
      return {
        configured: isConfigured,
        model: this.model,
        temperature: this.temperature,
        maxTokens: this.maxTokens,
        status: isConfigured ? 'ready' : 'not_configured'
      };
    } catch (error) {
      return {
        configured: false,
        status: 'error',
        error: error.message
      };
    }
  }
}

export default AIAnalysisService; 