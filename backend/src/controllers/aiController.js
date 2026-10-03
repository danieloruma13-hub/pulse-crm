const { generateText, generateWithTools } = require('../utils/geminiClient');
const leadModel = require('../models/leadModel');
const dealModel = require('../models/dealModel');
const contactModel = require('../models/contactModel');
const taskModel = require('../models/taskModel');
const eventModel = require('../models/eventModel');
const campaignModel = require('../models/campaignModel');
const chatMessageModel = require('../models/chatMessageModel');
const { sendEmail } = require('../utils/email');
const { AppError } = require('../middleware/errorHandler');

async function summarizeLeads(req, res, next) {
  try {
    const leads = await leadModel.allByUser(req.user.id);
    if (leads.length === 0) {
      return res.json({ success: true, summary: 'No leads yet — nothing to summarize.' });
    }
    const leadLines = leads.slice(0, 30).map((l) => `- ${l.name} (${l.company || 'no company'}), status: ${l.status}, stage: ${l.stage}, score: ${l.score}`).join('\n');
    const summary = await generateText({
      systemInstruction: 'You are a CRM assistant. Summarize the sales lead list concisely for a busy sales rep. Highlight the hottest leads (high score, later stage) and flag anything stale. Keep it under 150 words. Use plain text, no markdown headers.',
      prompt: `Here are the current leads:\n${leadLines}`,
    });
    res.json({ success: true, summary, leadCount: leads.length });
  } catch (err) { next(err); }
}

async function generateFollowUpEmail(req, res, next) {
  try {
    const { contactId, leadId, tone = 'professional', context = '' } = req.body;
    if (!contactId && !leadId) throw new AppError('contactId or leadId is required', 400);
    let name = 'there';
    let company = '';
    if (contactId) {
      const contact = await contactModel.findById(contactId);
      if (!contact || contact.userId !== req.user.id) throw new AppError('Contact not found', 404);
      name = contact.name; company = contact.company;
    } else {
      const lead = await leadModel.findById(leadId);
      if (!lead || lead.userId !== req.user.id) throw new AppError('Lead not found', 404);
      name = lead.name; company = lead.company;
    }
    const email = await generateText({
      systemInstruction: `You are a sales rep writing a short follow-up email. Tone: ${tone}. Include a subject line on the first line prefixed with "Subject:", then a blank line, then the email body. Keep the body under 120 words. No placeholders like [Your Name] left unfilled — sign off simply as "Best" without a name.`,
      prompt: `Write a follow-up email to ${name}${company ? ` at ${company}` : ''}. Additional context from the sales rep: ${context || 'No additional context provided, write a general check-in.'}`,
      temperature: 0.8,
    });
    res.json({ success: true, email });
  } catch (err) { next(err); }
}

async function analyzeConversation(req, res, next) {
  try {
    const { transcript } = req.body;
    if (!transcript) throw new AppError('transcript is required', 400);
    const analysis = await generateText({
      systemInstruction: 'You are a CRM assistant analyzing a sales conversation transcript. Return: 1) a one-sentence summary, 2) the customer sentiment (positive/neutral/negative), 3) any objections raised, 4) a recommended next step. Keep the whole response under 120 words, plain text.',
      prompt: transcript,
    });
    res.json({ success: true, analysis });
  } catch (err) { next(err); }
}

async function predictDealSuccess(req, res, next) {
  try {
    const { dealId } = req.params;
    const deal = await dealModel.findById(dealId);
    if (!deal || deal.userId !== req.user.id) throw new AppError('Deal not found', 404);
    const prediction = await generateText({
      systemInstruction: 'You are a sales forecasting assistant. Given a deal stage, value, and probability, give a brief (under 60 words) assessment of its likelihood to close and one suggestion to improve its odds. Plain text, no markdown.',
      prompt: `Deal: "${deal.title}", stage: ${deal.stage}, value: ${deal.value} ${deal.currency}, current probability: ${deal.probability}%, close date: ${deal.closeDate || 'not set'}.`,
    });
    res.json({ success: true, dealId: deal.id, prediction });
  } catch (err) { next(err); }
}

