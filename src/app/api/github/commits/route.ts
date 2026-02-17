import { NextRequest } from 'next/server';
import { withUserAccess } from '@/lib/server/auth';
import { getUserSettings } from '@/lib/server/firestore';
import { getGitHubProject, getDefaultGitHubProject } from '@/lib/server/github';

export async function GET(request: NextRequest) {
  return withUserAccess(request, async (userId) => {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return Response.json({ error: 'Date is required (YYYY-MM-DD)' }, { status: 400 });
    }

    try {
      // Buscar configurações do usuário para pegar o username do GitHub
      const settings = await getUserSettings(userId);

      if (!settings?.githubUsername) {
        return Response.json(
          { error: 'GitHub username not configured in user settings' },
          { status: 400 }
        );
      }

      // Buscar projeto do GitHub (do usuário ou padrão)
      let project = settings.githubProjectId
        ? getGitHubProject(settings.githubProjectId)
        : getDefaultGitHubProject();

      if (!project) {
        return Response.json(
          { error: 'GitHub integration not configured. Contact administrator.' },
          { status: 500 }
        );
      }

      const githubToken = project.token;
      const githubRepo = project.repo;

      // Calcular intervalo de data (00:00 até 23:59 do dia)
      const startDate = new Date(date + 'T00:00:00Z');
      const endDate = new Date(date + 'T23:59:59Z');

      // Determinar branch: preferência do usuário > branch do projeto (env) > sem filtro
      const branch = settings.githubBranch || project.branch || null;

      // Buscar commits do GitHub API
      const branchParam = branch ? `&sha=${encodeURIComponent(branch)}` : '';
      const url = `https://api.github.com/repos/${githubRepo}/commits?author=${settings.githubUsername}&since=${startDate.toISOString()}&until=${endDate.toISOString()}${branchParam}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Banco-de-Horas-App',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('GitHub API error:', errorText);
        return Response.json(
          { error: 'Failed to fetch commits from GitHub', details: errorText },
          { status: response.status }
        );
      }

      const commits = await response.json();

      // Formatar commits para markdown
      const formattedCommits = commits.map((commit: any) => {
        const message = commit.commit.message;
        const sha = commit.sha.substring(0, 7);
        const time = new Date(commit.commit.author.date).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        });
        return `- **[${sha}]** ${message} _(${time})_`;
      });

      const markdown =
        formattedCommits.length > 0
          ? `### 🔨 Commits do GitHub (${date})\n\n${formattedCommits.join('\n')}\n\n`
          : '';

      return Response.json({
        success: true,
        commits: commits.map((c: any) => ({
          sha: c.sha,
          message: c.commit.message,
          date: c.commit.author.date,
          url: c.html_url,
        })),
        markdown,
        count: commits.length,
      });
    } catch (error: any) {
      console.error('Error fetching GitHub commits:', error);
      return Response.json(
        { error: 'Failed to fetch commits', details: error.message },
        { status: 500 }
      );
    }
  });
}
