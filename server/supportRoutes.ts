import type { Express, Request, Response } from "express";
import { db } from "./db";
import { eq, desc, and, sql, ilike, or } from "drizzle-orm";
import { 
  supportConversations, 
  supportMessages, 
  supportTickets, 
  knowledgeBase,
  customers 
} from "@shared/schema";
import OpenAI from "openai";
import { nanoid } from "nanoid";

interface AdminAuthRequest extends Request {
  adminId?: number;
  admin?: { id: number; email: string; role: string };
}

const adminAuth = async (req: AdminAuthRequest, res: Response, next: Function) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Admin authentication required" });
    }

    const token = authHeader.substring(7);
    
    if (token && token.length > 10) {
      req.adminId = 1;
      req.admin = { id: 1, email: 'admin@eatoff.com', role: 'super_admin' };
      next();
    } else {
      return res.status(401).json({ message: "Invalid or expired session" });
    }
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
};

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const ESCALATION_KEYWORDS = [
  "refund", "rambursare", "banii înapoi", "money back",
  "payment failed", "plată eșuată", "charged twice", "taxat de două ori",
  "cancel subscription", "anulare abonament",
  "account hacked", "cont spart", "security", "securitate",
  "legal", "lawyer", "avocat", "sue", "proces",
  "speak to human", "human agent", "operator", "agent real",
  "complaint", "reclamație", "manager", "supervisor"
];

const SUPPORT_SYSTEM_PROMPT = `You are EatOff's friendly AI support assistant. You help users with:
- Voucher purchases, usage, and expiration questions
- Payment and wallet issues
- Restaurant recommendations and navigation
- Account settings and profile management
- Loyalty points and rewards

Guidelines:
1. Be helpful, concise, and friendly. Use a warm, professional tone.
2. If you don't know something specific about a user's account, ask clarifying questions.
3. For payment issues, refunds, or security concerns, acknowledge you'll escalate to a human agent.
4. Support Romanian and English - respond in the same language the user uses.
5. Keep responses under 200 words unless explaining complex processes.
6. When providing steps, use numbered lists for clarity.
7. Never make up information about specific transactions or vouchers - ask for details.

Important: You cannot process refunds, modify payments, or access sensitive account data directly.
For these requests, create a support ticket for human review.`;

async function searchKnowledgeBase(query: string): Promise<string[]> {
  const results = await db.select()
    .from(knowledgeBase)
    .where(
      and(
        eq(knowledgeBase.isActiveForAI, true),
        or(
          ilike(knowledgeBase.title, `%${query}%`),
          ilike(knowledgeBase.content, `%${query}%`)
        )
      )
    )
    .limit(3);
  
  return results.map(r => `[${r.category}] ${r.title}: ${r.content}`);
}

function shouldEscalate(message: string): { escalate: boolean; reason?: string } {
  const lowerMessage = message.toLowerCase();
  
  for (const keyword of ESCALATION_KEYWORDS) {
    if (lowerMessage.includes(keyword.toLowerCase())) {
      return { 
        escalate: true, 
        reason: `User mentioned: "${keyword}"` 
      };
    }
  }
  
  return { escalate: false };
}

async function buildSupportBundle(customerId: number) {
  const [customer] = await db.select().from(customers).where(eq(customers.id, customerId));
  
  if (!customer) return null;
  
  return {
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      membershipTier: customer.membershipTier,
      loyaltyPoints: customer.loyaltyPoints,
      createdAt: customer.createdAt
    },
    generatedAt: new Date().toISOString()
  };
}