async function recommendNextActions(req, res, next) {
  try {
    const userId = req.user.id;
    const [leads, deals, tasks] = await Promise.all([leadModel.allByUser(userId), dealModel.allByUser(userId), taskModel.allByUser(userId)]);
    const openDeals = deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost');
    const hotLeads = leads.filter((l) => l.score >= 70 && l.status !== 'converted');
    const overdueTasks = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed' && t.status !== 'cancelled');
    const context = `Open deals: ${openDeals.length}. High-score leads not yet converted: ${hotLeads.length}. Overdue tasks: ${overdueTasks.length}.\nTop hot leads: ${hotLeads.slice(0, 5).map((l) => l.name).join(', ') || 'none'}.\nTop open deals: ${openDeals.slice(0, 5).map((d) => `${d.title} (${d.stage})`).join(', ') || 'none'}.`;
    const recommendations = await generateText({
      systemInstruction: 'You are a CRM assistant. Based on the pipeline snapshot, give 3 prioritized, specific next actions for the sales rep today. Number them 1-3. Keep each under 20 words. Plain text.',
      prompt: context,
    });
    res.json({ success: true, recommendations });
  } catch (err) { next(err); }
}

async function buildPipelineSnapshot(userId) {
  const [leads, deals, contacts, tasks] = await Promise.all([leadModel.allByUser(userId), dealModel.allByUser(userId), contactModel.allByUser(userId), taskModel.allByUser(userId)]);
  if (leads.length === 0 && deals.length === 0 && contacts.length === 0 && tasks.length === 0) {
    return 'This user has no CRM data yet — no leads, deals, contacts, or tasks.';
  }
  const openDeals = deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost');
  const wonDeals = deals.filter((d) => d.stage === 'won');
  const revenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
  const pendingTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  return `Live CRM snapshot for this user:
- Contacts: ${contacts.length} total. ${contacts.slice(0, 20).map((c) => `${c.name}${c.company ? ` (${c.company})` : ''}${c.email ? ` <${c.email}>` : ''}`).join('; ') || 'none'}
- Leads: ${leads.length} total. ${leads.slice(0, 20).map((l) => `${l.name} (${l.company || 'no company'}, stage: ${l.stage}, score: ${l.score})`).join('; ') || 'none'}
- Deals: ${deals.length} total, ${openDeals.length} open, ${wonDeals.length} won. Revenue to date: $${revenue}.
- Open deals: ${openDeals.slice(0, 10).map((d) => `${d.title} (${d.stage}, $${d.value})`).join('; ') || 'none'}
- Pending tasks: ${pendingTasks.length}. ${pendingTasks.slice(0, 10).map((t) => t.title).join('; ') || 'none'}`;
}

