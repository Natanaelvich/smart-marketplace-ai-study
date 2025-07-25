import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DatabaseService } from '../src/shared/database.service';
import { chatSessions, chatMessages } from '../src/shared/schema';

describe('Chat (e2e)', () => {
  let app: INestApplication;
  let dbService: DatabaseService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.enableShutdownHooks();
    await app.init();
    dbService = moduleFixture.get<DatabaseService>(DatabaseService);
    await dbService.db.delete(chatMessages);
    await dbService.db.delete(chatSessions);
  });

  afterEach(async () => {
    await app.close();
  });

  it('should create a new chat session', async () => {
    const postResponse = await request(app.getHttpServer()).post('/chat');
    expect(postResponse.status).toBe(201);
    const postBody = postResponse.body as { id: number };
    expect(postBody).toHaveProperty('id');
    const getResponse = await request(app.getHttpServer()).get(
      '/chat/' + postBody.id,
    );
    expect(getResponse.status).toBe(200);
    const getBody = getResponse.body as { id: number; createdAt: string };
    expect(getBody).toHaveProperty('id', postBody.id);
    expect(getBody).toHaveProperty('createdAt');
  });

  it('should add new messages to chat session', async () => {
    const postResponse = await request(app.getHttpServer()).post('/chat');
    expect(postResponse.status).toBe(201);
    const sessionId = (postResponse.body as { id: number }).id;
    const messageResponse = await request(app.getHttpServer())
      .post(`/chat/${sessionId}/messages`)
      .send({ content: 'Hello, world!' });
    expect(messageResponse.status).toBe(201);
    const messageBody = messageResponse.body as { id: number; content: string };
    expect(messageBody).toHaveProperty('id');
    expect(messageBody).toHaveProperty('content', 'Hello, world!');
  });
});
