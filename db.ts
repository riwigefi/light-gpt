import Dexie from 'dexie';

interface Topic {
    id: string;
    name: string;
    createdAt: number;
}

interface Conversation {
    id: string;
    role: string;
    content: string;
    topicId: string;
    createdAt: number;
}

class ChatDatabase extends Dexie {
    topics: Dexie.Table<Topic, string>;
    conversations: Dexie.Table<Conversation, number>;

    constructor() {
        super('ChatDatabase');

        this.version(1).stores({
            topics: 'id, name',
            conversations: 'id, role, content, topicId, createdAt',
        });

        this.topics = this.table('topics');
        this.conversations = this.table('conversations');
    }
}

export class ChatService {
    private db: ChatDatabase;

    constructor() {
        this.db = new ChatDatabase();
    }

    async getTopics(): Promise<Topic[]> {
        const topics = await this.db.topics.toArray();
        topics.sort((a, b) => b.createdAt - a.createdAt);
        return topics;
    }

    async getConversationsByTopicId(topicId: string): Promise<Conversation[]> {
        const conversations = await this.db.conversations
            .where('topicId')
            .equals(topicId)
            .toArray();
        conversations.sort((a, b) => a.createdAt - b.createdAt);
        return conversations;
    }

    async addConversation(conversation: Conversation): Promise<number> {
        return await this.db.conversations.add(conversation);
    }

    async deleteConversationById(conversationId: string): Promise<void> {
        await this.db.conversations.where('id').equals(conversationId).delete();
    }

    async addTopic(topic: Topic): Promise<string> {
        return await this.db.topics.add(topic);
    }

    async deleteTopicById(topicId: string): Promise<void> {
        await this.db.topics.where('id').equals(topicId).delete();
        await this.db.conversations.where('topicId').equals(topicId).delete();
    }

    async updateTopicNameById(topicId: string, name: string): Promise<void> {
        await this.db.topics.update(topicId, { name });
    }
}