const TOOLS = [{
  functionDeclarations: [
    { name: 'search_contacts', description: 'Search the CRM contacts by name to find their ID. Always use this before updating, deleting, or emailing a contact by name.', parameters: { type: 'OBJECT', properties: { query: { type: 'STRING', description: 'Name or partial name to search for' } }, required: ['query'] } },
    { name: 'create_contact', description: 'Create a new contact.', parameters: { type: 'OBJECT', properties: { name: { type: 'STRING' }, email: { type: 'STRING' }, phone: { type: 'STRING' }, company: { type: 'STRING' }, notes: { type: 'STRING' } }, required: ['name'] } },
    { name: 'update_contact', description: 'Update fields on an existing contact by ID.', parameters: { type: 'OBJECT', properties: { contactId: { type: 'INTEGER' }, name: { type: 'STRING' }, email: { type: 'STRING' }, phone: { type: 'STRING' }, company: { type: 'STRING' }, notes: { type: 'STRING' } }, required: ['contactId'] } },
    { name: 'delete_contact', description: 'Permanently delete a contact by ID.', parameters: { type: 'OBJECT', properties: { contactId: { type: 'INTEGER' } }, required: ['contactId'] } },

    { name: 'search_leads', description: 'Search leads by name to find their ID.', parameters: { type: 'OBJECT', properties: { query: { type: 'STRING' } }, required: ['query'] } },
    { name: 'create_lead', description: 'Create a new sales lead.', parameters: { type: 'OBJECT', properties: { name: { type: 'STRING' }, email: { type: 'STRING' }, company: { type: 'STRING' }, source: { type: 'STRING', description: 'website, referral, social, email, event, or other' }, stage: { type: 'STRING', description: 'inbox, discovery, proposal, negotiation, won, or lost' }, score: { type: 'INTEGER', description: '0-100' }, notes: { type: 'STRING' } }, required: ['name'] } },
    { name: 'update_lead', description: 'Update fields on an existing lead by ID, such as stage, status, or score.', parameters: { type: 'OBJECT', properties: { leadId: { type: 'INTEGER' }, status: { type: 'STRING', description: 'new, contacted, qualified, unqualified, or converted' }, stage: { type: 'STRING', description: 'inbox, discovery, proposal, negotiation, won, or lost' }, score: { type: 'INTEGER' }, notes: { type: 'STRING' } }, required: ['leadId'] } },
    { name: 'delete_lead', description: 'Permanently delete a lead by ID.', parameters: { type: 'OBJECT', properties: { leadId: { type: 'INTEGER' } }, required: ['leadId'] } },

    { name: 'list_deals', description: 'List all deals in the pipeline with their IDs.', parameters: { type: 'OBJECT', properties: {} } },
    { name: 'create_deal', description: 'Create a new deal.', parameters: { type: 'OBJECT', properties: { title: { type: 'STRING' }, value: { type: 'NUMBER' }, currency: { type: 'STRING' }, stage: { type: 'STRING', description: 'prospecting, qualification, proposal, negotiation, won, or lost' }, probability: { type: 'INTEGER' }, closeDate: { type: 'STRING', description: 'ISO date, optional' }, contactId: { type: 'INTEGER' }, leadId: { type: 'INTEGER' }, notes: { type: 'STRING' } }, required: ['title'] } },
    { name: 'update_deal', description: 'Update fields on an existing deal by ID, such as stage or value.', parameters: { type: 'OBJECT', properties: { dealId: { type: 'INTEGER' }, stage: { type: 'STRING' }, value: { type: 'NUMBER' }, probability: { type: 'INTEGER' }, closeDate: { type: 'STRING' }, notes: { type: 'STRING' } }, required: ['dealId'] } },
    { name: 'delete_deal', description: 'Permanently delete a deal by ID.', parameters: { type: 'OBJECT', properties: { dealId: { type: 'INTEGER' } }, required: ['dealId'] } },

    { name: 'list_tasks', description: 'List all tasks with their IDs.', parameters: { type: 'OBJECT', properties: {} } },
    { name: 'create_task', description: 'Create a new task.', parameters: { type: 'OBJECT', properties: { title: { type: 'STRING' }, description: { type: 'STRING' }, dueDate: { type: 'STRING', description: 'ISO date, optional' }, priority: { type: 'STRING', description: 'low, medium, high, or urgent' } }, required: ['title'] } },
    { name: 'update_task', description: 'Update a task by ID, such as marking it complete.', parameters: { type: 'OBJECT', properties: { taskId: { type: 'INTEGER' }, status: { type: 'STRING', description: 'pending, in_progress, completed, or cancelled' }, title: { type: 'STRING' }, dueDate: { type: 'STRING' }, priority: { type: 'STRING' } }, required: ['taskId'] } },
    { name: 'delete_task', description: 'Permanently delete a task by ID.', parameters: { type: 'OBJECT', properties: { taskId: { type: 'INTEGER' } }, required: ['taskId'] } },

    { name: 'list_events', description: 'List upcoming calendar events with their IDs.', parameters: { type: 'OBJECT', properties: {} } },
    { name: 'create_event', description: 'Create a calendar event.', parameters: { type: 'OBJECT', properties: { title: { type: 'STRING' }, description: { type: 'STRING' }, startTime: { type: 'STRING', description: 'ISO datetime' }, endTime: { type: 'STRING', description: 'ISO datetime' }, location: { type: 'STRING' } }, required: ['title', 'startTime', 'endTime'] } },
    { name: 'update_event', description: 'Update a calendar event by ID.', parameters: { type: 'OBJECT', properties: { eventId: { type: 'INTEGER' }, title: { type: 'STRING' }, startTime: { type: 'STRING' }, endTime: { type: 'STRING' }, location: { type: 'STRING' } }, required: ['eventId'] } },
    { name: 'delete_event', description: 'Permanently delete a calendar event by ID.', parameters: { type: 'OBJECT', properties: { eventId: { type: 'INTEGER' } }, required: ['eventId'] } },

    { name: 'send_email', description: 'Send a real email to a contact by ID. Use search_contacts first to find the contactId if you only have a name.', parameters: { type: 'OBJECT', properties: { contactId: { type: 'INTEGER' }, subject: { type: 'STRING' }, body: { type: 'STRING', description: 'Plain text email body, will be formatted into paragraphs automatically' } }, required: ['contactId', 'subject', 'body'] } },
  ],
}];

