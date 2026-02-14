import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { withAdminAccess } from '@/lib/server/auth';
import {
  getTimeRecordsByUser,
  getUserMonthlyGoal,
  createAIReport,
  getExistingAIReport,
} from '@/lib/server/firestore';
import { adminAuth } from '@/lib/firebase/admin';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  return withAdminAccess(request, async (adminUserId) => {
    const body = await request.json();
    const { userId, month, forceRegenerate } = body;

    if (!userId || !month) {
      return Response.json(
        { error: 'userId and month are required' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 500 }
      );
    }

    try {
      // Verificar se já existe relatório para este mês
      if (!forceRegenerate) {
        const existingReport = await getExistingAIReport(userId, month);
        if (existingReport) {
          return Response.json({
            success: true,
            report: existingReport.reportContent,
            stats: existingReport.stats,
            reportId: existingReport.id,
            isExisting: true,
            generatedAt: existingReport.createdAt,
          });
        }
      }
      // Buscar informações do usuário
      const authUser = await adminAuth.getUser(userId);
      const userName = authUser.displayName || authUser.email || 'Colaborador';

      // Buscar registros do mês
      const allRecords = await getTimeRecordsByUser(userId);
      const monthRecords = allRecords.filter((record) => record.date.startsWith(month));

      // Buscar meta mensal
      const monthlyGoal = await getUserMonthlyGoal(userId, month);

      // Calcular estatísticas
      const workRecords = monthRecords.filter((r) => r.type === 'work');
      const timeOffRecords = monthRecords.filter((r) => r.type === 'time_off');

      const totalWorkHours = workRecords.reduce((sum, r) => sum + r.totalHours, 0);
      const totalTimeOffHours = timeOffRecords.reduce((sum, r) => sum + r.totalHours, 0);
      const netHours = totalWorkHours - totalTimeOffHours;
      const goalDifference = netHours - monthlyGoal;

      // Preparar descrições para análise
      const descriptions = monthRecords
        .filter((r) => r.description && r.description.trim().length > 0)
        .map((r) => ({
          date: r.date,
          type: r.type === 'work' ? 'Trabalho' : 'Folga',
          hours: r.totalHours,
          description: r.description,
        }));

      // Criar prompt para o Gemini
      const prompt = `Você é um analista de RH especializado em análise de desempenho e produtividade.
Analise os dados do colaborador abaixo e gere um relatório profissional e detalhado.

**COLABORADOR:** ${userName}
**PERÍODO:** ${month}

**ESTATÍSTICAS:**
- Meta Mensal: ${monthlyGoal} horas
- Horas Trabalhadas: ${totalWorkHours.toFixed(1)} horas
- Horas de Folga: ${totalTimeOffHours.toFixed(1)} horas
- Total Líquido: ${netHours.toFixed(1)} horas
- Diferença da Meta: ${goalDifference > 0 ? '+' : ''}${goalDifference.toFixed(1)} horas
- Total de Registros: ${monthRecords.length}
- Registros de Trabalho: ${workRecords.length}
- Registros de Folga: ${timeOffRecords.length}

**DESCRIÇÕES DAS ATIVIDADES:**
${descriptions.length > 0
  ? descriptions.map((d, i) => `
${i + 1}. Data: ${d.date} | Tipo: ${d.type} | Horas: ${d.hours}h
   Atividade: ${d.description}
`).join('\n')
  : 'Nenhuma descrição detalhada disponível.'}

**INSTRUÇÕES PARA O RELATÓRIO:**
1. Forneça uma análise geral do desempenho do colaborador
2. Destaque pontos positivos e áreas de melhoria
3. Analise a produtividade com base nas descrições das atividades
4. Comente sobre o cumprimento da meta mensal
5. Identifique padrões de trabalho (se houver)
6. Sugira recomendações para o gestor
7. Use um tom profissional mas acessível
8. Estruture o relatório em seções claras com títulos

**FORMATO:**
Use Markdown para formatar o relatório com:
- Títulos (##) para seções
- Listas com bullet points
- Negrito para destaques importantes
- Parágrafos bem organizados`;

      // Inicializar Gemini
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

      // Gerar conteúdo
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const reportText = response.text();

      // Obter informações do admin que gerou o relatório
      const adminUser = await adminAuth.getUser(adminUserId);
      const adminName = adminUser.displayName || adminUser.email || 'Admin';

      // Salvar relatório no Firestore
      const reportId = crypto.randomUUID();
      const reportData = {
        id: reportId,
        userId,
        userName,
        userEmail: authUser.email,
        month,
        reportContent: reportText,
        generatedBy: adminUserId,
        generatedByName: adminName,
        stats: {
          totalWorkHours,
          totalTimeOff: totalTimeOffHours,
          netHours,
          monthlyGoal,
          goalDifference,
          recordsCount: monthRecords.length,
        },
        createdAt: new Date().toISOString(),
      };

      await createAIReport(reportData);

      return Response.json({
        success: true,
        report: reportText,
        stats: reportData.stats,
        reportId,
        isExisting: false,
        generatedAt: reportData.createdAt,
      });
    } catch (error: any) {
      console.error('Error generating report:', error);
      return Response.json(
        { error: 'Failed to generate report', details: error.message },
        { status: 500 }
      );
    }
  });
}
