import { NextRequest } from 'next/server';
import { withUserAccess } from '@/lib/server/auth';
import { getGitHubProjects } from '@/lib/server/github';

export async function GET(request: NextRequest) {
  return withUserAccess(request, async () => {
    try {
      const projects = getGitHubProjects();

      // Retornar apenas informações públicas (sem tokens)
      const publicProjects = projects.map((p) => ({
        id: p.id,
        name: p.name,
        repo: p.repo,
      }));

      return Response.json({ success: true, projects: publicProjects });
    } catch (error: any) {
      console.error('Error fetching GitHub projects:', error);
      return Response.json(
        { error: 'Failed to fetch GitHub projects', details: error.message },
        { status: 500 }
      );
    }
  });
}