function buildExecutor(userId) {
  return async function executeFunction(name, args) {
    switch (name) {
      case 'search_contacts': {
        const all = await contactModel.allByUser(userId);
        const q = (args.query || '').toLowerCase();
        return all.filter((c) => c.name.toLowerCase().includes(q)).map((c) => ({ id: c.id, name: c.name, email: c.email, company: c.company }));
      }
      case 'create_contact': {
        const c = await contactModel.create({ userId, ...args });
        return { id: c.id, name: c.name };
      }
      case 'update_contact': {
        const { contactId, ...updates } = args;
        const c = await contactModel.updateById(contactId, userId, updates);
        if (!c) throw new Error('Contact not found');
        return { id: c.id, name: c.name };
      }
      case 'delete_contact': {
        const ok = await contactModel.deleteById(args.contactId, userId);
        if (!ok) throw new Error('Contact not found');
        return { deleted: true };
      }

      case 'search_leads': {
        const all = await leadModel.allByUser(userId);
        const q = (args.query || '').toLowerCase();
        return all.filter((l) => l.name.toLowerCase().includes(q)).map((l) => ({ id: l.id, name: l.name, stage: l.stage, score: l.score }));
      }
      case 'create_lead': {
        const l = await leadModel.create({ userId, ...args });
        return { id: l.id, name: l.name };
      }
      case 'update_lead': {
        const { leadId, ...updates } = args;
        const l = await leadModel.updateById(leadId, userId, updates);
        if (!l) throw new Error('Lead not found');
        return { id: l.id, name: l.name, stage: l.stage };
      }
      case 'delete_lead': {
        const ok = await leadModel.deleteById(args.leadId, userId);
        if (!ok) throw new Error('Lead not found');
        return { deleted: true };
      }

      case 'list_deals': {
        const all = await dealModel.allByUser(userId);
        return all.map((d) => ({ id: d.id, title: d.title, stage: d.stage, value: d.value }));
      }
      case 'create_deal': {
        const d = await dealModel.create({ userId, ...args });
        return { id: d.id, title: d.title };
      }
      case 'update_deal': {
        const { dealId, ...updates } = args;
        const d = await dealModel.updateById(dealId, userId, updates);
        if (!d) throw new Error('Deal not found');
        return { id: d.id, title: d.title, stage: d.stage };
      }
      case 'delete_deal': {
        const ok = await dealModel.deleteById(args.dealId, userId);
        if (!ok) throw new Error('Deal not found');
        return { deleted: true };
      }

      case 'list_tasks': {
        const result = await taskModel.findAllByUser(userId, { limit: 50 });
        return result.data.map((t) => ({ id: t.id, title: t.title, status: t.status, dueDate: t.dueDate }));
      }
      case 'create_task': {
        const t = await taskModel.create({ userId, ...args });
        return { id: t.id, title: t.title };
      }
      case 'update_task': {
        const { taskId, ...updates } = args;
        const t = await taskModel.updateById(taskId, userId, updates);
        if (!t) throw new Error('Task not found');
        return { id: t.id, title: t.title, status: t.status };
      }
      case 'delete_task': {
        const ok = await taskModel.deleteById(args.taskId, userId);
        if (!ok) throw new Error('Task not found');
        return { deleted: true };
      }

      case 'list_events': {
        const all = await eventModel.findAllByUser(userId, {});
        return all.map((e) => ({ id: e.id, title: e.title, startTime: e.startTime }));
      }
      case 'create_event': {
        const e = await eventModel.create({ userId, ...args });
        return { id: e.id, title: e.title };
      }
      case 'update_event': {
        const { eventId, ...updates } = args;
        const e = await eventModel.updateById(eventId, userId, updates);
        if (!e) throw new Error('Event not found');
        return { id: e.id, title: e.title };
      }
      case 'delete_event': {
        const ok = await eventModel.deleteById(args.eventId, userId);
        if (!ok) throw new Error('Event not found');
        return { deleted: true };
      }

      case 'send_email': {
        const contact = await contactModel.findById(args.contactId);
        if (!contact || contact.userId !== userId) throw new Error('Contact not found');
        if (!contact.email) throw new Error('This contact has no email address on file');
        const bodyHtml = '<p>' + String(args.body).replace(/\n/g, '</p><p>') + '</p>';
        const campaign = await campaignModel.create({ userId, name: 'AI Email - ' + contact.name, subject: args.subject, body: bodyHtml, recipientContactIds: [contact.id] });
        await sendEmail({ to: contact.email, subject: args.subject, html: bodyHtml });
        await campaignModel.updateById(campaign.id, userId, { status: 'sent', sentAt: new Date().toISOString(), sentCount: 1 });
        return { sent: true, to: contact.email };
      }

      default:
        throw new Error('Unknown function: ' + name);
    }
  };
}

