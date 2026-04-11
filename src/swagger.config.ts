// src/swagger.config.ts
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Durian Classifier API')
    .setDescription(
      `## Backend API untuk Aplikasi Klasifikasi Varietas Durian

### Autentikasi
Semua endpoint yang dilindungi memerlukan **Bearer JWT token**.

\`\`\`
Authorization: Bearer <access_token>
\`\`\`

Token didapat dari endpoint \`POST /api/v1/auth/login\` atau \`POST /api/v1/auth/register\`.

### Flow Utama
1. **Register / Login** → Dapatkan \`accessToken\`
2. **Upload gambar** → \`POST /api/v1/storage/upload\` → Dapatkan \`imageUrl\`
3. **Buat prediksi** → \`POST /api/v1/predictions\` dengan \`imageUrl\`
4. **Pantau status AI** → \`GET /api/v1/ai/status/current\` atau SSE \`GET /api/v1/ai/status\`
5. **Ambil hasil** → \`GET /api/v1/predictions/:id\`

### Rate Limiting
| Endpoint | Limit |
|----------|-------|
| POST /auth/login | 5 req/menit |
| POST /auth/register | 5 req/menit |
| Endpoint lain | 100 req/menit |
`,
    )
    .setVersion('1.0.0')
    .setContact('Durian API Support', '', 'support@example.com')
    .addBearerAuth(
      {
        type:         'http',
        scheme:       'bearer',
        bearerFormat: 'JWT',
        name:         'Authorization',
        description:  'Masukkan JWT token. Contoh: Bearer eyJhbGc...',
        in:           'header',
      },
      'JWT',
    )
    .addTag('Auth',        'Registrasi dan login pengguna')
    .addTag('Users',       'Manajemen profil pengguna')
    .addTag('Predictions', 'Submit dan lihat hasil klasifikasi durian')
    .addTag('Storage',     'Upload dan hapus file gambar')
    .addTag('AI Health',   'Status koneksi dan kesiapan model AI')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization:    true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 3,
      docExpansion:            'list',
      filter:                  true,
      showRequestDuration:     true,
    },
    customSiteTitle: 'Durian Classifier API Docs',
    customCss: `
      .swagger-ui .topbar { background-color: #1a7a4a; }
      .swagger-ui .topbar .download-url-wrapper { display: none; }
    `,
  });
}