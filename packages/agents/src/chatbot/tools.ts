import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";

export const chatbotTools: Tool[] = [
  {
    name: "build_knowledge_base",
    description:
      "Builds the chatbot knowledge base from the client's website and business info. Extracts FAQs, business information (hours, address, phone, email), services with prices, and policies.",
    input_schema: {
      type: "object" as const,
      properties: {
        businessName: {
          type: "string",
          description: "Name of the business",
        },
        sector: {
          type: "string",
          description: "Business sector (restaurant, dental, legal, etc.)",
        },
        language: {
          type: "string",
          description: "Language for the knowledge base (it, de, en, fr, etc.)",
        },
        city: {
          type: "string",
          description: "City where the business is located",
        },
        websiteContent: {
          type: "string",
          description: "Text content extracted from the business website pages",
        },
        faqs: {
          type: "array",
          description: "Generated FAQ entries",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              answer: { type: "string" },
              category: { type: "string" },
            },
            required: ["question", "answer"],
          },
        },
        businessInfo: {
          type: "object",
          description: "Structured business information",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            address: { type: "string" },
            phone: { type: "string" },
            email: { type: "string" },
            hours: { type: "string" },
            website: { type: "string" },
          },
          required: ["name", "description"],
        },
        services: {
          type: "array",
          description: "List of services offered by the business",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              price: { type: "string" },
            },
            required: ["name", "description"],
          },
        },
        policies: {
          type: "array",
          description: "Business policies (cancellation, returns, etc.)",
          items: { type: "string" },
        },
      },
      required: ["businessName", "sector", "language", "businessInfo", "faqs", "services"],
    },
  },

  {
    name: "train_on_reviews",
    description:
      "Enriches the knowledge base using review insights. Extracts recurring positive themes, implicit customer questions, and customer expectations from reviews.",
    input_schema: {
      type: "object" as const,
      properties: {
        reviews: {
          type: "array",
          description: "Top reviews from Google or other platforms",
          items: {
            type: "object",
            properties: {
              text: { type: "string" },
              rating: { type: "number" },
              author: { type: "string" },
            },
            required: ["text", "rating"],
          },
        },
        positiveThemes: {
          type: "array",
          description: "Recurring positive themes extracted from reviews",
          items: { type: "string" },
        },
        implicitQuestions: {
          type: "array",
          description: "Questions that reviewers imply but don't ask directly",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              answer: { type: "string" },
            },
            required: ["question", "answer"],
          },
        },
        customerExpectations: {
          type: "array",
          description: "Key expectations that customers have for this business",
          items: { type: "string" },
        },
      },
      required: ["reviews"],
    },
  },

  {
    name: "generate_persona",
    description:
      "Generates the chatbot personality based on the business sector and brand. Creates a name, tone, greeting phrases, and fallback messages adapted to the business context.",
    input_schema: {
      type: "object" as const,
      properties: {
        businessName: {
          type: "string",
          description: "Name of the business",
        },
        sector: {
          type: "string",
          description: "Business sector to determine appropriate tone",
        },
        language: {
          type: "string",
          description: "Language for all persona messages",
        },
        personaName: {
          type: "string",
          description: "Suggested name for the chatbot persona",
        },
        tone: {
          type: "string",
          enum: ["professional", "friendly", "casual", "formal", "warm", "energetic"],
          description: "Tone appropriate for the sector",
        },
        greeting: {
          type: "string",
          description: "Opening greeting message in the business language",
        },
        fallbackMessage: {
          type: "string",
          description: "Message when the chatbot cannot answer a question",
        },
        openingPhrases: {
          type: "array",
          description: "Alternative opening phrases for variety",
          items: { type: "string" },
        },
      },
      required: ["businessName", "sector", "language", "personaName", "tone", "greeting", "fallbackMessage"],
    },
  },

  {
    name: "test_chatbot",
    description:
      "Tests the chatbot with 5 sector-typical questions. Evaluates response quality from 1-10 and suggests improvements if score < 7.",
    input_schema: {
      type: "object" as const,
      properties: {
        sector: {
          type: "string",
          description: "Business sector to select relevant test questions",
        },
        language: {
          type: "string",
          description: "Language for test questions",
        },
        testQuestions: {
          type: "array",
          description: "List of test questions for the chatbot",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              expectedTheme: { type: "string" },
            },
            required: ["question"],
          },
        },
        results: {
          type: "array",
          description: "Test results with scores",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              response: { type: "string" },
              score: { type: "number" },
              feedback: { type: "string" },
            },
            required: ["question", "response", "score"],
          },
        },
        avgScore: {
          type: "number",
          description: "Average quality score across all test questions",
        },
        needsImprovement: {
          type: "boolean",
          description: "True if avgScore < 7 and knowledge base needs enhancement",
        },
        improvements: {
          type: "array",
          description: "Suggested improvements to the knowledge base",
          items: { type: "string" },
        },
      },
      required: ["sector", "language", "testQuestions", "results", "avgScore"],
    },
  },

  {
    name: "activate_widget",
    description:
      "Activates the chatbot widget. Updates the ClientChatbot record in the database (isActive=true), generates the HTML embed snippet, and returns the installation code.",
    input_schema: {
      type: "object" as const,
      properties: {
        clientId: {
          type: "string",
          description: "Client ID in the database",
        },
        chatbotId: {
          type: "string",
          description: "Existing chatbot ID to update, if any",
        },
        chatbotName: {
          type: "string",
          description: "Display name for the chatbot",
        },
        knowledgeBase: {
          type: "object",
          description: "Complete knowledge base JSON",
        },
        persona: {
          type: "object",
          description: "Chatbot persona configuration",
        },
        widgetConfig: {
          type: "object",
          description: "Widget visual configuration",
        },
        activateImmediately: {
          type: "boolean",
          description: "Whether to set isActive=true immediately",
        },
      },
      required: ["clientId", "chatbotName", "knowledgeBase", "persona", "widgetConfig"],
    },
  },
];