async function chat(req, res, next) {
  try {
    const { message } = req.body;
    if (!message) throw new AppError('message is required', 400);

    const [snapshot, history] = await Promise.all([
      buildPipelineSnapshot(req.user.id),
      chatMessageModel.findAllByUser(req.user.id, { limit: 20 }),
    ]);
    const executor = buildExecutor(req.user.id);

    const systemInstruction = `You are an AI assistant embedded in Pulse CRM, a sales CRM tool. You can both answer questions and take real actions using the tools provided (create, update, delete, search, and email contacts, leads, deals, tasks, and calendar events).

Rules:
- If the user asks you to create, update, delete, or email something and names it by name rather than ID, use the matching search tool first (search_contacts or search_leads) to find the correct ID before acting.
- If a search returns more than one plausible match, ask the user to clarify which one instead of guessing.
- If a search returns no matches, tell the user you could not find that record rather than inventing one.
- Before deleting anything, proceed only if the user's request was clearly a deletion request — do not delete as a side effect of an unrelated request.
- After taking action(s), summarize plainly what you did in your final reply. Keep it concise.
- If the user is just asking a question with no action needed, answer directly using the live CRM data snapshot below. If the question needs data not present, say so rather than inventing numbers.
- If the user asks you to research a person, company, or topic that is not in the CRM (for example, finding a prospect's company website, looking up general information, or checking something current), use Google Search to find real information rather than guessing.

${snapshot}`;

    const { reply } = await generateWithTools({
      systemInstruction,
      prompt: message,
      tools: TOOLS,
      executeFunction: executor,
      history: history.map((h) => ({ role: h.role, content: h.content })),
      temperature: 0.4,
    });

    await Promise.all([
      chatMessageModel.create({ userId: req.user.id, role: 'user', content: message }),
      chatMessageModel.create({ userId: req.user.id, role: 'assistant', content: reply }),
    ]);

    res.json({ success: true, reply });
  } catch (err) { next(err); }
}

module.exports = { summarizeLeads, generateFollowUpEmail, analyzeConversation, predictDealSuccess, recommendNextActions, chat };