export function registerSupportRoutes(app: Express) {
  
  app.get("/api/support/conversations", async (req: Request, res: Response) => {
    try {
      const customerId = (req as any).session?.customerId;
      if (!customerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const conversations = await db.select()
        .from(supportConversations)
        .where(eq(supportConversations.customerId, customerId))
        .orderBy(desc(supportConversations.updatedAt));
      
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/support/conversations/:id", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const customerId = (req as any).session?.customerId;
      
      if (!customerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const [conversation] = await db.select()
        .from(supportConversations)
        .where(
          and(
            eq(supportConversations.id, conversationId),
            eq(supportConversations.customerId, customerId)
          )
        );
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      const messages = await db.select()
        .from(supportMessages)
        .where(eq(supportMessages.conversationId, conversationId))
        .orderBy(supportMessages.createdAt);
      
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  app.post("/api/support/conversations", async (req: Request, res: Response) => {
    try {
      const customerId = (req as any).session?.customerId;
      if (!customerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const [conversation] = await db.insert(supportConversations)
        .values({
          customerId,
          status: "active",
          channel: "chat",
          isHandledByAI: true
        })
        .returning();
      
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.post("/api/support/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;
      const customerId = (req as any).session?.customerId;
      
      if (!customerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      if (!content?.trim()) {
        return res.status(400).json({ error: "Message content is required" });
      }
      
      const [conversation] = await db.select()
        .from(supportConversations)
        .where(
          and(
            eq(supportConversations.id, conversationId),
            eq(supportConversations.customerId, customerId)
          )
        );
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      await db.insert(supportMessages).values({
        conversationId,
        role: "user",
        content: content.trim()
      });
      
      const escalationCheck = shouldEscalate(content);
      
      if (escalationCheck.escalate && conversation.status !== "escalated") {
        const ticketNumber = `TKT-${new Date().getFullYear()}-${nanoid(6).toUpperCase()}`;
        const bundle = await buildSupportBundle(customerId);
        
        await db.insert(supportTickets).values({
          conversationId,
          customerId,
          ticketNumber,
          subject: `Support request: ${content.substring(0, 50)}...`,
          description: content,
          category: "general",
          priority: "medium",
          supportBundle: bundle
        });
        
        await db.update(supportConversations)
          .set({ 
            status: "escalated",
            escalatedAt: new Date(),
            escalationReason: escalationCheck.reason,
            isHandledByAI: false
          })
          .where(eq(supportConversations.id, conversationId));
        
        const escalationMessage = `Am înțeles că ai nevoie de ajutor cu această problemă. Am creat un ticket de suport (${ticketNumber}) și un agent real va răspunde în cel mai scurt timp. Între timp, pot să te ajut cu altceva?`;
        
        await db.insert(supportMessages).values({
          conversationId,
          role: "assistant",
          content: escalationMessage
        });
        
        return res.json({
          message: escalationMessage,
          escalated: true,
          ticketNumber
        });
      }
      
      const previousMessages = await db.select()
        .from(supportMessages)
        .where(eq(supportMessages.conversationId, conversationId))
        .orderBy(supportMessages.createdAt)
        .limit(10);
      
      const knowledgeResults = await searchKnowledgeBase(content);
      
      let systemPrompt = SUPPORT_SYSTEM_PROMPT;
      if (knowledgeResults.length > 0) {
        systemPrompt += `\n\nRelevant knowledge base articles:\n${knowledgeResults.join('\n\n')}`;
      }
      
      const chatMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: systemPrompt },
        ...previousMessages.map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content
        }))
      ];
      
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      
      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: chatMessages,
        stream: true,
        max_tokens: 500
      });
      
      let fullResponse = "";
      
      for await (const chunk of stream) {
        const chunkContent = chunk.choices[0]?.delta?.content || "";
        if (chunkContent) {
          fullResponse += chunkContent;
          res.write(`data: ${JSON.stringify({ content: chunkContent })}\n\n`);
        }
      }
      
      await db.insert(supportMessages).values({
        conversationId,
        role: "assistant",
        content: fullResponse,
        ragSourceIds: knowledgeResults.length > 0 ? ["kb_search"] : undefined,
        aiModelVersion: "gpt-4o-mini"
      });
      
      if (!conversation.title && fullResponse.length > 0) {
        const title = content.substring(0, 50) + (content.length > 50 ? "..." : "");
        await db.update(supportConversations)
          .set({ title })
          .where(eq(supportConversations.id, conversationId));
      }
      
      await db.update(supportConversations)
        .set({ lastMessageAt: new Date(), updatedAt: new Date() })
        .where(eq(supportConversations.id, conversationId));
      
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      
    } catch (error) {
      console.error("Error sending message:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to send message" });
      } else {
        res.write(`data: ${JSON.stringify({ error: "Failed to process message" })}\n\n`);
        res.end();
      }
    }
  });

  app.get("/api/support/tickets", async (req: Request, res: Response) => {
    try {
      const customerId = (req as any).session?.customerId;
      if (!customerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const tickets = await db.select()
        .from(supportTickets)
        .where(eq(supportTickets.customerId, customerId))
        .orderBy(desc(supportTickets.createdAt));
      
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ error: "Failed to fetch tickets" });
    }
  });

  app.get("/api/help/articles", async (req: Request, res: Response) => {
    try {
      const { category } = req.query;
      
      let query = db.select({
        id: knowledgeBase.id,
        title: knowledgeBase.title,
        content: knowledgeBase.content,
        category: knowledgeBase.category,
        subcategory: knowledgeBase.subcategory,
        viewCount: knowledgeBase.viewCount,
        helpfulCount: knowledgeBase.helpfulCount
      }).from(knowledgeBase)
        .where(eq(knowledgeBase.isPublic, true));
      
      if (category && typeof category === 'string') {
        query = db.select({
          id: knowledgeBase.id,
          title: knowledgeBase.title,
          content: knowledgeBase.content,
          category: knowledgeBase.category,
          subcategory: knowledgeBase.subcategory,
          viewCount: knowledgeBase.viewCount,
          helpfulCount: knowledgeBase.helpfulCount
        }).from(knowledgeBase)
          .where(
            and(
              eq(knowledgeBase.isPublic, true),
              eq(knowledgeBase.category, category)
            )
          );
      }
      
      const articles = await query;
      res.json(articles);
    } catch (error) {
      console.error("Error fetching help articles:", error);
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

  app.get("/api/help/articles/:id", async (req: Request, res: Response) => {
    try {
      const articleId = parseInt(req.params.id);
      
      const [article] = await db.select()
        .from(knowledgeBase)
        .where(
          and(
            eq(knowledgeBase.id, articleId),
            eq(knowledgeBase.isPublic, true)
          )
        );
      
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      
      await db.update(knowledgeBase)
        .set({ viewCount: (article.viewCount || 0) + 1 })
        .where(eq(knowledgeBase.id, articleId));
      
      res.json(article);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });

  app.post("/api/help/articles/:id/feedback", async (req: Request, res: Response) => {
    try {
      const articleId = parseInt(req.params.id);
      const { helpful } = req.body;
      
      const [article] = await db.select()
        .from(knowledgeBase)
        .where(eq(knowledgeBase.id, articleId));
      
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      
      if (helpful) {
        await db.update(knowledgeBase)
          .set({ helpfulCount: (article.helpfulCount || 0) + 1 })
          .where(eq(knowledgeBase.id, articleId));
      } else {
        await db.update(knowledgeBase)
          .set({ notHelpfulCount: (article.notHelpfulCount || 0) + 1 })
          .where(eq(knowledgeBase.id, articleId));
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      res.status(500).json({ error: "Failed to submit feedback" });
    }
  });

  app.post("/api/support/conversations/:id/resolve", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const customerId = (req as any).session?.customerId;
      const { rating, feedback } = req.body;
      
      if (!customerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const [conversation] = await db.select()
        .from(supportConversations)
        .where(
          and(
            eq(supportConversations.id, conversationId),
            eq(supportConversations.customerId, customerId)
          )
        );
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      await db.update(supportConversations)
        .set({ 
          status: "resolved",
          resolvedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(supportConversations.id, conversationId));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error resolving conversation:", error);
      res.status(500).json({ error: "Failed to resolve conversation" });
    }
  });

  // ==========================================
  // Admin Helpdesk Endpoints
  // ==========================================

  app.get("/api/admin/support/tickets", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const { status, priority, category } = req.query;
      
      let tickets = await db.select({
        ticket: supportTickets,
        customer: {
          id: customers.id,
          name: customers.name,
          email: customers.email
        }
      })
        .from(supportTickets)
        .leftJoin(customers, eq(supportTickets.customerId, customers.id))
        .orderBy(desc(supportTickets.createdAt));
      
      let result = tickets.map(t => ({
        ...t.ticket,
        customer: t.customer
      }));
      
      if (status && status !== 'all') {
        result = result.filter(t => t.status === status);
      }
      if (priority && priority !== 'all') {
        result = result.filter(t => t.priority === priority);
      }
      if (category && category !== 'all') {
        result = result.filter(t => t.category === category);
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching admin tickets:", error);
      res.status(500).json({ error: "Failed to fetch tickets" });
    }
  });

  app.get("/api/admin/support/tickets/:id", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const ticketId = parseInt(req.params.id);
      
      const [ticket] = await db.select({
        ticket: supportTickets,
        customer: {
          id: customers.id,
          name: customers.name,
          email: customers.email
        }
      })
        .from(supportTickets)
        .leftJoin(customers, eq(supportTickets.customerId, customers.id))
        .where(eq(supportTickets.id, ticketId));
      
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      
      let messages: any[] = [];
      if (ticket.ticket.conversationId) {
        messages = await db.select()
          .from(supportMessages)
          .where(eq(supportMessages.conversationId, ticket.ticket.conversationId))
          .orderBy(supportMessages.createdAt);
      }
      
      res.json({
        ...ticket.ticket,
        customer: ticket.customer,
        messages
      });
    } catch (error) {
      console.error("Error fetching ticket:", error);
      res.status(500).json({ error: "Failed to fetch ticket" });
    }
  });

  app.patch("/api/admin/support/tickets/:id", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const ticketId = parseInt(req.params.id);
      const { status, priority, assignedAgentId, resolution } = req.body;
      
      const updates: any = { updatedAt: new Date() };
      
      if (status) updates.status = status;
      if (priority) updates.priority = priority;
      if (assignedAgentId !== undefined) {
        updates.assignedAgentId = assignedAgentId;
        updates.assignedAt = new Date();
      }
      if (resolution) {
        updates.resolution = resolution;
        updates.resolvedAt = new Date();
        updates.status = "resolved";
      }
      
      const [updated] = await db.update(supportTickets)
        .set(updates)
        .where(eq(supportTickets.id, ticketId))
        .returning();
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating ticket:", error);
      res.status(500).json({ error: "Failed to update ticket" });
    }
  });

  app.post("/api/admin/support/tickets/:id/reply", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const ticketId = parseInt(req.params.id);
      const { content } = req.body;
      
      const [ticket] = await db.select()
        .from(supportTickets)
        .where(eq(supportTickets.id, ticketId));
      
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      
      if (!ticket.conversationId) {
        return res.status(400).json({ error: "No conversation associated with this ticket" });
      }
      
      const [message] = await db.insert(supportMessages)
        .values({
          conversationId: ticket.conversationId,
          role: "agent",
          content
        })
        .returning();
      
      await db.update(supportConversations)
        .set({ lastMessageAt: new Date(), updatedAt: new Date() })
        .where(eq(supportConversations.id, ticket.conversationId));
      
      res.json(message);
    } catch (error) {
      console.error("Error replying to ticket:", error);
      res.status(500).json({ error: "Failed to send reply" });
    }
  });

  app.get("/api/admin/support/stats", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const [openTickets] = await db.select({ count: sql<number>`count(*)::int` })
        .from(supportTickets)
        .where(eq(supportTickets.status, "open"));
      
      const [inProgressTickets] = await db.select({ count: sql<number>`count(*)::int` })
        .from(supportTickets)
        .where(eq(supportTickets.status, "in_progress"));
      
      const [resolvedToday] = await db.select({ count: sql<number>`count(*)::int` })
        .from(supportTickets)
        .where(
          and(
            eq(supportTickets.status, "resolved"),
            sql`DATE(${supportTickets.resolvedAt}) = CURRENT_DATE`
          )
        );
      
      const [totalConversations] = await db.select({ count: sql<number>`count(*)::int` })
        .from(supportConversations);
      
      const [aiHandled] = await db.select({ count: sql<number>`count(*)::int` })
        .from(supportConversations)
        .where(
          and(
            eq(supportConversations.isHandledByAI, true),
            eq(supportConversations.status, "resolved")
          )
        );
      
      const totalResolved = (aiHandled?.count || 0);
      const deflectionRate = (totalConversations?.count || 0) > 0 
        ? Math.round((totalResolved / (totalConversations?.count || 1)) * 100)
        : 0;
      
      res.json({
        openTickets: openTickets?.count || 0,
        inProgressTickets: inProgressTickets?.count || 0,
        resolvedToday: resolvedToday?.count || 0,
        totalConversations: totalConversations?.count || 0,
        deflectionRate
      });
    } catch (error) {
      console.error("Error fetching support stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Knowledge Base Management
  app.get("/api/admin/knowledge-base", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const articles = await db.select()
        .from(knowledgeBase)
        .orderBy(desc(knowledgeBase.updatedAt));
      
      res.json(articles);
    } catch (error) {
      console.error("Error fetching knowledge base:", error);
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

  app.post("/api/admin/knowledge-base", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const { title, content, category, subcategory, keywords, isPublic, isActiveForAI } = req.body;
      
      const [article] = await db.insert(knowledgeBase)
        .values({
          title,
          content,
          category,
          subcategory,
          keywords,
          isPublic: isPublic ?? true,
          isActiveForAI: isActiveForAI ?? true
        })
        .returning();
      
      res.status(201).json(article);
    } catch (error) {
      console.error("Error creating article:", error);
      res.status(500).json({ error: "Failed to create article" });
    }
  });

  app.patch("/api/admin/knowledge-base/:id", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const articleId = parseInt(req.params.id);
      const { title, content, category, subcategory, keywords, isPublic, isActiveForAI } = req.body;
      
      const [updated] = await db.update(knowledgeBase)
        .set({
          title,
          content,
          category,
          subcategory,
          keywords,
          isPublic,
          isActiveForAI,
          updatedAt: new Date()
        })
        .where(eq(knowledgeBase.id, articleId))
        .returning();
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating article:", error);
      res.status(500).json({ error: "Failed to update article" });
    }
  });

  app.delete("/api/admin/knowledge-base/:id", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const articleId = parseInt(req.params.id);
      
      await db.delete(knowledgeBase)
        .where(eq(knowledgeBase.id, articleId));
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting article:", error);
      res.status(500).json({ error: "Failed to delete article" });
    }
  });
}
